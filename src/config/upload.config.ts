export const uploadConfig = {
    // File size limits in bytes
    maxCsvFileSize: 50 * 1024 * 1024, // 50MB for CSV files
    maxKmlFileSize: 100 * 1024 * 1024, // 100MB for KML files

    // Processing limits
    maxLogbookEntries: 10000, // Maximum entries to process in one upload
    maxCoordinatePoints: 50000, // Maximum coordinate points in KML

    // Memory thresholds
    csvChunkSize: 1000, // Process CSV in chunks of 1000 entries
    streamThreshold: 10 * 1024 * 1024, // 10MB - use streaming above this size
};
