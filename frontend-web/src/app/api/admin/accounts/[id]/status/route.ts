import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_ROUTES } from '@/constants/routes';
import { apiRequest } from '@/lib/api/server-client';
import { errorResponse, requireSession } from '@/lib/api/route-session';

const payloadSchema = z
  .object({
    status: z.union([z.literal(2), z.literal(4)]),
    statusReason: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { message: 'ID tài khoản không hợp lệ' },
      { status: 400 }
    );
  }
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Trạng thái hoặc lý do không hợp lệ',
          businessCode: 'INVALID_BODY',
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.accountStatus(id), {
        method: 'PATCH',
        body: parsed.data,
        token: session.token,
        clientContext: session.clientContext,
      })
    );
  } catch (error) {
    return errorResponse(error);
  }
}
