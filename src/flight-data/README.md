# Flight Data Module

This module provides functionality to parse KML files from airnavradar.com and convert them into JSON format for API consumption.

## Features

- Parse KML files containing flight path data
- Extract flight coordinates, altitudes, and metadata
- Calculate flight statistics (distance, altitude ranges)
- Validate KML file format
- Return structured JSON response

## API Endpoint

### POST /flight-data/parse-kml

Accepts a KML file upload and returns parsed flight data in JSON format.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: KML file (max 10MB)
- Field name: `file`

**Response:**
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "name": "Flight AA123 - KJFK to KLAX",
        "description": "American Airlines flight from JFK to LAX",
        "points": [
          {
            "latitude": 40.6413,
            "longitude": -73.7781,
            "altitude": 50
          }
        ],
        "metadata": {
          "totalDistance": 3944.12,
          "maxAltitude": 41000,
          "minAltitude": 50
        }
      }
    ],
    "metadata": {
      "source": "airnavradar.com",
      "parseDate": "2024-01-15T10:30:00.000Z",
      "totalFlights": 1
    }
  },
  "message": "Successfully parsed 1 flight path(s) from KML file"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Failed to parse KML file: Invalid KML format",
  "error": "Bad Request"
}
```

## Supported KML Structures

The parser supports the following KML elements:

- `Document/Placemark/LineString` - Main flight paths
- `Document/Placemark/MultiGeometry/LineString` - Multi-segment flights
- `Document/Placemark/Point` - Single coordinate points
- `Document/Folder/Placemark` - Organized flight data

## Usage Example

```bash
curl -X POST \
  http://localhost:3000/flight-data/parse-kml \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@flight-data.kml'
```

## File Requirements

- File format: KML (.kml extension)
- Maximum file size: 10MB
- Must contain valid XML structure
- Coordinates format: longitude,latitude,altitude (space-separated)

## Error Handling

The endpoint handles various error scenarios:

- Invalid file format (non-KML)
- Corrupted XML structure
- Missing coordinate data
- File size exceeded
- Network issues during parsing

## Testing

Run the test suite:

```bash
npm test src/flight-data/flight-data.service.spec.ts
```