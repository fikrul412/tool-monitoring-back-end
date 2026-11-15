import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceRepository } from './attendance.repository.js';
import { QrModule } from '../qr/qr.module.js';
@Module({ imports: [QrModule], controllers: [AttendanceController], providers: [AttendanceRepository] })
export class AttendanceModule {}
