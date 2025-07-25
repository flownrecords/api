import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class GeneralService {
    private readonly dataDir = path.join(__dirname, "..", "..", "..", "data");
    private readonly genPath = path.join(this.dataDir, "general");

    private safeReadJson(filePath: string) {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch {
            return [];
        }
    }

    getRoles() {
        const rolesPath = path.join(this.genPath, "organizationRoles.json");
        if (!fs.existsSync(rolesPath)) {
            console.error(`Roles file not found: ${rolesPath}`);
            return [];
        }
        return this.safeReadJson(rolesPath);
    }
}
