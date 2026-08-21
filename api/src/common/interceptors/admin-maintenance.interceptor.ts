// import {
//   CallHandler,
//   ExecutionContext,
//   HttpException,
//   HttpStatus,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { SystemConfigurationService } from '../../module/admin/system-configuration.service';

// @Injectable()
// export class AdminMaintenanceInterceptor implements NestInterceptor {
//   constructor(
//     private readonly systemConfigurationService: SystemConfigurationService,
//   ) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Promise<Observable<any>> {
//     const toggles =
//       await this.systemConfigurationService.getEnvironmentToggles();
//     const isSystemActive = toggles?.ENV_SYSTEM_ACTIVE ?? true;

//     if (!isSystemActive) {
//       const request = context.switchToHttp().getRequest();
//       const url = request.url || '';
//       const PUBLIC_ENDPOINTS = [
//         '/apis/admin/login',
//         '/apis/admin/verify-otp',
//         '/apis/admin/resend-otp',
//         '/apis/admin/logout',
//       ];

//       // If it's a public auth endpoint, we must let it pass so users can log in
//       if (PUBLIC_ENDPOINTS.some((ep) => url.includes(ep))) {
//         return next.handle();
//       }

//       const adminInfo = request.admin;

//       // Allow if the user has ADMIN role (bypassing maintenance mode)
//       const isSuperAdmin = adminInfo && adminInfo.role === 'admin';

//       if (!isSuperAdmin) {
//         throw new HttpException(
//           {
//             statusCode: HttpStatus.SERVICE_UNAVAILABLE,
//             error: 'Service Unavailable',
//             message:
//               'Hệ thống đang bảo trì. Chỉ có Admin mới có thể thao tác lúc này.',
//             code: 'ERR_MAINTENANCE',
//           },
//           HttpStatus.SERVICE_UNAVAILABLE,
//         );
//       }
//     }

//     return next.handle();
//   }
// }
