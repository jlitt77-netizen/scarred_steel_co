import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { settingUpsertSchema } from "@/lib/validation";

export async function listSettings(ctx: AuthContext) {
  requirePermission(ctx, "settings:read");
  return prisma.appSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
}

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.appSetting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function upsertSetting(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "settings:write");
  const data = settingUpsertSchema.parse(input);
  const before = await prisma.appSetting.findUnique({ where: { key: data.key } });
  const setting = await prisma.appSetting.upsert({
    where: { key: data.key },
    update: { value: data.value, category: data.category, description: data.description, updatedById: ctx.userId },
    create: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "AppSetting",
    entityId: setting.id,
    action: before ? "update" : "create",
    field: data.key,
    before: before?.value,
    after: setting.value,
    userId: ctx.userId,
  });
  return setting;
}
