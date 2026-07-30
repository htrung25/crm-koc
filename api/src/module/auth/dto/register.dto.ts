import { EAccountRole } from 'src/common/enum/account-roles.enum';

export class RegisterDto {
  email!: string;
  password!: string;
  phone!: string;
  accountRole!: EAccountRole;
}
