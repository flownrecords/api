import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';

export interface UserStats {
    totalFlightHours: number;
    totalFlights: number;
    uniqueAirports: number;
    uniqueAircraftTypes: number;
    dayFlightHours: number;
    nightFlightHours: number;
    totalLandings: number;
    mostCommonAircraft: string;
    mostFrequentRoute: string;
    longestFlight: number;
}

export interface UserInfo {
    firstName?: string;
    lastName?: string;
    username: string;
    profilePictureUrl?: string;
}

export function calculateUserStats(logbookEntries: any[]): UserStats {
    if (!logbookEntries || logbookEntries.length === 0) {
        return {
            totalFlightHours: 0,
            totalFlights: 0,
            uniqueAirports: 0,
            uniqueAircraftTypes: 0,
            dayFlightHours: 0,
            nightFlightHours: 0,
            totalLandings: 0,
            mostCommonAircraft: 'N/A',
            mostFrequentRoute: 'N/A',
            longestFlight: 0,
        };
    }

    const totalFlightHours = logbookEntries.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const totalFlights = logbookEntries.length;
    const dayFlightHours = logbookEntries.reduce((sum, entry) => sum + (entry.dayTime || 0), 0);
    const nightFlightHours = logbookEntries.reduce((sum, entry) => sum + (entry.nightTime || 0), 0);
    const totalLandings = logbookEntries.reduce((sum, entry) => sum + (entry.landDay || 0) + (entry.landNight || 0), 0);

    // Calculate unique airports
    const airports = new Set<string>();
    logbookEntries.forEach(entry => {
        if (entry.depAd) airports.add(entry.depAd);
        if (entry.arrAd) airports.add(entry.arrAd);
    });

    // Calculate unique aircraft types
    const aircraftTypes = new Set<string>();
    logbookEntries.forEach(entry => {
        if (entry.aircraftType) aircraftTypes.add(entry.aircraftType);
    });

    // Find most common aircraft
    const aircraftCount: { [key: string]: number } = {};
    logbookEntries.forEach(entry => {
        if (entry.aircraftType) {
            aircraftCount[entry.aircraftType] = (aircraftCount[entry.aircraftType] || 0) + 1;
        }
    });
    const mostCommonAircraft = Object.keys(aircraftCount).reduce((a, b) => 
        aircraftCount[a] > aircraftCount[b] ? a : b, 'N/A');

    // Find most frequent route
    const routeCount: { [key: string]: number } = {};
    logbookEntries.forEach(entry => {
        if (entry.depAd && entry.arrAd) {
            const route = `${entry.depAd}-${entry.arrAd}`;
            routeCount[route] = (routeCount[route] || 0) + 1;
        }
    });
    const mostFrequentRoute = Object.keys(routeCount).length > 0 
        ? Object.keys(routeCount).reduce((a, b) => routeCount[a] > routeCount[b] ? a : b)
        : 'N/A';

    // Find longest flight
    const longestFlight = Math.max(...logbookEntries.map(entry => entry.total || 0), 0);

    return {
        totalFlightHours: Math.round(totalFlightHours * 10) / 10,
        totalFlights,
        uniqueAirports: airports.size,
        uniqueAircraftTypes: aircraftTypes.size,
        dayFlightHours: Math.round(dayFlightHours * 10) / 10,
        nightFlightHours: Math.round(nightFlightHours * 10) / 10,
        totalLandings,
        mostCommonAircraft,
        mostFrequentRoute,
        longestFlight: Math.round(longestFlight * 10) / 10,
    };
}

export async function generateReportImage(userInfo: UserInfo, stats: UserStats): Promise<Buffer> {
    const width = 1080;
    const height = 1920;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e40af'); // Blue
    gradient.addColorStop(0.5, '#3b82f6'); // Lighter blue
    gradient.addColorStop(1, '#1e3a8a'); // Dark blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Your Flight Year', width / 2, 120);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText('in Review', width / 2, 180);

    // User name
    const displayName = userInfo.firstName && userInfo.lastName 
        ? `${userInfo.firstName} ${userInfo.lastName}`
        : userInfo.username;
    
    ctx.font = 'bold 32px Arial';
    ctx.fillText(displayName, width / 2, 260);

    // Stats cards
    const cardHeight = 120;
    const cardWidth = width - 120;
    const cardX = 60;
    let currentY = 320;

    const statsData = [
        { label: 'Total Flight Hours', value: `${stats.totalFlightHours}h`, icon: '✈️' },
        { label: 'Total Flights', value: stats.totalFlights.toString(), icon: '🛫' },
        { label: 'Unique Airports', value: stats.uniqueAirports.toString(), icon: '🏢' },
        { label: 'Aircraft Types', value: stats.uniqueAircraftTypes.toString(), icon: '🛩️' },
        { label: 'Day Flight Hours', value: `${stats.dayFlightHours}h`, icon: '☀️' },
        { label: 'Night Flight Hours', value: `${stats.nightFlightHours}h`, icon: '🌙' },
        { label: 'Total Landings', value: stats.totalLandings.toString(), icon: '🛬' },
        { label: 'Most Common Aircraft', value: stats.mostCommonAircraft, icon: '🚁' },
        { label: 'Most Frequent Route', value: stats.mostFrequentRoute, icon: '🗺️' },
        { label: 'Longest Flight', value: `${stats.longestFlight}h`, icon: '⏱️' },
    ];

    // Draw stat cards
    statsData.forEach((stat, index) => {
        if (currentY + cardHeight > height - 100) return; // Skip if would overflow

        // Card background with slight transparency
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(cardX, currentY, cardWidth, cardHeight);

        // Card border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, currentY, cardWidth, cardHeight);

        // Icon
        ctx.font = '32px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(stat.icon, cardX + 20, currentY + 50);

        // Label
        ctx.font = 'bold 24px Arial';
        ctx.fillText(stat.label, cardX + 80, currentY + 40);

        // Value
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#fbbf24'; // Yellow for values
        ctx.fillText(stat.value, cardX + 80, currentY + 80);

        currentY += cardHeight + 20;
    });

    // Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by Flown Records', width / 2, height - 60);
    ctx.fillText(new Date().getFullYear().toString(), width / 2, height - 30);

    return canvas.toBuffer('image/png');
}