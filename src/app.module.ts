import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { GeneralModule } from "./general/general.module";
import { NavDataModule } from "./navdata/navdata.module";
import { WxController } from "./wx/wx.controller";
import { WxService } from "./wx/wx.service";
import { WxModule } from "./wx/wx.module";
import { OrgsModule } from "./orgs/orgs.module";
import { OrgsService } from "./orgs/orgs.service";
import { OrgsController } from "./orgs/orgs.controller";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        UserModule,
        PrismaModule,
        GeneralModule,
        NavDataModule,
        WxModule,
        OrgsModule,
    ],
    controllers: [WxController, OrgsController],
    providers: [WxService, OrgsService],
})
export class AppModule {}
