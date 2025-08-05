import { parseKml } from './util/kml.parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Sample KML File Test', () => {
    it('should parse the sample flight data KML file', async () => {
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
          -73.7781,40.6413,50 -74.0060,40.7128,1000 -75.1652,39.9526,5000 -76.6122,39.2904,10000 -80.2707,25.7617,35000 -84.3880,33.7490,38000 -90.0715,29.9511,39000 -97.0403,32.8998,40000 -103.6055,44.0521,41000 -111.8910,40.7608,38000 -117.9445,33.8121,20000 -118.4081,33.9425,1000 -118.4085,33.9425,50
        </coordinates>
      </LineString>
    </Placemark>
    
    <Placemark>
      <name>Flight UA456 - KSFO to KORD</name>
      <description>United Airlines flight from SFO to ORD</description>
      <LineString>
        <coordinates>
          -122.3751,37.6213,50 -122.2711,37.8044,1000 -121.9018,37.3382,5000 -119.7051,36.7378,15000 -114.0423,36.1215,35000 -109.0501,38.9517,39000 -104.9903,39.7392,40000 -100.3510,40.8136,41000 -94.7138,39.0997,38000 -90.2071,38.7503,20000 -87.9073,41.9786,1000 -87.9048,41.9742,50
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

        const buffer = Buffer.from(sampleKml, 'utf-8');
        const result = await parseKml(buffer);

        // Verify basic structure
        expect(result).toBeDefined();
        expect(result.flights).toHaveLength(2);
        expect(result.metadata.totalFlights).toBe(2);
        expect(result.metadata.source).toBe('airnavradar.com');

        // Verify first flight
        const flight1 = result.flights[0];
        expect(flight1.name).toBe('Flight AA123 - KJFK to KLAX');
        expect(flight1.description).toBe('American Airlines flight from JFK to LAX');
        expect(flight1.points).toHaveLength(13); // 13 coordinate pairs
        expect(flight1.metadata).toBeDefined();
        expect(flight1.metadata?.totalDistance).toBeGreaterThan(0);
        expect(flight1.metadata?.maxAltitude).toBe(41000);
        expect(flight1.metadata?.minAltitude).toBe(50);

        // Verify first point of first flight (JFK area)
        expect(flight1.points[0]).toEqual({
            latitude: 40.6413,
            longitude: -73.7781,
            altitude: 50,
        });

        // Verify last point of first flight (LAX area)
        expect(flight1.points[12]).toEqual({
            latitude: 33.9425,
            longitude: -118.4085,
            altitude: 50,
        });

        // Verify second flight
        const flight2 = result.flights[1];
        expect(flight2.name).toBe('Flight UA456 - KSFO to KORD');
        expect(flight2.description).toBe('United Airlines flight from SFO to ORD');
        expect(flight2.points).toHaveLength(12); // 12 coordinate pairs
        expect(flight2.metadata?.maxAltitude).toBe(41000);

        // Log results for manual verification
        console.log('✅ Sample KML parsing successful!');
        console.log(`📊 Total flights parsed: ${result.metadata.totalFlights}`);
        console.log(`🛩️  Flight 1: ${flight1.points.length} points, ${flight1.metadata?.totalDistance?.toFixed(2)}km distance`);
        console.log(`🛩️  Flight 2: ${flight2.points.length} points, ${flight2.metadata?.totalDistance?.toFixed(2)}km distance`);
    });
});