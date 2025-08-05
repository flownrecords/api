import { Test, TestingModule } from '@nestjs/testing';
import { FlightDataService } from './flight-data.service';
import { parseKml } from './util/kml.parser';

describe('FlightDataService', () => {
    let service: FlightDataService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FlightDataService],
        }).compile();

        service = module.get<FlightDataService>(FlightDataService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should parse a simple KML file with LineString', async () => {
        const simpleKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Flight</name>
      <description>A test flight path</description>
      <LineString>
        <coordinates>
          -122.4194,37.7749,100 -122.4094,37.7849,200 -122.3994,37.7949,150
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

        const buffer = Buffer.from(simpleKml, 'utf-8');
        const result = await service.parseKmlFile(buffer);

        expect(result).toBeDefined();
        expect(result.flights).toHaveLength(1);
        expect(result.flights[0].name).toBe('Test Flight');
        expect(result.flights[0].points).toHaveLength(3);
        expect(result.flights[0].points[0]).toEqual({
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: 100,
        });
        expect(result.metadata.totalFlights).toBe(1);
        expect(result.metadata.source).toBe('airnavradar.com');
    });

    it('should handle invalid KML gracefully', async () => {
        const invalidKml = 'This is not valid XML';
        const buffer = Buffer.from(invalidKml, 'utf-8');

        await expect(service.parseKmlFile(buffer)).rejects.toThrow();
    });

    it('should handle KML without coordinates', async () => {
        const emptyKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Empty Flight</name>
      <description>No coordinates</description>
    </Placemark>
  </Document>
</kml>`;

        const buffer = Buffer.from(emptyKml, 'utf-8');
        const result = await service.parseKmlFile(buffer);

        expect(result).toBeDefined();
        expect(result.flights).toHaveLength(0);
        expect(result.metadata.totalFlights).toBe(0);
    });
});