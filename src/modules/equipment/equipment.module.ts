import { Module } from "@nestjs/common";
import { EquipmentController } from "./equipment.controller.js";
import { EquipmentService } from "./equipment.service.js";
import { EquipmentRepository } from "../../repositories/equipment.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

@Module({
  controllers: [EquipmentController],
  providers: [
    EquipmentService,
    EquipmentRepository,
    LaboratoryRepository,
    IdentityRepository,
  ],
  exports: [EquipmentService, EquipmentRepository],
})
export class EquipmentModule {}
