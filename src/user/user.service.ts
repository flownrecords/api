import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { parseCsv, parseKml, parseUnique } from "./util";
import { LogbookEntry } from "@prisma/client";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async getAllUsers() {
        const users = await this.prisma.user.findMany();
        return users.map(({ passwordHash, ...rest }) => rest);
    }

    async getUserById(id: number) {
        if (!id) {
            throw new Error("User ID is required");
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                logbookEntries: {
                    include: {
                        plan: true,
                        crew: true,
                    },
                },
                crewForEntries: true,
                organization: true,
            },
        });
        if (!user) {
            throw new Error("User not found");
        }

        const { passwordHash, ...rest } = user;
        return rest;
    }

    async getUserByUsername(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                logbookEntries: {
                    include: {
                        plan: true,
                        crew: true,
                    },
                },
                crewForEntries: true,
                organization: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const { passwordHash, ...rest } = user;
        return rest;
    }

    async getUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                logbookEntries: {
                    include: {
                        plan: true,
                        crew: true,
                    },
                },
                crewForEntries: true,
                organization: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const { passwordHash, ...rest } = user;
        return rest;
    }

    async updateUser(id: number, userData: any) {
        if (!id || !userData) {
            throw new Error("User ID and data are required");
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: userData,
        });

        return updatedUser;
    }

    async getLogbook(userId: number, page: number = 1, limit: number = 100) {
        // Validate pagination parameters
        const validatedPage = Math.max(1, page);
        const validatedLimit = Math.min(Math.max(1, limit), 1000); // Max 1000 entries per page
        const skip = (validatedPage - 1) * validatedLimit;

        const [logbook, totalCount] = await Promise.all([
            this.prisma.logbookEntry.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" }, // Most recent first
                skip,
                take: validatedLimit,
                include: {
                    user: true,
                    plan: true,
                    recording: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            // Don't include coords by default to save memory
                        },
                    },
                    crew: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            profilePictureUrl: true,
                            organizationId: true,
                            organizationRole: true,
                            organization: true,
                            location: true,
                            bio: true,
                            publicProfile: true,
                        },
                    },
                },
            }),
            this.prisma.logbookEntry.count({
                where: { userId },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / validatedLimit);

        return {
            data: logbook.map((entry) => {
                const { passwordHash, ...rest } = entry.user;
                return {
                    ...entry,
                    user: rest,
                };
            }),
            pagination: {
                page: validatedPage,
                limit: validatedLimit,
                totalCount,
                totalPages,
                hasNext: validatedPage < totalPages,
                hasPrev: validatedPage > 1,
            },
        };
    }

    async editLogbookEntry(userId: number, entryId: number, entryData: any) {
        if (!entryId || !entryData) {
            throw new Error("Entry ID and data are required");
        }

        const existingEntry = await this.prisma.logbookEntry.findUnique({
            where: { id: entryId, userId },
        });

        if (!existingEntry) {
            throw new Error("Logbook entry not found");
        }

        const updatedEntry = await this.prisma.logbookEntry.update({
            where: { id: entryId },
            data: {
                ...entryData,
                user: {
                    connect: { id: userId },
                },
            },
        });

        return updatedEntry;
    }

    async updateLogbook(userId: number, fileSource: string, file: any) {
        if (!fileSource) {
            throw new Error("File source is required");
        }

        const buffer = file?.buffer;
        if (!buffer) {
            throw new Error("No file data provided");
        }

        const parsed = await parseCsv(buffer, userId, fileSource);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("No valid logbook entries found in the file");
        }

        // Process entries in batches to prevent memory overflow
        const batchSize = 500; // Process 500 entries at a time
        const responses: LogbookEntry[] = [];

        for (let i = 0; i < parsed.length; i += batchSize) {
            const batch = parsed.slice(i, i + batchSize);

            // Process current batch
            const batchResponses = await this.processBatch(batch, userId);
            responses.push(...batchResponses);

            // Optional: Add a small delay between batches to reduce memory pressure
            if (i + batchSize < parsed.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return responses;
    }

    private async processBatch(entries: any[], userId: number): Promise<LogbookEntry[]> {
        const responses: LogbookEntry[] = [];

        for (const entry of entries) {
            try {
                const response = await this.prisma.logbookEntry
                    .create({
                        data: {
                            ...entry,
                            user: {
                                connect: { id: userId },
                            },
                            crew: {
                                connect: [],
                            },
                        },
                    })
                    .catch((e) => {
                        if (e.code !== "P2002") {
                            console.error("Error inserting logbook entry:", e);
                        }
                    });
                if (response) {
                    responses.push(response);
                }
            } catch (error) {
                // Handle duplicate entries or other errors gracefully
                console.error("Error inserting logbook entry:", error);
            }
        }

        return responses;
    }

    async addLogbookEntry(userId: number, entryData: any) {
        if (!userId) {
            throw new Error("User ID is required");
        }

        if (!entryData) {
            throw new Error("Entry data is required");
        }

        const newEntry = await this.prisma.logbookEntry.create({
            data: {
                unique: parseUnique(userId, entryData),
                ...entryData,
                user: {
                    connect: { id: userId },
                },
                crew: {
                    connect: [
                        ...(entryData.crew || []).map((crewMember: any) => ({
                            id: crewMember.id,
                        })),
                    ].filter((c) => c.id),
                },
            },
            include: {
                user: true,
                plan: true,
                crew: true,
            },
        });

        const { passwordHash, ...rest } = newEntry.user;
        return {
            ...newEntry,
            user: rest,
        };
    }

    async deleteLogbookEntries(userId: number, entryIds: number[]) {
        if (!entryIds?.length) {
            throw new Error("No entry IDs provided");
        }

        await this.prisma.flightPlan.updateMany({
            where: {
                logbookEntryId: { in: entryIds },
            },
            data: {
                logbookEntryId: undefined,
            },
        });

        const deletedEntries = await this.prisma.logbookEntry.deleteMany({
            where: {
                id: { in: entryIds },
                userId,
            },
        });

        if (deletedEntries.count === 0) {
            throw new Error("No entries found to delete");
        }

        return {
            message: `${deletedEntries.count} entr${deletedEntries.count > 1 ? "ies" : "y"} deleted successfully`,
        };
    }

    async addCrewToLogbookEntry(userId: number, entryId: number, crewUsername: string | string[]) {
        const usernames = Array.isArray(crewUsername) ? crewUsername : [crewUsername];

        const crewUsers = await this.prisma.user.findMany({
            where: {
                username: { in: usernames },
            },
            select: { id: true },
        });

        if (!crewUsers.length) {
            throw new NotFoundException("No valid crew members found to add.");
        }

        const updatedEntry = await this.prisma.logbookEntry.update({
            where: { id: entryId },
            data: {
                crew: {
                    connect: crewUsers.map((user) => ({ id: user.id })),
                },
            },
            include: { crew: true },
        });

        return updatedEntry;
    }

    async removeCrewToLogbookEntry(
        userId: number,
        entryId: number,
        crewUsername: string | string[],
    ) {
        const usernames = Array.isArray(crewUsername) ? crewUsername : [crewUsername];

        const crewUsers = await this.prisma.user.findMany({
            where: {
                username: { in: usernames },
                organizationId: (await this.prisma.user.findUnique({ where: { id: userId } }))
                    ?.organizationId,
            },
            select: { id: true },
        });

        if (!crewUsers.length) {
            throw new NotFoundException("No matching crew members found to remove.");
        }

        const updatedEntry = await this.prisma.logbookEntry.update({
            where: { id: entryId },
            data: {
                crew: {
                    disconnect: crewUsers.map((user) => ({ id: user.id })),
                },
            },
            include: { crew: true },
        });

        return updatedEntry;
    }

    async uploadRecording(
        userId: number,
        body: { entryId: number; fileSource: string },
        file: Express.Multer.File,
    ) {
        const { entryId, fileSource } = body;

        if (!fileSource) {
            throw new Error("File source is required");
        }

        const data = await parseKml(fileSource, file.buffer);
        if (!data || !data.coords || data.coords.length === 0) {
            throw new Error("No valid recording data found in the file");
        }

        // Optimize coordinate data before storage
        const optimizedCoords = this.optimizeCoordinates(data.coords);

        // Create file recording in database and link it with the entry
        try {
            const recording = await this.prisma.flightRecording.create({
                data: {
                    name: data.name,
                    description: data.description,
                    coords: optimizedCoords.map((placemark: any) => ({ ...placemark })),
                    logbookEntry: {
                        connect: { id: Number(entryId) },
                    },
                },
            });

            return recording;
        } catch (error) {
            console.error("Error creating flight recording:", error);
            throw new Error("Failed to create flight recording");
        }
    }

    private optimizeCoordinates(coords: any[]): any[] {
        // If coordinates are too many, downsample to reduce memory usage
        if (coords.length <= 5000) {
            return coords;
        }

        // Simple downsampling: take every nth coordinate to reduce dataset size
        const downsampleFactor = Math.ceil(coords.length / 5000);
        const downsampled = coords.filter((_, index) => index % downsampleFactor === 0);

        // Always include the first and last coordinates
        if (downsampled[0] !== coords[0]) {
            downsampled.unshift(coords[0]);
        }
        if (downsampled[downsampled.length - 1] !== coords[coords.length - 1]) {
            downsampled.push(coords[coords.length - 1]);
        }

        return downsampled;
    }

    async getFlightRecording(userId: number, recordingId: number) {
        if (!recordingId) {
            throw new Error("Recording ID is required");
        }

        const recording = await this.prisma.flightRecording.findFirst({
            where: {
                id: recordingId,
                logbookEntry: {
                    userId: userId, // Ensure user owns the logbook entry
                },
            },
            include: {
                logbookEntry: {
                    select: {
                        id: true,
                        date: true,
                        depAd: true,
                        arrAd: true,
                        aircraftType: true,
                        aircraftRegistration: true,
                    },
                },
            },
        });

        if (!recording) {
            throw new Error("Flight recording not found or access denied");
        }

        return recording;
    }
}
