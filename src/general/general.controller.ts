import { Controller, Get } from "@nestjs/common";
import { GeneralService } from "./general.service";

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
}
