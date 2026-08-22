import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { IpWhitelistGuard } from '../admin/ip-whitelist.guard';
import { SuperAdminGuard } from '../admin/super-admin.guard';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { KycFilterDto, KycSubmissionDto, ReviewKycDto } from './dto/kyc.dto';
import { KycService } from './kyc.service';

@ApiTags('Admin-KYC')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin/kyc')
export class KycAdminController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  @ApiOperation({
    summary: 'Review queue: priority first, then submission order',
  })
  @ApiFilterResponse(KycSubmissionDto)
  @ApiBadRequestResponse({ description: 'Malformed filter value' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  async findAll(@Query() query: KycFilterDto) {
    return this.kycService.findAll(query);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'One submission with its document metadata' })
  @ApiOkResponse({ type: KycSubmissionDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Submission not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.kycService.findById(id);
  }

  @Get('/:id/documents/:documentId')
  @ApiOperation({ summary: 'Download document by documentId' })
  @ApiOkResponse({ type: Buffer })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Submission not found' })
  async downloadDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.kycService.findById(id);
  }

  // Quyền kyc.review tạm ánh xạ sang SuperAdminGuard: repo chỉ có hai mức
  // admin/super_admin, chưa có hệ thống permission chi tiết.
  @Patch('/:id/status')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Approve, ask for more info, reject, or revoke. kyc.review only',
    description:
      'Từ chối ở lượt thứ 3 sẽ chuyển thẳng sang LOCKED — người dùng hết ' +
      'đường nộp lại và trạng thái phải nói đúng điều đó.',
  })
  @ApiOkResponse({ type: KycSubmissionDto })
  @ApiBadRequestResponse({
    description: 'Transition not allowed, or missing reason/note',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({ description: 'Submission not found' })
  async review(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewKycDto,
  ) {
    // reviewerId lấy từ token, không nhận từ body.
    return this.kycService.review(id, dto, request.user.id);
  }
}
