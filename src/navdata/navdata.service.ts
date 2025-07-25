import { Injectable, NotFoundException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { FIR } from "./utils/typing";

@Injectable()
export class NavDataService {
    private readonly dataDir = path.join(__dirname, "..", "..", "..", "data");
    private readonly navdataPath = path.join(this.dataDir, "navdata");

    private readJson(filePath: string) {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return null;
        }
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    private safeReadJson(filePath: string) {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch {
            return [];
        }
    }

    getNavdata(select?: {
        waypoints?: {
            all?: boolean;
            vfr?: boolean;
            ifr?: boolean;
        };
        aerodromes?: boolean;
        navaids?: boolean;
        fir?: string;
        all?: boolean;
    }): FIR[] {
        const firsList = select?.fir
            ? [select.fir]
            : fs
                  .readdirSync(this.navdataPath)
                  .filter((f) => fs.statSync(path.join(this.navdataPath, f)).isDirectory());

        const firsData: FIR[] = firsList.map((fir) => {
            const includeAll = !select || Object.keys(select).length === 0 || select.all;

            const includeVFR = includeAll || select?.waypoints?.all || select?.waypoints?.vfr;
            const includeIFR = includeAll || select?.waypoints?.all || select?.waypoints?.ifr;
            const includeAD = includeAll || select?.aerodromes;
            const includeNavaids = includeAll || select?.navaids;

            return {
                fir,
                info: this.safeReadJson(path.join(this.navdataPath, fir, "info.json")),
                waypoints: {
                    vfr: includeVFR
                        ? this.safeReadJson(path.join(this.navdataPath, fir, "vfr_wpts.json"))
                        : null,
                    ifr: includeIFR
                        ? this.safeReadJson(path.join(this.navdataPath, fir, "ifr_wpts.json"))
                        : null,
                },
                ad: includeAD
                    ? this.safeReadJson(path.join(this.navdataPath, fir, "ad.json"))
                    : null,
                navaid: includeNavaids
                    ? this.safeReadJson(path.join(this.navdataPath, fir, "navaids.json"))
                    : null,
            };
        });

        return firsData;
    }

    getAdData(icaoCode: string) {
        const firs = fs
            .readdirSync(this.navdataPath)
            .filter((f) => fs.statSync(path.join(this.navdataPath, f)).isDirectory());

        for (const fir of firs) {
            const adData = this.safeReadJson(path.join(this.navdataPath, fir, "ad.json"));
            const ad = adData.find((ad) => ad.icao.toUpperCase() === icaoCode.toUpperCase());
            if (ad) {
                return { fir, ad };
            }
        }

        return null;
    }
}
