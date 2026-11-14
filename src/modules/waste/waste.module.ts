import { Module } from '@nestjs/common';
import { WasteController } from './waste.controller.js';
import { WasteRepository } from './waste.repository.js';
import { WasteService } from './waste.service.js';

@Module({ controllers: [WasteController], providers: [WasteService, WasteRepository] })
export class WasteModule {}
