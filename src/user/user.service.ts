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
        const responses: LogbookEntry[] = [];
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

    async generateUserReport(userId: number) {
        // Get user information
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Get logbook entries for statistics
        const logbookEntries = await this.prisma.logbookEntry.findMany({
            where: { userId },
            include: {
                crew: true,
            },
        });

        // Calculate statistics
        const stats = this.calculateLogbookStatistics(logbookEntries);
        
        // Generate SVG image
        const svgImage = this.generateReportSVG(user, stats);
        
        return {
            contentType: 'image/svg+xml',
            data: svgImage
        };
    }

    private calculateLogbookStatistics(entries: any[]) {
        if (!entries || entries.length === 0) {
            return {
                totalFlights: 0,
                totalHours: 0,
                totalLandings: 0,
                topAirports: [],
                topAircraft: [],
                dayHours: 0,
                nightHours: 0,
                picHours: 0,
                instructorHours: 0,
                monthsActive: 0
            };
        }

        const totalFlights = entries.length;
        const totalHours = entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
        const totalLandings = entries.reduce((sum, entry) => sum + (entry.landDay || 0) + (entry.landNight || 0), 0);
        
        // Most visited airports
        const airportCounts = {};
        entries.forEach(entry => {
            if (entry.depAd) {
                airportCounts[entry.depAd] = (airportCounts[entry.depAd] || 0) + 1;
            }
            if (entry.arrAd && entry.arrAd !== entry.depAd) {
                airportCounts[entry.arrAd] = (airportCounts[entry.arrAd] || 0) + 1;
            }
        });
        
        const topAirports = Object.entries(airportCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([airport, count]) => ({ airport, count }));

        // Most common aircraft types
        const aircraftCounts = {};
        entries.forEach(entry => {
            if (entry.aircraftType) {
                aircraftCounts[entry.aircraftType] = (aircraftCounts[entry.aircraftType] || 0) + 1;
            }
        });
        
        const topAircraft = Object.entries(aircraftCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([aircraft, count]) => ({ aircraft, count }));

        // Flying patterns
        const dayHours = entries.reduce((sum, entry) => sum + (entry.dayTime || 0), 0);
        const nightHours = entries.reduce((sum, entry) => sum + (entry.nightTime || 0), 0);
        const picHours = entries.reduce((sum, entry) => sum + (entry.picTime || 0), 0);
        const instructorHours = entries.reduce((sum, entry) => sum + (entry.instructorTime || 0), 0);

        // Calculate months of activity
        const sortedEntries = entries
            .filter(entry => entry.createdAt)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const monthsActive = sortedEntries.length > 0 ? 
            Math.ceil((new Date().getTime() - new Date(sortedEntries[0].createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;

        return {
            totalFlights,
            totalHours: Math.round(totalHours * 10) / 10,
            totalLandings,
            topAirports,
            topAircraft,
            dayHours: Math.round(dayHours * 10) / 10,
            nightHours: Math.round(nightHours * 10) / 10,
            picHours: Math.round(picHours * 10) / 10,
            instructorHours: Math.round(instructorHours * 10) / 10,
            monthsActive
        };
    }

    private generateReportSVG(user: any, stats: any): string {
        const { passwordHash, ...safeUser } = user;
        const hasFlightData = stats.totalFlights > 0;
        
        return `
        <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
                <style>
                    .title { font: bold 36px sans-serif; fill: white; text-anchor: middle; }
                    .subtitle { font: 24px sans-serif; fill: white; text-anchor: middle; }
                    .stat-title { font: bold 20px sans-serif; fill: white; }
                    .stat-value { font: bold 32px sans-serif; fill: #f0f9ff; }
                    .small-text { font: 16px sans-serif; fill: #e2e8f0; }
                    .user-name { font: bold 28px sans-serif; fill: white; text-anchor: middle; }
                    .no-data { font: 18px sans-serif; fill: #fbbf24; text-anchor: middle; }
                </style>
            </defs>
            
            <!-- Background -->
            <rect width="800" height="1000" fill="url(#backgroundGradient)"/>
            
            <!-- Header -->
            <text x="400" y="60" class="title">✈️ Flight Wrapped</text>
            <text x="400" y="100" class="subtitle">Your Year in Aviation</text>
            
            <!-- User Info -->
            <text x="400" y="160" class="user-name">${safeUser.firstName || ''} ${safeUser.lastName || ''}</text>
            ${safeUser.username ? `<text x="400" y="190" class="small-text">@${safeUser.username}</text>` : ''}
            
            ${hasFlightData ? `
            <!-- Main Stats -->
            <g transform="translate(100, 240)">
                <rect x="0" y="0" width="600" height="120" rx="20" fill="rgba(255,255,255,0.1)"/>
                <text x="50" y="40" class="stat-title">Total Flight Hours</text>
                <text x="50" y="80" class="stat-value">${stats.totalHours}</text>
                
                <text x="350" y="40" class="stat-title">Total Flights</text>
                <text x="350" y="80" class="stat-value">${stats.totalFlights}</text>
            </g>
            
            <!-- Secondary Stats -->
            <g transform="translate(100, 400)">
                <rect x="0" y="0" width="280" height="100" rx="15" fill="rgba(255,255,255,0.08)"/>
                <text x="20" y="35" class="stat-title">Landings</text>
                <text x="20" y="70" class="stat-value">${stats.totalLandings}</text>
                
                <rect x="320" y="0" width="280" height="100" rx="15" fill="rgba(255,255,255,0.08)"/>
                <text x="340" y="35" class="stat-title">PIC Hours</text>
                <text x="340" y="70" class="stat-value">${stats.picHours}</text>
            </g>
            
            <!-- Day vs Night -->
            <g transform="translate(100, 540)">
                <rect x="0" y="0" width="600" height="80" rx="15" fill="rgba(255,255,255,0.08)"/>
                <text x="20" y="30" class="stat-title">Day: ${stats.dayHours}h</text>
                <text x="300" y="30" class="stat-title">Night: ${stats.nightHours}h</text>
                
                <!-- Progress bar -->
                <rect x="20" y="45" width="560" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
                <rect x="20" y="45" width="${stats.dayHours + stats.nightHours > 0 ? Math.min(560, (stats.dayHours / (stats.dayHours + stats.nightHours)) * 560) : 0}" height="8" rx="4" fill="#fbbf24"/>
            </g>
            
            <!-- Top Airports -->
            ${stats.topAirports.length > 0 ? `
            <g transform="translate(100, 660)">
                <text x="0" y="0" class="stat-title">Most Visited Airports</text>
                ${stats.topAirports.map((airport, i) => `
                    <text x="0" y="${35 + i * 25}" class="small-text">${i + 1}. ${airport.airport} (${airport.count} visits)</text>
                `).join('')}
            </g>
            ` : ''}
            
            <!-- Top Aircraft -->
            ${stats.topAircraft.length > 0 ? `
            <g transform="translate(400, 660)">
                <text x="0" y="0" class="stat-title">Favorite Aircraft</text>
                ${stats.topAircraft.map((aircraft, i) => `
                    <text x="0" y="${35 + i * 25}" class="small-text">${i + 1}. ${aircraft.aircraft} (${aircraft.count} flights)</text>
                `).join('')}
            </g>
            ` : ''}
            ` : `
            <!-- No Data Message -->
            <g transform="translate(400, 400)">
                <text x="0" y="0" class="no-data">🛫 Ready for Takeoff?</text>
                <text x="0" y="40" class="small-text" text-anchor="middle">Start logging your flights to see your aviation journey!</text>
                <text x="0" y="70" class="small-text" text-anchor="middle">Upload your logbook or add flights manually to get started.</text>
            </g>
            `}
            
            <!-- Footer -->
            <text x="400" y="950" class="small-text" text-anchor="middle">Generated by Flown Records</text>
        </svg>`;
    }
}
