import { ERole } from '../../../common/enum/roles.enum';
import { COLLABORATION_LIST_FIELDS } from '../constants/collaboration.constants';
import { Collaboration } from '../entities/collaboration.entity';
/** Người gọi, lấy từ token. Vai trò quyết định cả phạm vi lẫn quyền chuyển. */
export interface CollaborationActor {
  id: string;
  role: ERole;
}

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type CollaborationListItem = Pick<
  Collaboration,
  (typeof COLLABORATION_LIST_FIELDS)[number]
>;

export type CollaborationTimestamp =
  'startedAt' | 'submittedAt' | 'completedAt' | 'cancelledAt';
