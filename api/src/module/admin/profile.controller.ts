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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt.guard';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('Admin-Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admin/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Profile of the authenticated account' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(@Request() request: { user: AuthenticatedAccount }) {
    const profile = await this.profileService.findByAccountId(request.user.id);
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return profile;
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({
    description: 'Email already taken by another account',
  })
  updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(request.user.id, dto);
  }
}
