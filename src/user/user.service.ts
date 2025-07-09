import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { parseCsv } from "./util";
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

    async getLogbook(userId: number) {
        const logbook = await this.prisma.logbookEntry.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: {
                user: true,
                plan: true,
                crew: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        profilePictureUrl: true,
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

        let parsed = await parseCsv(buffer, userId, fileSource);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("No valid logbook entries found in the file");
        }

        // Add each entry to the database but ensure to handle duplicates
        const responses: LogbookEntry[] = [];
        for (const entry of parsed) {
            try {
                let response = await this.prisma.logbookEntry
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

    async deleteLogbookEntries(userId: number, entryIds: number[]) {
        if (!entryIds?.length) {
            throw new Error("No entry IDs provided");
        }

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
}
