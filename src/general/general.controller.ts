import { Controller, Get, HttpCode, HttpStatus, Param, Req, Res } from "@nestjs/common";
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

    @HttpCode(HttpStatus.OK)
    @Get("reports/:type")
    async generateReport(@Req() req: Request, @Res() res: Response, @Param("type") type: string) {
        const params = req.query;

        const buffer = await this.generalService.generateReport(type, params);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="FlownRecords-Report.png"');
        return res.send(buffer);
    }
}