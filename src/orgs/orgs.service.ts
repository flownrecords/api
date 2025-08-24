import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OrgsService {
    constructor(private prisma: PrismaService) {}
    async getOrgListForStatic() {
        return await this.prisma.organization.findMany({
            where: {
                archived: false
            },
            select: {
                id: true,
                name: true,
                handle: true,
                logoUrl: true,
                websiteUrl: true
            }
        })
    }
}
