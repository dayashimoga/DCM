import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiKey,
  CreateApiKeyResponse,
} from '@distributed-compute/shared-types';

@ApiTags('Developer API Keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Generate a new scoped API Key for SDK and programmatic access' })
  @ApiResponse({ status: 201, description: 'API Key generated' })
  async createApiKey(@Body() dto: CreateApiKeyDto): Promise<CreateApiKeyResponse> {
    return this.apiKeyService.createApiKey('user-cust-default', dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active API Keys for current user' })
  @ApiResponse({ status: 200, description: 'List of API Keys' })
  async listApiKeys(): Promise<ApiKey[]> {
    return this.apiKeyService.listApiKeys('user-cust-default');
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Revoke and invalidate an API Key' })
  @ApiResponse({ status: 200, description: 'API Key revoked' })
  async revokeApiKey(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.apiKeyService.revokeApiKey('user-cust-default', id);
    return { success };
  }
}
