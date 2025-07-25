import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        const jwtSecret = config.get<string>("JWT_SECRET");
        if (!jwtSecret) {
            throw new Error("JWT_SECRET not defined in environment");
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: { sub: number; email: string }) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: payload.sub,
                },
                include: {
                    logbookEntries: {
                        include: {
                            plan: true,
                            recording: true,
                            crew: true,
                        },
                    },
                    crewForEntries: true,
                    organization: true,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            const { passwordHash, ...userWithoutPassword } = user;

            return userWithoutPassword;
        } catch (e) {
            console.error("Error fetching user:", e);
            throw new Error("User not found");
        }
    }
}
