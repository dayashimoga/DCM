import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { ReportSecurityEventDto } from './dto/report-security-event.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  SecurityAuditSummary,
  SecurityEvent,
  SandboxSecurityPolicy,
} from '@distributed-compute/shared-types';

@ApiTags('Security Hardening & Sandboxing')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Public()
  @Get('audit')
  @ApiOperation({ summary: 'Get platform defense-in-depth security audit log, compliance score, and threat metrics' })
  @ApiResponse({ status: 200, description: 'Security audit summary' })
  async getAuditSummary(): Promise<SecurityAuditSummary> {
    return this.securityService.getAuditSummary();
  }

  @Public()
  @Get('policy')
  @ApiOperation({ summary: 'Get current sandbox security policy baseline' })
  @ApiResponse({ status: 200, description: 'Sandbox security policy baseline' })
  getBaselinePolicy(): SandboxSecurityPolicy {
    return this.securityService.getBaselinePolicy();
  }

  @Public()
  @Post('events')
  @ApiOperation({ summary: 'Ingest and classify container sandbox security events & threat detections' })
  @ApiResponse({ status: 200, description: 'Security event recorded' })
  async reportSecurityEvent(@Body() dto: ReportSecurityEventDto): Promise<SecurityEvent> {
    return this.securityService.reportSecurityEvent(dto);
  }
}
