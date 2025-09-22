import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "src/prisma/prisma.service";
import { ReportsManager } from "./util/reports.manager";

@Injectable()
export class GeneralService {
    constructor(private prisma: PrismaService) {
        setTimeout(() => this.updateStats(), 5000);
        setInterval(() => this.updateStats(), 3600000);
    }

    private readonly dataDir = path.join(__dirname, "..", "..", "..", "data");
    private readonly genPath = path.join(this.dataDir, "general");
    private readonly filesPath = path.join(this.dataDir, "files");
    private readonly statsMap = new Map<string, any>();

    private safeReadJson(filePath: string) {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch {
            return [];
        }
    }

    getRoles() {
        const rolesPath = path.join(this.genPath, "organizationRoles.json");
        if (!fs.existsSync(rolesPath)) {
            console.error(`Roles file not found: ${rolesPath}`);
            return [];
        }
        return this.safeReadJson(rolesPath);
    }

    getDownloadFile(res: Response, id: string) {
        const filePath = path.join(this.filesPath, `${id}`);

        if (!fs.existsSync(filePath)) {
            console.error(`Download file not found: ${filePath}`);
            return res.status(HttpStatus.NOT_FOUND).send('File not found');
        }

        res.download(filePath, `${id}`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error downloading file');
            }
        });
    }

    getStats() {
        return {
            ...JSON.parse(JSON.stringify(Object.fromEntries(this.statsMap))),
            serverTime: new Date().toISOString(),
            uptime: process.uptime(), // seconds
            uptimeHuman: new Date(process.uptime() * 1000).toISOString().substr(11, 8), // HH:MM:SS
        };
    }

    updateStats() {
        this.prisma.user.count().then(count => {
            this.statsMap.set('userCount', count);
        });
        this.prisma.organization.count().then(count => {
            this.statsMap.set('organizationCount', count);
        }
        );
        this.prisma.flightPlan.count().then(count => {
            this.statsMap.set('flightPlanCount', count);
        });
        this.prisma.logbookEntry.count().then(count => {
            this.statsMap.set('logbookEntryCount', count);
        });
        this.prisma.flightRecording.count().then(count => {
            this.statsMap.set('flightRecordingCount', count);
        });
    }
    
    async generateReport(reportType: string, params: any) {
        const reportsManager = new ReportsManager();

        if(reportType === "Year") {
            const report = await reportsManager.getRawReport_Year({
                hours: params.hours,
                flights: params.flights,
                aircraft: params.aircraft,
                airport: params.airport
            });

            return report;
        }

        throw new NotFoundException("Report type not found");
    }
}