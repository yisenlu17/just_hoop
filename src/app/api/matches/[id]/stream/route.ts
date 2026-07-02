import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const streamSchema = z.object({
  livestreamUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const parsed = streamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "直播链接格式不正确" }, { status: 400 });
  }

  await prisma.match.update({
    where: { id },
    data: {
      livestreamUrl: parsed.data.livestreamUrl || null,
      events: {
        create: {
          actorId: user.id,
          type: "UPLOAD_STREAM",
          note: parsed.data.livestreamUrl ? "直播链接已上传" : "直播链接已清空",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
