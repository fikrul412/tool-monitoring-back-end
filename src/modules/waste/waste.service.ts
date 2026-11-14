import { BadRequestException, Injectable } from '@nestjs/common';
import { WasteRepository } from './waste.repository.js';

@Injectable()
export class WasteService {
  constructor(private readonly repo: WasteRepository) {}
  options() { return this.repo.options(); }
  records() { return this.repo.records(); }
  deactivateOption(id: string) { return this.repo.deactivateOption(id); }
  createOption(userId: string, type: 'CATEGORY' | 'UNIT' | 'PHASE' | 'HANDLING', value: string) {
    if (!value?.trim()) throw new BadRequestException('Waste option value is required.');
    return this.repo.createOption(type, value, userId);
  }
}
