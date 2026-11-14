import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceRepository } from './attendance.repository.js';
@Module({ controllers: [AttendanceController], providers: [AttendanceRepository] })
export class AttendanceModule {}
