import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseCsv, parseCsvStreaming } from "../util/logbook.parser";
import { uploadConfig } from "../../config/upload.config";

describe("UserService Memory Optimization", () => {
    let service: UserService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: {
                        logbookEntry: {
                            findMany: jest.fn(),
                            count: jest.fn(),
                            create: jest.fn(),
                        },
                        flightRecording: {
                            create: jest.fn(),
                            findFirst: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    describe("getLogbook pagination", () => {
        it("should return paginated results with correct metadata", async () => {
            const mockLogbook = [
                { id: 1, userId: 1, user: { id: 1, passwordHash: "hash" } },
                { id: 2, userId: 1, user: { id: 1, passwordHash: "hash" } },
            ];

            jest.spyOn(prismaService.logbookEntry, "findMany").mockResolvedValue(mockLogbook);
            jest.spyOn(prismaService.logbookEntry, "count").mockResolvedValue(25);

            const result = await service.getLogbook(1, 1, 10);

            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                totalCount: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: false,
            });
            expect(result.data).toHaveLength(2);
        });

        it("should enforce maximum limit per page", async () => {
            jest.spyOn(prismaService.logbookEntry, "findMany").mockResolvedValue([]);
            jest.spyOn(prismaService.logbookEntry, "count").mockResolvedValue(0);

            await service.getLogbook(1, 1, 2000); // Request more than max

            expect(prismaService.logbookEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1000, // Should be capped at 1000
                }),
            );
        });
    });

    describe("updateLogbook batch processing", () => {
        it("should process entries in batches", async () => {
            const mockEntries = Array.from({ length: 1200 }, (_, i) => ({ id: i }));
            jest.spyOn(service as any, "processBatch").mockResolvedValue([]);

            await service.updateLogbook(1, "FLIGHTLOGGER", { buffer: Buffer.from("mock") });

            // Should call processBatch 3 times for 1200 entries (500 + 500 + 200)
            expect((service as any).processBatch).toHaveBeenCalledTimes(3);
        });
    });

    describe("coordinate optimization", () => {
        it("should downsample large coordinate datasets", () => {
            const largeCoords = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
            const optimized = (service as any).optimizeCoordinates(largeCoords);

            expect(optimized.length).toBeLessThanOrEqual(5002); // 5000 + first + last
            expect(optimized[0]).toEqual(largeCoords[0]); // First coordinate preserved
            expect(optimized[optimized.length - 1]).toEqual(largeCoords[largeCoords.length - 1]); // Last coordinate preserved
        });

        it("should not downsample small coordinate datasets", () => {
            const smallCoords = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            const optimized = (service as any).optimizeCoordinates(smallCoords);

            expect(optimized).toEqual(smallCoords);
        });
    });
});

describe("CSV Parser Memory Optimization", () => {
    describe("file size validation", () => {
        it("should reject files exceeding size limit", () => {
            const mockFile = {
                originalname: "test.csv",
                size: uploadConfig.maxCsvFileSize + 1,
            };

            const callback = jest.fn();
            const csvFilter = require("../util/logbook.parser").csvFilter;

            csvFilter(null, mockFile, callback);

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("exceeds maximum limit"),
                }),
                false,
            );
        });

        it("should accept files within size limit", () => {
            const mockFile = {
                originalname: "test.csv",
                size: uploadConfig.maxCsvFileSize - 1,
            };

            const callback = jest.fn();
            const csvFilter = require("../util/logbook.parser").csvFilter;

            csvFilter(null, mockFile, callback);

            expect(callback).toHaveBeenCalledWith(null, true);
        });
    });
});
