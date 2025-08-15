export interface FIR {
    fir: string; // ICAO code of the FIR
    info: {
        name: string;
        icao: string;
        country: string;
        region: string;
        limits: Coordinates[];
    };
    waypoints: {
        vfr: Waypoint[] | null; // VFR waypoints, null if not available
        ifr: Waypoint[] | null; // IFR waypoints, null if not available
    };
    ad: Airport[] | null; // Airport data, null if not available
    navaid: Navaid[] | null; // Navaids, null if not available
}

export type Coordinates = [number, number]; // [latitude, longitude]
export type Waypoint = {};
export type Airport = {};
export type Navaid = {};
