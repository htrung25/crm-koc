import { ERole } from 'src/common/enum/roles.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EAccountStatus } from 'src/common/enum/account-statuses.enum';

@Entity()
export class BrandList {
  @PrimaryGeneratedColumn('uuid')
  accountId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: ERole })
  account_role: ERole;

  @Column({ type: 'enum', enum: EAccountStatus })
  status: EAccountStatus;
}
