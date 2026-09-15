import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';
import { IpWhitelistGuard } from './ip-whitelist.guard';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { CampaignReviewService } from './campaign-review.service';
import {
  ApproveCampaignDto,
  CampaignApprovedResponseDto,
} from './dto/approve-campaign.dto';

@ApiTags('Admin-Campaign')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin/campaign-reviews')
export class CampaignReviewController {
  constructor(private readonly reviews: CampaignReviewService) {}

  @Post(':submissionId/decision')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Approve the latest open campaign review against current policy',
    description:
      'Currently supports decision=approve only. Any admin with an allowed IP may approve.',
  })
  @ApiOkResponse({ type: CampaignApprovedResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid body or unsupported decision',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired session' })
  @ApiForbiddenResponse({
    description: 'Admin role/IP required, or brand KYC no longer verified',
  })
  @ApiNotFoundResponse({ description: 'Campaign review does not exist' })
  @ApiConflictResponse({
    description: 'Stale revision/version or already decided',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Current policy or restricted category checklist is not satisfied',
  })
  approve(
    @Request() request: { user: AuthenticatedAccount },
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() dto: ApproveCampaignDto,
  ): Promise<CampaignApprovedResponseDto> {
    return this.reviews.approve(submissionId, dto, request.user.id);
  }
}
