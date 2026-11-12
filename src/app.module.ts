import 'dotenv/config';
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
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
