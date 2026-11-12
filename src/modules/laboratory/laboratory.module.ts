import { Module } from "@nestjs/common";
import { LaboratoryController } from "./laboratory.controller.js";
import { LaboratoryService } from "./laboratory.service.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

@Module({
  controllers: [LaboratoryController],
  providers: [LaboratoryService, LaboratoryRepository, IdentityRepository],
  exports: [LaboratoryService, LaboratoryRepository],
})
export class LaboratoryModule {}
