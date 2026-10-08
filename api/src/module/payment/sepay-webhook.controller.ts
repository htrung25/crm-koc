import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DepositService } from './deposit.service';

// Không có JWT: SePay gọi từ ngoài vào, xác thực bằng header Apikey trong service.
@ApiTags('Webhooks')
@Controller('payment/webhooks')
export class SepayWebhookController {
  constructor(private readonly depositService: DepositService) {}

  @Post('sepay')
  @HttpCode(200)
  @ApiOperation({
    summary: 'SePay bank transfer webhook',
    description:
      'Called by SePay with header "Authorization: Apikey <key>". Always ' +
      'answers {"success": true} once the transfer is handled or ignored, so ' +
      'SePay stops retrying.',
  })
  @ApiOkResponse({ description: '{"success": true}' })
  @ApiUnauthorizedResponse({ description: 'Wrong or missing API key' })
  // unknown thay vì DTO: ValidationPipe đang forbidNonWhitelisted, SePay thêm
  // trường mới là mọi webhook bị 400. Service tự kiểm các trường cần dùng.
  async sepay(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: unknown,
  ) {
    return this.depositService.handleSepayWebhook(authorization, payload);
  }
}
