import { Controller, Get, Param, Query } from "@nestjs/common";
import { NavDataService } from "./navdata.service";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("navdata")
export class NavDataController {
    constructor(
        private dataService: NavDataService,
        private prisma: PrismaService,
    ) {}

    @Get("/")
    getAllNavdata(
        @Query("fir") fir?: string,
        @Query("waypoints") waypoints?: "all" | "vfr" | "ifr",
        @Query("aerodromes") aerodromes?: string,
        @Query("navaids") navaids?: string,
        @Query("all") all?: string,
    ) {
        const includeAll = !fir && !waypoints && !aerodromes && !navaids && !all;

        const filter = {
            fir: fir ? fir.trim().toUpperCase() : undefined,
            waypoints: {
                all: waypoints === "all" || waypoints?.length === 0,
                vfr: waypoints === "vfr",
                ifr: waypoints === "ifr",
            },
            aerodromes: aerodromes === "true" || aerodromes?.length === 0,
            navaids: navaids === "true" || navaids?.length === 0,
            all: all === "true" || includeAll,
        };

        return this.dataService.getNavdata(filter);
    }

    @Get("/ad/:icaoCode")
    getAdData(@Param("icaoCode") icaoCode: string) {
        return this.dataService.getAdData(icaoCode);
    }
}
