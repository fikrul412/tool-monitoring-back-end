
import { Module } from "@nestjs/common";

import { ResearchController } from "./research.controller.js";
import { ResearchService } from "./research.service.js";
import { ResearchRepository } from "../../repositories/research.repository.js";

@Module({
  controllers: [ResearchController],
  providers: [ResearchService, ResearchRepository],
  exports: [ResearchService, ResearchRepository],
})
export class ResearchModule {}
