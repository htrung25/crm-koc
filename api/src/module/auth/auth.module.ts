import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminModule } from '../admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from 'src/passport/local.strategy';

@Module({
  imports: [
    AdminModule,
    JwtModule.register({
      secret:
        '25f38c6628cb3e9d09cdbed8beb2f0078e19e442f9a5d4475a10c86820021ff8',
      signOptions: { expiresIn: 3600 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
