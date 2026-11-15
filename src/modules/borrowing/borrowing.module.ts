import { Module } from '@nestjs/common';
import { BorrowingController } from './borrowing.controller.js';
import { BorrowingService } from './borrowing.service.js';
import { BorrowingRepository } from './borrowing.repository.js';
import { QrModule } from '../qr/qr.module.js';

@Module({ imports: [QrModule], controllers: [BorrowingController], providers: [BorrowingService, BorrowingRepository] })
export class BorrowingModule {}
