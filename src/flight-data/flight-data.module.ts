import { Module } from '@nestjs/common';
import { FlightDataController } from './flight-data.controller';
import { FlightDataService } from './flight-data.service';

@Module({
    controllers: [FlightDataController],
    providers: [FlightDataService],
    exports: [FlightDataService],
})
export class FlightDataModule {}