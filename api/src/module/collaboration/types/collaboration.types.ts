import { COLLABORATION_LIST_FIELDS } from '../constants/collaboration.constants';
import { Collaboration } from '../entities/collaboration.entity';

export type { CollaborationActor } from '../interfaces/collaboration.interfaces';

export type CollaborationListItem = Pick<
  Collaboration,
  (typeof COLLABORATION_LIST_FIELDS)[number]
>;
export type CollaborationTimestamp =
  'startedAt' | 'submittedAt' | 'completedAt' | 'cancelledAt';
