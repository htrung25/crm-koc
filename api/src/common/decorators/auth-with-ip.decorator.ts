import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { IpWhitelistGuard } from 'src/module/admin/ip-whitelist.guard';
import { SessionGuard } from 'src/security/session.guard';

export function AuthWithIpCheck() {
  return applyDecorators(
    UseGuards(SessionGuard, IpWhitelistGuard),
    ApiSecurity('CookieAuth'),
    ApiUnauthorizedResponse({
      description: 'Session expired or not authenticated',
    }),
    ApiForbiddenResponse({ description: 'IP not in whitelist' }),
  );
}
