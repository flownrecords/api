import { HttpStatus, Injectable } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class GeneralService {
    private readonly dataDir = path.join(__dirname, "..", "..", "..", "data");
    private readonly genPath = path.join(this.dataDir, "general");
    private readonly filesPath = path.join(this.dataDir, "files");

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

    getDownloadFile(res: Response, id: string) {
        const filePath = path.join(this.filesPath, `${id}`);

        if (!fs.existsSync(filePath)) {
            console.error(`Download file not found: ${filePath}`);
            return res.status(HttpStatus.NOT_FOUND).send('File not found');
        }

        res.download(filePath, `${id}`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error downloading file');
            }
        });
    }
}
