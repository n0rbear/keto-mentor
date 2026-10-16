import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { countUsage, pendingUsageCount, usageDay } from "../admin/usage-counters.js";

// Campaign links (owner request 2026-10-16): the admin creates one link per
// channel (https://ketomentor.norbapp.com/?ref=<code>) and sees how many
// visits and registrations each brought. Anonymous counts only, kept in
// UsageDaily as "ref_visit:<code>" and "ref_signup:<code>"; the link list
// itself is one AppSetting row. Unknown codes are never counted.

const KEY = "campaignLinks";
export const CODE = /^[a-z0-9-]{2,40}$/;
export const linkSchema = z.object({ code: z.string().regex(CODE), label: z.string().trim().min(1).max(80), createdAt: z.string() });
export type CampaignLink = z.infer<typeof linkSchema>;

// Starting set, created the first time the admin opens the list.
export const DEFAULT_LINKS: Array<Pick<CampaignLink, "code" | "label">> = [
  { code: "fb-csoport-hu", label: "Facebook-csoportok (magyar)" },
  { code: "fb-gruppe-de", label: "Facebook-csoportok (német/osztrák)" },
  { code: "fb-oldal", label: "Saját Facebook-oldal" },
  { code: "fb-hirdetes", label: "Facebook/Instagram-hirdetés" },
  { code: "instagram", label: "Instagram (bio, Reels)" },
  { code: "tiktok", label: "TikTok" },
  { code: "reddit", label: "Reddit" },
  { code: "norbapp", label: "norbapp.com" }
];

type Db = any;

export async function readLinks(prisma: Db): Promise<CampaignLink[]> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  // Never saved yet: the starting set already counts, before the admin first opens the list.
  if (!row) return DEFAULT_LINKS.map((l) => ({ ...l, createdAt: "2026-10-16T00:00:00.000Z" }));
  const parsed = z.array(linkSchema).safeParse(row.value);
  return parsed.success ? parsed.data : [];
}

async function writeLinks(prisma: Db, links: CampaignLink[]) {
  await prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: links }, update: { value: links } });
}

export const slug = (label: string) => label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Counts a visit or registration for a known code; anything else is ignored. */
export async function countCampaign(prisma: Db, kind: "visit" | "signup", code: unknown): Promise<boolean> {
  if (typeof code !== "string" || !CODE.test(code)) return false;
  const links = await readLinks(prisma);
  if (!links.some((l) => l.code === code)) return false;
  countUsage(`ref_${kind}:${code}`);
  return true;
}

export function campaignPublicRouter(deps: { prisma: Db }) {
  const router = express.Router();
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => req.header("cf-connecting-ip") ?? req.ip ?? "unknown"
  });
  router.post("/public/ref", limiter, async (req, res, next) => {
    try { await countCampaign(deps.prisma, "visit", req.body?.code); res.status(204).end(); } catch (error) { next(error); }
  });
  return router;
}

/** Mounted inside the admin router (already admin-only). */
export function campaignAdminRoutes(router: express.Router, deps: { prisma: Db; now: () => Date }) {
  router.get("/admin/campaign-links", async (_req, res, next) => {
    try {
      const links = await readLinks(deps.prisma);
      const rows: Array<{ day: Date; kind: string; count: number }> = await deps.prisma.usageDaily.findMany({ where: { kind: { startsWith: "ref_" } } });
      const since30 = deps.now().getTime() - 30 * 24 * 60 * 60 * 1000;
      const today = usageDay(deps.now());
      const stats = (kind: string) => {
        const mine = rows.filter((r) => r.kind === kind);
        const pending = pendingUsageCount(kind, today);
        return { total: mine.reduce((s, r) => s + r.count, 0) + pending, last30: mine.filter((r) => new Date(r.day).getTime() >= since30).reduce((s, r) => s + r.count, 0) + pending };
      };
      res.json({ links: links.map((l) => ({ ...l, visits: stats(`ref_visit:${l.code}`), signups: stats(`ref_signup:${l.code}`) })) });
    } catch (error) { next(error); }
  });

  router.post("/admin/campaign-links", async (req, res, next) => {
    try {
      const input = z.object({ label: z.string().trim().min(1).max(80), code: z.string().trim().optional() }).parse(req.body);
      const code = input.code ? input.code.toLowerCase() : slug(input.label);
      if (!CODE.test(code)) return res.status(400).json({ error: "invalid_code" });
      const links = await readLinks(deps.prisma);
      if (links.some((l) => l.code === code)) return res.status(409).json({ error: "code_taken" });
      const link = { code, label: input.label, createdAt: deps.now().toISOString() };
      await writeLinks(deps.prisma, [...links, link]);
      res.status(201).json({ link });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "invalid_input" });
      next(error);
    }
  });

  router.delete("/admin/campaign-links/:code", async (req, res, next) => {
    try {
      const links = await readLinks(deps.prisma);
      const rest = links.filter((l) => l.code !== req.params.code);
      if (rest.length === links.length) return res.status(404).json({ error: "not_found" });
      await writeLinks(deps.prisma, rest);
      res.status(204).end();
    } catch (error) { next(error); }
  });
}
