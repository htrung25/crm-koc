import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { AuditLogPanel } from '@/features/admin/audit-logs/components/audit-log-panel';
import { AuditLogSkeleton } from '@/features/admin/audit-logs/components/audit-log-skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.auditLogsPage');
  return { title: t('title') };
}

export default async function AdminAuditLogsPage() {
  const t = await getTranslations('admin.auditLogsPage');

  return (
    <AdminPageShell title={t('title')} greeting={t('greeting')}>
      <Suspense fallback={<AuditLogSkeleton />}>
        <AuditLogPanel />
      </Suspense>
    </AdminPageShell>
  );
}
