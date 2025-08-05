import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FlightDataService } from './flight-data.service';
import { kmlFilter } from './util/kml.parser';

@Controller('flight-data')
export class FlightDataController {
    constructor(private readonly flightDataService: FlightDataService) {}

    @Post('parse-kml')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: kmlFilter,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            },
        })
    )
    async parseKmlFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No KML file provided');
        }

        try {
            const parsedData = await this.flightDataService.parseKmlFile(file.buffer);
            return {
                success: true,
                data: parsedData,
                message: `Successfully parsed ${parsedData.flights.length} flight path(s) from KML file`,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to parse KML file: ${error.message}`);
        }
    }
}