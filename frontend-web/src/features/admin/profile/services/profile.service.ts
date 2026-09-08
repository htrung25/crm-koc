import { API_ROUTES } from '@/constants/routes';
import { apiFetch, readJson } from '@/lib/api/browser-client';
import type {
  AdminProfile,
  UpdateAdminProfile,
} from '@/features/admin/profile/types';

// Sentinel khi route trả lỗi không kèm message
export const PROFILE_LOAD_FAILED = 'PROFILE_LOAD_FAILED';

export async function getProfile(): Promise<AdminProfile> {
  return readJson<AdminProfile>(
    await apiFetch(API_ROUTES.admin.profile),
    PROFILE_LOAD_FAILED
  );
}

export async function updateProfile(
  payload: UpdateAdminProfile
): Promise<AdminProfile> {
  return readJson<AdminProfile>(
    await apiFetch(API_ROUTES.admin.profile, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    PROFILE_LOAD_FAILED
  );
}

export async function uploadAvatar(file: File): Promise<AdminProfile> {
  const formData = new FormData();
  formData.append('file', file);

  return readJson<AdminProfile>(
    await apiFetch(API_ROUTES.admin.avatar, {
      method: 'POST',
      body: formData,
    }),
    PROFILE_LOAD_FAILED
  );
}
