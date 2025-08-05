import { Test } from '@nestjs/testing';
import { FlightDataController } from './flight-data.controller';
import { FlightDataService } from './flight-data.service';

describe('FlightDataController (e2e)', () => {
    let controller: FlightDataController;
    let service: FlightDataService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [FlightDataController],
            providers: [FlightDataService],
        }).compile();

        controller = moduleRef.get<FlightDataController>(FlightDataController);
        service = moduleRef.get<FlightDataService>(FlightDataService);
    });

    it('should parse a complete KML file', async () => {
        const sampleKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sample Flight Data</name>
    <description>Flight data from airnavradar.com</description>
    
    <Placemark>
      <name>Flight AA123 - KJFK to KLAX</name>
      <description>American Airlines flight from JFK to LAX</description>
      <LineString>
        <coordinates>
          -73.7781,40.6413,50 -74.0060,40.7128,1000 -75.1652,39.9526,5000 -118.4085,33.9425,50
        </coordinates>
      </LineString>
    </Placemark>
    
    <Placemark>
      <name>Flight UA456 - KSFO to KORD</name>
      <description>United Airlines flight from SFO to ORD</description>
      <LineString>
        <coordinates>
          -122.3751,37.6213,50 -122.2711,37.8044,1000 -87.9048,41.9742,50
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

        const mockFile = {
            buffer: Buffer.from(sampleKml, 'utf-8'),
        } as Express.Multer.File;

        const result = await controller.parseKmlFile(mockFile);

        expect(result.success).toBe(true);
        expect(result.data.flights).toHaveLength(2);
        expect(result.data.flights[0].name).toBe('Flight AA123 - KJFK to KLAX');
        expect(result.data.flights[1].name).toBe('Flight UA456 - KSFO to KORD');
        expect(result.data.metadata.totalFlights).toBe(2);
        expect(result.message).toContain('Successfully parsed 2 flight path(s)');
    });

    it('should handle file upload errors', async () => {
        await expect(controller.parseKmlFile(undefined as any)).rejects.toThrow('No KML file provided');
    });

    it('should handle invalid KML content', async () => {
        const mockFile = {
            buffer: Buffer.from('invalid xml content', 'utf-8'),
        } as Express.Multer.File;

        await expect(controller.parseKmlFile(mockFile)).rejects.toThrow();
    });
});