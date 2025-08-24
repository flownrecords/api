import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { OrgsService } from "./orgs.service";

@Controller("orgs")
export class OrgsController {
    constructor(
        private readonly orgsService: OrgsService,
    ) {}

    @Get("/")
    getIndex() {
        return this.orgsService.getOrgListForStatic();
    }
}
