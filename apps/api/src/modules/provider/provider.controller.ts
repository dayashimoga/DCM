import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProviderService } from './provider.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  UserRole,
  UserProfile,
  PairingTokenResponse,
  NodeRegistrationResponse,
  HeartbeatResponse,
  ComputeNode,
} from '@distributed-compute/shared-types';

@ApiTags('Provider & Node Management')
@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiBearerAuth()
  @Post('pairing-tokens')
  @ApiOperation({ summary: 'Generate a new node pairing token for the authenticated provider' })
  @ApiResponse({ status: 201, description: 'Pairing token generated successfully' })
  async generatePairingToken(@CurrentUser() user: UserProfile): Promise<PairingTokenResponse> {
    return this.providerService.generatePairingToken(user.id);
  }

  @Public()
  @Post('nodes/register')
  @ApiOperation({ summary: 'Register a new hardware compute node using a pairing token' })
  @ApiResponse({ status: 201, description: 'Node registered and marked online' })
  @ApiResponse({ status: 401, description: 'Invalid or expired pairing token' })
  async registerNode(@Body() dto: RegisterNodeDto): Promise<NodeRegistrationResponse> {
    return this.providerService.registerNode(dto);
  }

  @Public()
  @Post('nodes/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit real-time hardware telemetry and keepalive heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async heartbeat(@Body() dto: HeartbeatDto): Promise<HeartbeatResponse> {
    return this.providerService.processHeartbeat(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('nodes')
  @ApiOperation({ summary: 'List all registered nodes for the authenticated provider' })
  @ApiResponse({ status: 200, description: 'List of registered compute nodes with live telemetry' })
  async getNodes(@CurrentUser() user: UserProfile): Promise<ComputeNode[]> {
    return this.providerService.getProviderNodes(user.id);
  }
}
