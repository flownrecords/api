import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { parseCsv, parseKml, parseUnique, calculateUserStats, generateReportImage, UserInfo } from "./util";
// import { LogbookEntry } from "@prisma/client";

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

    async getLogbook(userId: number) {
        const logbook = await this.prisma.logbookEntry.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: {
                user: true,
                plan: true,
                recording: false,
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
        });

        return logbook.map((entry) => {
            const { passwordHash, ...rest } = entry.user;
            return {
                ...entry,
                user: rest,
            };
        });
    }

    async getLogbookEntry(userId: number, entryId: number) {
        if (!entryId) {
            throw new Error("Entry ID is required");
        }

        entryId = Number(entryId);

        const entry = await this.prisma.logbookEntry.findUnique({
            where: { id: entryId, userId },
            include: {
                user: true,
                plan: true,
                recording: true,
                crew: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        profilePictureUrl: true,
                        organizationId: true,
                        organizationRole: true,
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                            },
                        },
                        location: true,
                        bio: true,
                        publicProfile: true,
                    },
                },
            },
        });

        if (!entry) {
            throw new NotFoundException("Logbook entry not found");
        }

        const { passwordHash, ...rest } = entry.user;
        return {
            ...entry,
            user: rest,
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

        // Add each entry to the database but ensure to handle duplicates
        const responses: any[] = [];
        for (const entry of parsed) {
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

        // Create file recording in database and like it with the entry
        try {
            const recording = await this.prisma.flightRecording.create({
                data: {
                    name: data.name,
                    description: data.description,
                    coords: data.coords.map((placemark: any) => ({ ...placemark })),
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

    async generateReport(userId: number): Promise<Buffer> {
        if (!userId) {
            throw new Error("User ID is required");
        }

        // Get user information
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                username: true,
                profilePictureUrl: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Get user's logbook
        const logbook = await this.getLogbook(userId);

        // Calculate statistics
        const stats = calculateUserStats(logbook);

        // Prepare user info
        const userInfo: UserInfo = {
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            username: user.username,
            profilePictureUrl: user.profilePictureUrl || undefined,
        };

        // Generate and return the report image
        return await generateReportImage(userInfo, stats);
    }
}
