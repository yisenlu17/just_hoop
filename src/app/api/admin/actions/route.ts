import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1);
const noteSchema = z.string().trim().max(2000).optional().default("");

function refreshAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/referee", "layout");
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "没有管理员权限" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = z.string().parse(body.action);

    if (action === "SET_USER_STATUS") {
      const input = z
        .object({
          userId: idSchema,
          status: z.enum(["ACTIVE", "BANNED", "PENDING_REVIEW"]),
          note: noteSchema,
        })
        .parse(body);
      if (input.userId === admin.id && input.status === "BANNED") {
        throw new Error("不能封禁当前管理员账号");
      }
      await prisma.$transaction([
        prisma.user.update({
          where: { id: input.userId },
          data: { status: input.status },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: input.status === "BANNED" ? "BAN_USER" : "UPDATE_USER_STATUS",
            targetType: "user",
            targetId: input.userId,
            note: input.note || `状态调整为 ${input.status}`,
          },
        }),
      ]);
    } else if (action === "ADJUST_USER_CREDIT") {
      const input = z
        .object({
          userId: idSchema,
          delta: z.coerce.number().int().min(-100).max(100),
          note: z.string().trim().min(2).max(500),
        })
        .parse(body);
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId } });
        const nextScore = Math.max(0, Math.min(120, user.creditScore + input.delta));
        await tx.user.update({
          where: { id: input.userId },
          data: { creditScore: nextScore },
        });
        if (input.delta < 0) {
          await tx.violationRecord.create({
            data: {
              userId: input.userId,
              reason: input.note,
              creditDelta: input.delta,
              createdById: admin.id,
            },
          });
        }
        await tx.adminLog.create({
          data: {
            adminId: admin.id,
            action: "ADJUST_USER_CREDIT",
            targetType: "user",
            targetId: input.userId,
            note: `${input.note}（${input.delta > 0 ? "+" : ""}${input.delta}，调整后 ${nextScore}）`,
          },
        });
      });
    } else if (action === "UPDATE_USER_NOTE") {
      const input = z
        .object({ userId: idSchema, note: z.string().trim().max(2000) })
        .parse(body);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: input.userId },
          data: { adminNote: input.note || null },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE_USER_NOTE",
            targetType: "user",
            targetId: input.userId,
            note: input.note || "清空管理员备注",
          },
        }),
      ]);
    } else if (action === "REVIEW_REFEREE") {
      const input = z
        .object({
          applicationId: idSchema,
          decision: z.enum(["APPROVED", "REJECTED"]),
          note: z.string().trim().min(2).max(1000),
        })
        .parse(body);
      await prisma.$transaction(async (tx) => {
        const application = await tx.refereeApplication.findUniqueOrThrow({
          where: { id: input.applicationId },
          include: { user: true },
        });
        const approved = input.decision === "APPROVED";
        await tx.refereeApplication.update({
          where: { id: application.id },
          data: {
            status: input.decision,
            adminNote: input.note,
            reviewedById: admin.id,
            reviewedAt: new Date(),
          },
        });
        await tx.user.update({
          where: { id: application.userId },
          data: {
            isReferee: approved,
            role: application.user.isAdmin
              ? "ADMIN"
              : approved
                ? "REFEREE"
                : "PLAYER",
          },
        });
        await tx.adminLog.create({
          data: {
            adminId: admin.id,
            action: approved
              ? "APPROVE_REFEREE_APPLICATION"
              : "REJECT_REFEREE_APPLICATION",
            targetType: "referee_application",
            targetId: application.id,
            note: input.note,
          },
        });
      });
    } else if (action === "UPDATE_MATCH_STATUS") {
      const input = z
        .object({
          matchId: idSchema,
          status: z.enum(["CANCELLED", "INVALID"]),
          note: z.string().trim().min(2).max(1000),
        })
        .parse(body);
      await prisma.$transaction([
        prisma.match.update({
          where: { id: input.matchId },
          data: { status: input.status, adminNote: input.note },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: input.status === "INVALID" ? "INVALIDATE_MATCH" : "CANCEL_MATCH",
            targetType: "match",
            targetId: input.matchId,
            note: input.note,
          },
        }),
      ]);
    } else if (action === "UPDATE_MATCH_SCORE") {
      const input = z
        .object({
          matchId: idSchema,
          teamAScore: z.coerce.number().int().min(0).max(999),
          teamBScore: z.coerce.number().int().min(0).max(999),
          note: z.string().trim().min(2).max(1000),
        })
        .parse(body);
      const winnerTeam =
        input.teamAScore === input.teamBScore
          ? null
          : input.teamAScore > input.teamBScore
            ? "A"
            : "B";
      await prisma.$transaction([
        prisma.match.update({
          where: { id: input.matchId },
          data: {
            teamAScore: input.teamAScore,
            teamBScore: input.teamBScore,
            winnerTeam,
            adminNote: input.note,
          },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE_MATCH_RESULT",
            targetType: "match",
            targetId: input.matchId,
            note: `${input.note}（${input.teamAScore}:${input.teamBScore}）`,
          },
        }),
      ]);
    } else if (action === "ASSIGN_REFEREE") {
      const input = z
        .object({
          matchId: idSchema,
          refereeId: z.string(),
          note: noteSchema,
        })
        .parse(body);
      if (input.refereeId) {
        const referee = await prisma.user.findFirst({
          where: { id: input.refereeId, isReferee: true, status: "ACTIVE" },
        });
        if (!referee) throw new Error("所选用户没有可用裁判权限");
      }
      await prisma.$transaction([
        prisma.match.update({
          where: { id: input.matchId },
          data: { refereeId: input.refereeId || null },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: "ASSIGN_MATCH_REFEREE",
            targetType: "match",
            targetId: input.matchId,
            note: input.note || (input.refereeId ? "重新分配裁判" : "取消裁判分配"),
          },
        }),
      ]);
    } else if (action === "UPDATE_MATCH_NOTE") {
      const input = z
        .object({ matchId: idSchema, note: z.string().trim().max(2000) })
        .parse(body);
      await prisma.$transaction([
        prisma.match.update({
          where: { id: input.matchId },
          data: { adminNote: input.note || null },
        }),
        prisma.adminLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE_MATCH_NOTE",
            targetType: "match",
            targetId: input.matchId,
            note: input.note || "清空管理员备注",
          },
        }),
      ]);
    } else if (action === "RESOLVE_DISPUTE") {
      const input = z
        .object({
          disputeId: idSchema,
          status: z.enum(["REVIEWING", "RESOLVED", "REJECTED"]),
          matchAction: z.enum(["KEEP", "INVALID", "UPDATE_SCORE"]).default("KEEP"),
          teamAScore: z.coerce.number().int().min(0).max(999).optional(),
          teamBScore: z.coerce.number().int().min(0).max(999).optional(),
          note: z.string().trim().min(2).max(2000),
        })
        .parse(body);
      await prisma.$transaction(async (tx) => {
        const dispute = await tx.dispute.findUniqueOrThrow({
          where: { id: input.disputeId },
        });
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: input.status,
            adminNote: input.note,
            resolvedById: input.status === "REVIEWING" ? null : admin.id,
            resolvedAt: input.status === "REVIEWING" ? null : new Date(),
          },
        });
        if (input.matchAction === "INVALID") {
          await tx.match.update({
            where: { id: dispute.matchId },
            data: { status: "INVALID", adminNote: input.note },
          });
        }
        if (input.matchAction === "UPDATE_SCORE") {
          if (input.teamAScore === undefined || input.teamBScore === undefined) {
            throw new Error("修改比分时必须填写双方比分");
          }
          await tx.match.update({
            where: { id: dispute.matchId },
            data: {
              teamAScore: input.teamAScore,
              teamBScore: input.teamBScore,
              winnerTeam:
                input.teamAScore === input.teamBScore
                  ? null
                  : input.teamAScore > input.teamBScore
                    ? "A"
                    : "B",
              adminNote: input.note,
            },
          });
        }
        await tx.adminLog.create({
          data: {
            adminId: admin.id,
            action:
              input.status === "REJECTED"
                ? "REJECT_DISPUTE"
                : input.status === "RESOLVED"
                  ? "RESOLVE_DISPUTE"
                  : "REVIEW_DISPUTE",
            targetType: "dispute",
            targetId: dispute.id,
            note: `${input.note}（比赛处理：${input.matchAction}）`,
          },
        });
      });
    } else if (action === "UPDATE_PAYMENT_STATUS") {
      const input = z
        .object({
          paymentId: idSchema,
          status: z.enum(["PENDING", "MANUAL_REVIEW", "PAID", "REFUNDED"]),
          note: z.string().trim().min(2).max(1000),
        })
        .parse(body);
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: input.paymentId },
          data: {
            status: input.status,
            adminNote: input.note,
            reviewedById: admin.id,
            reviewedAt: new Date(),
          },
        });
        const remaining = await tx.payment.count({
          where: { matchId: payment.matchId, status: { not: "PAID" } },
        });
        await tx.match.update({
          where: { id: payment.matchId },
          data: {
            paymentStatus:
              input.status === "REFUNDED"
                ? "REFUNDED"
                : remaining === 0
                  ? "PAID"
                  : "PENDING",
          },
        });
        await tx.adminLog.create({
          data: {
            adminId: admin.id,
            action:
              input.status === "PAID"
                ? "CONFIRM_PAYMENT"
                : input.status === "REFUNDED"
                  ? "REFUND_PAYMENT"
                  : "UPDATE_PAYMENT_STATUS",
            targetType: "payment",
            targetId: payment.id,
            note: input.note,
          },
        });
      });
    } else {
      return NextResponse.json({ error: "未知管理员操作" }, { status: 400 });
    }

    refreshAdmin();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "参数错误"
        : error instanceof Error
          ? error.message
          : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
