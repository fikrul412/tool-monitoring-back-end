import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PersuratanRepository } from './persuratan.repository.js';

@Injectable()
export class PersuratanService {
  constructor(private readonly repo: PersuratanRepository) {}
  eligible(studentId: string) { return this.repo.eligible(studentId); }
  archive(studentId: string) { return this.repo.archive(studentId); }
  adminApplications() { return this.repo.adminApplications(); }
  requestClearance(studentId: string, body: { researchId: string; materialUsage: Array<{ materialId: string; name: string; quantity: number; unit: string }>; equipmentConditions: Array<{ toolId: string; condition: string; notes?: string }>; wasteHandling: Array<{ name: string; phase: string; handling: string; quantity: number; unit: string; notes?: string }> }) {
    if (!body.researchId || !Array.isArray(body.materialUsage) || !Array.isArray(body.equipmentConditions) || !Array.isArray(body.wasteHandling)) throw new BadRequestException('Complete all lab clearance sections before submitting.');
    for (const item of body.materialUsage) if (!item.name?.trim() || !item.unit?.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0) throw new BadRequestException('Material usage requires a name, unit, and non-negative quantity.');
    for (const item of body.equipmentConditions) if (!item.toolId || !item.condition?.trim()) throw new BadRequestException('Every used equipment item requires a returned condition.');
    for (const item of body.wasteHandling) if (!item.name?.trim() || !item.phase?.trim() || !item.handling?.trim() || !item.unit?.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) throw new BadRequestException('Every waste entry requires a category, positive quantity, unit, phase, and handling method.');
    return this.repo.requestClearance(studentId, body).then(result => {
      if (result === 'NOT_ELIGIBLE') throw new NotFoundException('Ongoing research not found.');
      if (result === 'EXISTS') throw new ConflictException('A clearance application is already pending.');
      if (result === 'INVALID_MATERIAL' || result === 'INVALID_TOOL') throw new BadRequestException('Submitted items must belong to this research.');
      if (result === 'INVALID_WASTE_OPTION') throw new BadRequestException('Choose active waste options from the shared catalog.');
      return result;
    });
  }
  async apply(studentId: string, researchId: string, type: 'LAB_ACCESS' | 'LAB_CLEARANCE') {
    if (!researchId || !['LAB_ACCESS', 'LAB_CLEARANCE'].includes(type)) throw new BadRequestException('A valid research and letter type are required.');
    const result = await this.repo.apply(studentId, researchId, type);
    if (result === 'NOT_FOUND') throw new NotFoundException('Eligible research not found.');
    if (result === 'EXISTS') throw new ConflictException('This letter has already been requested for this research.');
    return result;
  }

  async review(id: string, body: { decision: 'RECEIVED' | 'REJECTED'; comments?: string }) {
    if (!['RECEIVED', 'REJECTED'].includes(body.decision)) throw new BadRequestException('Decision must be RECEIVED or REJECTED.');
    const result = await this.repo.review(id, body.decision, body.comments);
    if (result === 'NOT_FOUND') throw new NotFoundException('Submitted letter application not found.');
    if (result === 'INVALID_RESEARCH_STATE') throw new ConflictException('Research is no longer in a valid state for this letter.');
    if (result === 'ALREADY_REVIEWED') throw new ConflictException('This letter application has already been reviewed.');
    return result;
  }
}
