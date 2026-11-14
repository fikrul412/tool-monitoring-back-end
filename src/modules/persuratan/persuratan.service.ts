import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PersuratanRepository } from './persuratan.repository.js';

@Injectable()
export class PersuratanService {
  constructor(private readonly repo: PersuratanRepository) {}
  eligible(studentId: string) { return this.repo.eligible(studentId); }
  archive(studentId: string) { return this.repo.archive(studentId); }
  adminApplications() { return this.repo.adminApplications(); }
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
