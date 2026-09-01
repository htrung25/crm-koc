import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/security/roles.decorator';
import { ERole } from 'src/common/enum/roles.enum';
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/security/jwt-auth.guard';
import { RolesGuard } from 'src/security/roles.guard';

@ApiTags('Brand-Campaign')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/campaign')
export class CampaignController {}
