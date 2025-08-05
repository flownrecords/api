import { Injectable } from '@nestjs/common';
import { parseKml, ParsedFlightData } from './util/kml.parser';

@Injectable()
export class FlightDataService {
    async parseKmlFile(fileBuffer: Buffer): Promise<ParsedFlightData> {
        return await parseKml(fileBuffer);
    }
}