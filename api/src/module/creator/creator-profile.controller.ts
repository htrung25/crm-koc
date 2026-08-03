import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { CreatorProfileService } from './creator-profile.service';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CreatorProfileResponseDto } from './dto/creator-profile-response.dto';

@ApiTags('Creator-Profile')
@ApiBearerAuth('access-token')
@Roles(ERole.CREATOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('creator/profile')
export class CreatorProfileController {
  constructor(private readonly creatorProfileService: CreatorProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Your own creator profile' })
  @ApiOkResponse({ type: CreatorProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<CreatorProfileResponseDto> {
    const profile = await this.creatorProfileService.findByAccountId(
      request.user.id,
    );
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return CreatorProfileResponseDto.from(profile);
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own creator profile' })
  @ApiOkResponse({ type: CreatorProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({ description: 'Email already taken' })
  async updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfileResponseDto> {
    return CreatorProfileResponseDto.from(
      await this.creatorProfileService.update(request.user.id, dto),
    );
  }
}
