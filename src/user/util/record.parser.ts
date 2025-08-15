import { XMLParser } from "fast-xml-parser";

export const kmlFilter = (req: Request, file, callback) => {
    if (!file.originalname.match(/\.(kml)$/)) {
        return callback(new Error("Only KML files are allowed!"), false);
    }
    callback(null, true);
};

export interface FlightPlacemark {
    id: number;
    latitude: number;
    longitude: number;
    altitude: {
        mode: string; // e.g., 'relativeToGround', 'absolute'
        value: number; // Altitude (ft)
    };
    timestamp?: string;
    heading?: number; // Optional heading in degrees
    groundSpeed?: number; // Optional ground speed (kt)
    verticalSpeed?: number; // Optional vertical speed (ft/min)
    source?: string; // Source of the data
    squawk?: number; // Optional transponder code
}

export interface RawFlight {
    name: string;
    description?: string;
    coords: FlightPlacemark[];
}

export const parseKml = (fileSource: string, fileBuffer: Buffer): Promise<RawFlight> => {
    return new Promise((resolve, reject) => {
        if (!fileSource || !fileBuffer) {
            return reject(new Error("File source and buffer are required"));
        }

        try {
            const xmlParser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "@_",
                parseAttributeValue: true,
                trimValues: true,
            });

            const kmlString = fileBuffer.toString("utf-8");
            const parsedXml = xmlParser.parse(kmlString);

            // Extract KML data structure
            const kml = parsedXml.kml || parsedXml.Kml || parsedXml.KML;
            if (!kml) {
                throw new Error("Invalid KML file: No KML root element found");
            }

            if (fileSource === "AIRNAV") {
                resolve(parseAirNavRecord(kml));
            } else {
                // Handle other KML sources if needed
                console.warn(`Unsupported KML source: ${fileSource}`);
                return {
                    WARNING: `Unsupported KML source: ${fileSource}`,
                    ...kml,
                };
            }
        } catch (error) {
            reject(error);
        }
    });
};

export function parseAirNavRecord(data: any): Promise<RawFlight> {
    return new Promise((resolve, reject) => {
        if (!data) {
            return reject(new Error("No data provided"));
        }

        const flight: RawFlight = {
            name: "Unknown Flight",
            description: "Unknown Description",
            coords: [],
        };

        try {
            const document = data.Document || data.document;
            if (!document) {
                throw new Error("Invalid KML structure: No Document element found");
            }

            flight.name = document.name;
            flight.description = document.description;

            const folders = document.Folder || document.folder;
            if (!folders || !Array.isArray(folders)) {
                throw new Error("Invalid KML structure: No Folder element found or not an array");
            }

            const positions = folders.filter((folder) => folder.name === "Positions")[0]?.Placemark;
            if (!positions || !Array.isArray(positions)) {
                throw new Error("Invalid KML structure: No Positions found or not an array");
            }

            flight.coords = positions;

            // Parse and format the coordinates and metadata
            flight.coords = flight.coords.map((pos: any) => {
                const metadadata = pos.ExtendedData?.Data || pos.ExtendedData?.data || [];
                return {
                    id: pos.name,
                    latitude: parseFloat(pos.Point.coordinates.split(",")[1]),
                    longitude: parseFloat(pos.Point.coordinates.split(",")[0]),
                    altitude: {
                        mode: pos.Point.altitudeMode,
                        value: Math.floor(
                            parseFloat(pos.Point.coordinates.split(",")[2]) * 3.28084,
                        ), // Convert meters to feet
                    },
                    timestamp: pos.TimeStamp?.when || pos.timestamp || pos.TimeStamp,
                    heading: metadadata
                        ? Number(
                              metadadata
                                  .find((e) => e.displayName === "Heading" || e["@_name"] === "fhd")
                                  ?.value.replace(/°/g, ""),
                          )
                        : undefined,
                    groundSpeed: metadadata
                        ? Number(
                              metadadata
                                  .find(
                                      (e) =>
                                          e.displayName === "Ground Speed" || e["@_name"] === "fgs",
                                  )
                                  ?.value.replace(/ kts/g, "")
                                  .replace(/ kt/g, "")
                                  .replace(/ kmh/g, "")
                                  .replace(/ km\/h/g, "")
                                  .replace(/ mph/g, ""),
                          )
                        : undefined,
                    verticalSpeed: metadadata
                        ? Number(
                              metadadata
                                  .find(
                                      (e) =>
                                          e.displayName === "Vertical Speed" ||
                                          e["@_name"] === "fvr",
                                  )
                                  ?.value.replace(/ ft\/min/g, "")
                                  .replace(/ feet\/min/g, "")
                                  .replace(/ fpm/g, "")
                                  .replace(/ ft\/min/g, ""),
                          )
                        : undefined,
                    squawk: metadadata
                        ? Number(
                              metadadata.find(
                                  (e) => e.displayName === "Squawk" || e["@_name"] === "sq",
                              )?.value,
                          )
                        : undefined,
                    source: metadadata
                        ? metadadata.find((e) => e.displayName === "Source" || e["@_name"] === "so")
                              ?.value
                        : undefined,
                };
            });

            resolve(flight);
        } catch (error) {
            reject(error);
        }
    });
}
