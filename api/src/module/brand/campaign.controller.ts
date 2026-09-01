import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// Đường dẫn tương đối, KHÔNG dùng 'src/...': nest build có rewrite nên dist vẫn
// chạy, nhưng check-routes.js nạp thẳng src qua ts-node và sẽ không phân giải được.
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';

@ApiTags('Brand-Campaign')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/campaign')
export class CampaignController {}
