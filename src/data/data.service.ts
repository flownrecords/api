import { Injectable, NotFoundException } from "@nestjs/common";
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataService {
  private readonly dataDir = path.join(__dirname, '..', '..', 'data');

  private readJson(filePath: string) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private safeReadJson(filePath: string) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }

  // 🔹 Get ALL navdata FIR directories
  getAllNavdata(): string[] {
    const navdataPath = path.join(this.dataDir, 'navdata');
    return fs.readdirSync(navdataPath).filter(f =>
      fs.statSync(path.join(navdataPath, f)).isDirectory()
    );
  }

  // 🔹 Get waypoints (VFR & IFR) — for specific FIR or all
  getWaypoints(firIcao?: string) {
    const navdataPath = path.join(this.dataDir, 'navdata');

    const firs = firIcao
      ? [firIcao]
      : fs.readdirSync(navdataPath).filter(f =>
          fs.statSync(path.join(navdataPath, f)).isDirectory()
        );

    const result = firs.map(fir => {
      const firPath = path.join(navdataPath, fir);
      return {
        firIcao: fir,
        vfr: this.safeReadJson(path.join(firPath, 'vfr_wpts.json')),
        ifr: this.safeReadJson(path.join(firPath, 'ifr_wpts.json')),
      };
    });

    return firIcao ? result[0] : result;
  }

  // 🔹 Get all aerodromes (optionally scoped to one FIR)
  getAllAd(firIcao?: string) {
    const navdataPath = path.join(this.dataDir, 'navdata');

    const firs = firIcao
      ? [firIcao]
      : fs.readdirSync(navdataPath).filter(f =>
          fs.statSync(path.join(navdataPath, f)).isDirectory()
        );

    const aerodromes = firs.flatMap(fir => {
      const adPath = path.join(navdataPath, fir, 'ad.json');
      const data = this.safeReadJson(adPath);
      return data.map((ad: any) => ({ ...ad, fir }));
    });

    return aerodromes;
  }

  // 🔹 Get a specific aerodrome by ICAO (searches all FIRs)
  getAdData(icaoCode: string) {
    const allAd = this.getAllAd();
    const ad = allAd.find((a: any) => a.icao.toUpperCase() === icaoCode.toUpperCase());
    if (!ad) throw new NotFoundException(`Aerodrome ${icaoCode} not found`);
    return ad;
  }

  // 🔹 Get all aircraft types (just file names)
  getAllAircraftData(): string[] {
    const aircraftDir = path.join(this.dataDir, 'aircraft');
    return fs.readdirSync(aircraftDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
  }

  // 🔹 Get a specific aircraft data file
  getAircraftData(id: string) {
    const filePath = path.join(this.dataDir, 'aircraft', `${id}.json`);
    const data = this.readJson(filePath);
    if (!data) throw new NotFoundException(`Aircraft data for "${id}" not found`);
    return data;
  }
}
