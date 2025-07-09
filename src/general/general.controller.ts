import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";

@Controller("")
export class GeneralController {
    constructor() {}

    @Get("/")
    getIndex() {
        return {
            status: "OK",
        };
    }
}
