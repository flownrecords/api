import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import { GeneralService } from "./general.service";
import { Request, Response } from "express";

@Controller("")
export class GeneralController {
    constructor(private readonly generalService: GeneralService) {}

    @Get("/")
    getIndex() {
        return {
            status: "OK",
        };
    }

    @Get("/roles")
    getRoles() {
        return this.generalService.getRoles();
    }

    @Get("/download/:id")
    getDownloadFile(@Param("id") id: string, @Res() res: Response) {
        return this.generalService.getDownloadFile(res, id);
    }

    @Get("/stats")
    getStats() {
        return this.generalService.getStats();
    }

    @Get("/report")
    async getReport(@Req() req: Request, @Res() res: Response) {
        const { hours, flights, aircraft, airport } = req.query;
        if(!hours || !flights || !aircraft || !airport) {
            return res.status(400).send('Missing query parameters. Required: hours, flights, aircraft, airport');
        }
        const report = await this.generalService.getReport({hours, flights, aircraft, airport}); // returns Buffer

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="FlownRecords-Report.png"');
        res.send(report);
    }
}