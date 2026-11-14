import { Module } from '@nestjs/common';
import { PersuratanController } from './persuratan.controller.js';
import { PersuratanService } from './persuratan.service.js';
import { PersuratanRepository } from './persuratan.repository.js';

@Module({
  controllers: [PersuratanController],
  providers: [PersuratanService, PersuratanRepository],
})
export class PersuratanModule {}
