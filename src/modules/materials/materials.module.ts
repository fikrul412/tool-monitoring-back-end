import { Module } from "@nestjs/common";
import { MaterialsController } from "./materials.controller.js";
import { MaterialsService } from "./materials.service.js";
import { MaterialsRepository } from "../../repositories/materials.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

@Module({
  controllers: [MaterialsController],
  providers: [
    MaterialsService,
    MaterialsRepository,
    LaboratoryRepository,
    IdentityRepository,
  ],
  exports: [MaterialsService, MaterialsRepository],
})
export class MaterialsModule {}
