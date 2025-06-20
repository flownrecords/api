import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { GeneralModule } from './general/general.module';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    AuthModule, 
    UserModule, 
    PrismaModule, 
    GeneralModule,
    DataModule
  ],
})
export class AppModule {}
