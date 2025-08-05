import { XMLParser } from 'fast-xml-parser';
import { Request } from 'express';

export const kmlFilter = (req: Request, file: any, callback: any) => {
    if (!file.originalname.match(/\.(kml)$/)) {
        return callback(new Error('Only KML files are allowed!'), false);
    }
    callback(null, true);
};

export interface FlightPoint {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp?: string;
}

export interface FlightPath {
    name?: string;
    description?: string;
    points: FlightPoint[];
    metadata?: {
        totalDistance?: number;
        duration?: number;
        startTime?: string;
        endTime?: string;
        maxAltitude?: number;
        minAltitude?: number;
    };
}

export interface ParsedFlightData {
    flights: FlightPath[];
    metadata: {
        source: string;
        parseDate: string;
        totalFlights: number;
    };
}

export const parseKml = (fileBuffer: Buffer): Promise<ParsedFlightData> => {
    return new Promise((resolve, reject) => {
        try {
            const xmlParser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
                parseAttributeValue: true,
                trimValues: true,
            });

            const kmlString = fileBuffer.toString('utf-8');
            const parsedXml = xmlParser.parse(kmlString);

            // Extract KML data structure
            const kml = parsedXml.kml || parsedXml.Kml || parsedXml.KML;
            if (!kml) {
                throw new Error('Invalid KML file: No KML root element found');
            }

            const document = kml.Document || kml.document;
            if (!document) {
                throw new Error('Invalid KML file: No Document element found');
            }

            const flights: FlightPath[] = [];

            // Handle placemarks which typically contain flight paths
            const placemarks = Array.isArray(document.Placemark) 
                ? document.Placemark 
                : document.Placemark 
                ? [document.Placemark] 
                : [];

            placemarks.forEach((placemark: any) => {
                const flight = extractFlightFromPlacemark(placemark);
                if (flight && flight.points.length > 0) {
                    flights.push(flight);
                }
            });

            // If no placemarks, try to find other common KML structures
            if (flights.length === 0) {
                // Check for Folder structures
                const folders = Array.isArray(document.Folder) 
                    ? document.Folder 
                    : document.Folder 
                    ? [document.Folder] 
                    : [];

                folders.forEach((folder: any) => {
                    const folderPlacemarks = Array.isArray(folder.Placemark) 
                        ? folder.Placemark 
                        : folder.Placemark 
                        ? [folder.Placemark] 
                        : [];

                    folderPlacemarks.forEach((placemark: any) => {
                        const flight = extractFlightFromPlacemark(placemark);
                        if (flight && flight.points.length > 0) {
                            flights.push(flight);
                        }
                    });
                });
            }

            const result: ParsedFlightData = {
                flights,
                metadata: {
                    source: 'airnavradar.com',
                    parseDate: new Date().toISOString(),
                    totalFlights: flights.length,
                },
            };

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

const extractFlightFromPlacemark = (placemark: any): FlightPath | null => {
    try {
        const name = placemark.name || 'Unnamed Flight';
        const description = placemark.description || '';

        let points: FlightPoint[] = [];

        // Handle LineString (most common for flight paths)
        if (placemark.LineString && placemark.LineString.coordinates) {
            points = parseCoordinateString(placemark.LineString.coordinates);
        }
        // Handle MultiGeometry
        else if (placemark.MultiGeometry) {
            const lineStrings = Array.isArray(placemark.MultiGeometry.LineString)
                ? placemark.MultiGeometry.LineString
                : placemark.MultiGeometry.LineString
                ? [placemark.MultiGeometry.LineString]
                : [];

            lineStrings.forEach((lineString: any) => {
                if (lineString.coordinates) {
                    points = points.concat(parseCoordinateString(lineString.coordinates));
                }
            });
        }
        // Handle Point (single location)
        else if (placemark.Point && placemark.Point.coordinates) {
            points = parseCoordinateString(placemark.Point.coordinates);
        }

        if (points.length === 0) {
            return null;
        }

        // Calculate metadata
        const metadata = calculateFlightMetadata(points);

        return {
            name,
            description,
            points,
            metadata,
        };
    } catch (error) {
        console.warn('Error extracting flight from placemark:', error);
        return null;
    }
};

const parseCoordinateString = (coordinateStr: string): FlightPoint[] => {
    try {
        const coordinates = coordinateStr.trim().split(/\s+/);
        const points: FlightPoint[] = [];

        coordinates.forEach((coord) => {
            if (coord.trim()) {
                const parts = coord.split(',');
                if (parts.length >= 2) {
                    const longitude = parseFloat(parts[0]);
                    const latitude = parseFloat(parts[1]);
                    const altitude = parts.length >= 3 ? parseFloat(parts[2]) : 0;

                    if (!isNaN(longitude) && !isNaN(latitude)) {
                        points.push({
                            latitude,
                            longitude,
                            altitude: isNaN(altitude) ? 0 : altitude,
                        });
                    }
                }
            }
        });

        return points;
    } catch (error) {
        console.warn('Error parsing coordinate string:', error);
        return [];
    }
};

const calculateFlightMetadata = (points: FlightPoint[]) => {
    if (points.length === 0) {
        return {};
    }

    let totalDistance = 0;
    let maxAltitude = points[0].altitude;
    let minAltitude = points[0].altitude;

    // Calculate total distance and altitude stats
    for (let i = 1; i < points.length; i++) {
        const distance = calculateDistance(
            points[i - 1].latitude,
            points[i - 1].longitude,
            points[i].latitude,
            points[i].longitude
        );
        totalDistance += distance;

        maxAltitude = Math.max(maxAltitude, points[i].altitude);
        minAltitude = Math.min(minAltitude, points[i].altitude);
    }

    return {
        totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
        maxAltitude: Math.round(maxAltitude),
        minAltitude: Math.round(minAltitude),
    };
};

// Haversine formula for calculating distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};