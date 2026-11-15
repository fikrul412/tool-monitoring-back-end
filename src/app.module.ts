import { config as loadEnv } from 'dotenv';
loadEnv({ path: ['../.env', '.env'] });
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { DrizzleModule } from "@nestjs/drizzle"
import { AppService } from './app.service.js';
import { drizzle } from 'drizzle-orm/node-postgres'
import { AuthModule } from './modules/auth/auth.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { LaboratoryModule } from './modules/laboratory/laboratory.module.js';
import { EquipmentModule } from './modules/equipment/equipment.module.js';
import { MaterialsModule } from './modules/materials/materials.module.js';
import { ResearchModule } from './modules/research/research.module.js';
import { PersuratanModule } from './modules/persuratan/persuratan.module.js';
import { BorrowingModule } from './modules/borrowing/borrowing.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { WasteModule } from './modules/waste/waste.module.js';
import { QrModule } from './modules/qr/qr.module.js';

@Module({
  imports: [
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_URL!
    }),
    AuthModule,
    IdentityModule,
    LaboratoryModule,
    EquipmentModule,
    MaterialsModule,
    ResearchModule,
    PersuratanModule,
    BorrowingModule,
    AttendanceModule,
    WasteModule,
    QrModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
