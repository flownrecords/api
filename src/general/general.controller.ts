import { Controller, Get, Param, Res } from "@nestjs/common";
import { GeneralService } from "./general.service";
import { Response } from "express";

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
}
