import { HttpStatus, Injectable } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "src/prisma/prisma.service";
import { Canvas, createCanvas, loadImage } from 'canvas';

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

    private updateStats() {
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

    async getReport({
        hours,
        flights,
        aircraft,
        airport
    }): Promise<Buffer> {
        const title = 'Logbook Report';
        const subtitle = 'Your 2025 Flight Summary';
        const brand = 'flownrecords.live';

        const width = 1080;
        const height = 1920;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#09090B'); // Dark background
        gradient.addColorStop(1, '#1E1E1E'); // Lighter background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Title text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 96px Inter';
        ctx.fillText(title, (width - ctx.measureText(title).width) / 2, 350);

        // Subtitle text
        ctx.font = 'bold 40px Inter';
        ctx.fillStyle = '#404040';
        ctx.fillText(subtitle, (width - ctx.measureText(subtitle).width) / 2, 250);

        // Brand text
        ctx.font = 'bolder 30px Inter';
        ctx.fillStyle = '#808080';
        ctx.fillText(brand, (width - ctx.measureText(brand).width) / 2, 400);

        const rectWidth = width * 0.9;
        const rectHeight = 300;
        const startX = width * 0.05;
        const startY = 450;
        const spacing = 50; // space between rects
        const radius = 20;
        const boxBorderColor = '#808080';
        const boxBorderWidth = 5;
        const boxPadding = 25;

        function drawRoundedRectWithBorder(
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            w: number,
            h: number,
            radius: number,
            fillColor: string,
            borderColor: string,
            borderWidth: number,
            text: string,
            textAlign: CanvasTextAlign = 'left',
            subtext: string = ''
        ) {
            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.stroke();

            // Fill
            const glow = ctx.createRadialGradient(
                x + w / 2, y + h / 2, 20,    // inner circle
                x + w / 2, y + h / 2, w      // outer circle
            );
            glow.addColorStop(0, '#171717');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x, y, w, h);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Inter';
            ctx.textAlign = textAlign;
            const textX = textAlign === 'left' ? x + boxPadding : textAlign === 'right' ? x + w - boxPadding : x + w / 2;
            ctx.fillText(text, textX, y + boxPadding + 64);

            const maxTextWidth = w - boxPadding * 2;
            let fontSize = 192; // starting size
            const minFontSize = 64; // minimum size

            do {
                ctx.font = `bold ${fontSize}px Inter`;
                const metrics = ctx.measureText(subtext);
                if (metrics.width <= maxTextWidth) break;
                fontSize -= 2;
            } while (fontSize > minFontSize);

            ctx.fillStyle = '#808080';
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'bottom'; // hug bottom of rectangle
            ctx.fillText(subtext, textX, y + h + boxPadding);

        }

        drawRoundedRectWithBorder(ctx as any, startX, startY, rectWidth, rectHeight, radius, '#1E1E1E', boxBorderColor, boxBorderWidth, 'Flight Hours', 'left', `${hours}h`);
        drawRoundedRectWithBorder(ctx as any, startX, startY + rectHeight + spacing, rectWidth, rectHeight, radius, '#1E1E1E', boxBorderColor, boxBorderWidth, 'Flights', 'right', `${flights}`);
        drawRoundedRectWithBorder(ctx as any, startX, startY + (rectHeight + spacing) * 2, rectWidth, rectHeight, radius, '#1E1E1E', boxBorderColor, boxBorderWidth, 'Most Used Aircraft', 'left', `${aircraft}`);
        drawRoundedRectWithBorder(ctx as any, startX, startY + (rectHeight + spacing) * 3, rectWidth, rectHeight, radius, '#1E1E1E', boxBorderColor, boxBorderWidth, 'Most Visited Airport', 'right', `${airport}`);

        ctx.fillStyle = '#fff';

        return canvas.toBuffer('image/png');
    }
}