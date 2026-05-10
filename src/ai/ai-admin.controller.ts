import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AiService } from './ai.service';
import { GenerateDto } from './dto/generate.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';
import { UsageResponseDto } from './dto/usage-response.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiAdminController {
  constructor(private readonly aiService: AiService) {}

  @Get('usage')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiOkResponse({ type: UsageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getUsage(): UsageResponseDto {
    return this.aiService.getUsage();
  }

  @Post('generate')
  @Roles(UserRole.editor, UserRole.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate free-form AI response' })
  @ApiOkResponse({ type: GenerateResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded' })
  async generate(
    @Body() dto: GenerateDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GenerateResponseDto> {
    try {
      return await this.aiService.generate(dto, user);
    } catch (error: unknown) {
      const response = error as {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      if (response?.getStatus?.() === 429) {
        const body = response.getResponse() as { retryAfter?: number };
        if (body?.retryAfter) {
          res.setHeader('Retry-After', String(body.retryAfter));
        }
      }
      throw error;
    }
  }
}
