import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, IsUUID, MinLength } from 'class-validator';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { QrService } from './qr.service.js';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
class VerifyQrDto { @IsString() @MinLength(1) token: string; }
class RefreshQrDto { @IsUUID() jti: string; }

@Controller('qr')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Req() req: AuthenticatedRequest, @Body() dto: RefreshQrDto) {
    return this.qr.refresh(dto.jti, req.user.sub, req.user.role);
  }

  @Get('status/:jti')
  @UseGuards(JwtAuthGuard)
  status(@Req() req: AuthenticatedRequest, @Param('jti', ParseUUIDPipe) jti: string) {
    return this.qr.status(jti, req.user.sub);
  }

  @Post('verify')
  verify(@Body() dto: VerifyQrDto) {
    return this.qr.verify(dto.token);
  }

}
