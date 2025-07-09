import { Module } from "@nestjs/common";
import { NavDataController } from "./navdata.controller";
import { NavDataService } from "./navdata.service";

@Module({
    controllers: [NavDataController],
    providers: [NavDataService],
})
export class NavDataModule {}
