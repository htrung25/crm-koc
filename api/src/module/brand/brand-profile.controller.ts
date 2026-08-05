import {
  Body,
  Controller,
  // Delete,
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
import { BrandProfileService } from './brand-profile.service';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
import { BrandProfileResponseDto } from './dto/brand-profile-response.dto';

@ApiTags('Brand')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/profile')
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Your own brand profile' })
  @ApiOkResponse({ type: BrandProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<BrandProfileResponseDto> {
    const profile = await this.brandProfileService.findByAccountId(
      request.user.id,
    );
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return BrandProfileResponseDto.from(profile);
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own brand profile' })
  @ApiOkResponse({ type: BrandProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({ description: 'Email or tax code already taken' })
  async updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateBrandProfileDto,
  ): Promise<BrandProfileResponseDto> {
    return BrandProfileResponseDto.from(
      await this.brandProfileService.update(request.user.id, dto),
    );
  }

  // @Delete('/me')
  // @ApiOperation({summary: 'Delete brand profile & account'})
  // @ApiUnauthorizedResponse({
  //   description: 'Token is missing, invalid or expired',
  // })
  // @ApiForbiddenResponse({ description: 'Not a brand account' })
  // @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  // @ApiConflictResponse({ description: 'Email or tax code already taken' })
  // async deleteMe(@Req()req){
  //   const userId = req.user.id;
  //   return this.brandProfileService.remove(userId);
  // }
}
