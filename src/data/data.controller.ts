import { Controller, Get, Param } from "@nestjs/common";
import { DataService } from "./data.service";
import { PrismaService } from "src/prisma/prisma.service";

@Controller('data')
export class DataController {
    constructor(
        private dataService: DataService,
        private prisma: PrismaService
    ) { }

    @Get('nav')
    getAllNavdata() {
        return this.dataService.getAllNavdata();
    }

    @Get('nav/wpt')
    getAllWaypoints() {
        return this.dataService.getWaypoints();
    }

    @Get('nav/wpt/:firIcao')
    getWaypoints(@Param('firIcao') firIcao?: string) {
        return this.dataService.getWaypoints(firIcao);
    }

    @Get('nav/ad')
    getAllAdData() {
        return this.dataService.getAllAd();
    }

    @Get('nav/ad/:icaoCode')
    getAdData(@Param('icaoCode') icaoCode: string) {
        return this.dataService.getAdData(icaoCode);
    }

    @Get('acft')
    getAllAircraftData() {
        return this.dataService.getAllAircraftData();
    }

    @Get('acft/:aircraftId')
    getAircraftData(@Param('aircraftId') aircraftId: string) {
        return this.dataService.getAircraftData(aircraftId);
    }
}