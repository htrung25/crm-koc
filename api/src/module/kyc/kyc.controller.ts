import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import {
  KycDocumentDto,
  KycSubmissionDto,
  UploadKycDocumentDto,
} from './dto/kyc.dto';
import { KycService } from './kyc.service';
import { KycRole } from './constants/kyc.constants';

@ApiTags('KYC')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND, ERole.CREATOR)
// JwtAuthGuard chạy trước để nạp request.user, RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kyc/submissions')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @ApiOperation({
    summary: 'Open a KYC submission for your active role',
    description:
      'Đã có hồ sơ đang mở thì trả lại chính nó — bấm hai lần không tạo hai ' +
      'hồ sơ. Lần trước bị từ chối thì mở lượt kế tiếp và kế thừa tài liệu cũ.',
  })
  @ApiCreatedResponse({ type: KycSubmissionDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'KYC attempts exhausted' })
  @ApiConflictResponse({ description: 'KYC is already verified for this role' })
  async open(@Request() request: { user: AuthenticatedAccount }) {
    return this.kycService.openSubmission(
      request.user.id,
      this.role(request.user),
    );
  }

  @Post('/me/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload one document to your open submission' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'docType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        docType: { type: 'integer', example: 3 },
      },
    },
  })
  @ApiCreatedResponse({ type: KycDocumentDto })
  @ApiBadRequestResponse({
    description: 'Unsupported file type, too large, or wrong doc type for role',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({ description: 'No open submission' })
  @ApiConflictResponse({ description: 'Submission is under review' })
  async uploadDocument(
    @Request() request: { user: AuthenticatedAccount },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadKycDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.kycService.uploadDocument(
      request.user.id,
      this.role(request.user),
      dto.docType,
      file.buffer,
      file.originalname ?? null,
    );
  }

  @Get('/me/documents/:documentId')
  @ApiOperation({ summary: 'Stream/Download your own uploaded document' })
  @ApiOkResponse({ description: 'File binary stream' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Forbidden access to this document' })
  @ApiNotFoundResponse({ description: 'Document not found' })
  async downloadMyDocument(
    @Request() request: { user: AuthenticatedAccount },
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Res() res: Response,
  ) {
    const { document, streamResult } = await this.kycService.getDocumentForUser(
      request.user.id,
      this.role(request.user),
      documentId,
    );

    res.set({
      'Content-Type':
        streamResult.contentType ||
        document.mimeType ||
        'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(
        document.originalName || `kyc-document-${document.id}`,
      )}"`,
      ...(streamResult.contentLength
        ? { 'Content-Length': streamResult.contentLength.toString() }
        : {}),
    });

    streamResult.stream.pipe(res);
  }

  @Post('/me/submit')
  @ApiOperation({ summary: 'Send your submission to the review queue' })
  @ApiOkResponse({ type: KycSubmissionDto })
  @ApiBadRequestResponse({ description: 'Missing required documents' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({ description: 'No open submission' })
  async submit(@Request() request: { user: AuthenticatedAccount }) {
    return this.kycService.submit(request.user.id, this.role(request.user));
  }

  @Get('/me')
  @ApiOperation({
    summary: 'Your latest submission, its documents and attempts left',
  })
  @ApiOkResponse({ type: KycSubmissionDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  async findMine(@Request() request: { user: AuthenticatedAccount }) {
    return this.kycService.findMine(request.user.id, this.role(request.user));
  }

  private role(user: AuthenticatedAccount): KycRole {
    if (
      user.accountRole !== ERole.BRAND &&
      user.accountRole !== ERole.CREATOR
    ) {
      throw new BadRequestException('kyc applies to brand or creator only');
    }
    return user.accountRole;
  }
}
