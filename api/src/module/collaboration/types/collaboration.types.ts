import { ERole } from '../../../common/enum/roles.enum';

/** Người gọi, lấy từ token. Vai trò quyết định cả phạm vi lẫn quyền chuyển. */
export interface CollaborationActor {
  id: string;
  role: ERole;
}
