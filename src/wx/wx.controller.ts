import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { WxService } from "./wx.service";

@Controller("wx")
export class WxController {
    constructor(
        private readonly wxService: WxService, // Assuming WxService is defined and imported
    ) {}

    @Get("/")
    getIndex() {
        return {
            status: "OK",
        };
    }

    @Get("/ad")
    getWx(@Req() request: Request) {
        const ad = request.query.icao
            ? request.query.icao.toString().trim().toUpperCase()
            : undefined;
        if (!ad) {
            return {
                status: "error",
                message: "No ICAO code provided.",
            };
        }

        return this.wxService.getAd(ad);
    }

    @Get("/sigmet")
    getSigmet(@Req() request: Request) {
        const fir = request.query.fir
            ? request.query.fir.toString().trim().toUpperCase()
            : undefined;
        return this.wxService.getSigmet(fir);
    }
}
