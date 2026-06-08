import { Router } from "express";
import { db, utentiTable } from "@workspace/db";
import { BootstrapAdminBody, LoginBody } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import {
  createAuthToken,
  hashPassword,
  requireAuth,
  toAuthUser,
  verifyPassword,
} from "../lib/auth";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(utentiTable)
    .where(eq(utentiTable.email, parsed.data.email.toLowerCase()));

  const isValid = user ? await verifyPassword(parsed.data.password, user.password_hash) : false;
  if (!user || !isValid || user.stato !== "attivo") {
    await logAuditAction({
      req,
      azione: "login_failed",
      entita: "auth",
      dettagli: { email: parsed.data.email },
    });
    res.status(401).json({ error: "Credenziali non valide" });
    return;
  }

  const authUser = toAuthUser(user);
  const session = createAuthToken(authUser, parsed.data.remember);
  await logAuditAction({
    req,
    azione: "login",
    entita: "utente",
    entitaId: user.id,
    dettagli: { email: user.email, ruolo: user.ruolo },
  });

  res.json({
    token: session.token,
    expires_at: session.expiresAt.toISOString(),
    utente: authUser,
  });
});

router.post("/auth/logout", async (req, res) => {
  await logAuditAction({
    req,
    azione: "logout",
    entita: "auth",
  });
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.authUser);
});

router.post("/auth/bootstrap-admin", async (req, res) => {
  const parsed = BootstrapAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(utentiTable);

  const bootstrapToken = process.env["ZAK_BOOTSTRAP_ADMIN_TOKEN"];
  const hasUsers = Number(count) > 0;
  if (hasUsers && (!bootstrapToken || parsed.data.bootstrap_token !== bootstrapToken)) {
    res.status(403).json({ error: "Bootstrap admin non consentito" });
    return;
  }

  const password_hash = await hashPassword(parsed.data.password);
  const [existingAdmin] = await db
    .select()
    .from(utentiTable)
    .where(eq(utentiTable.email, parsed.data.email.toLowerCase()));

  const [user] = existingAdmin
    ? await db
      .update(utentiTable)
      .set({
        nome: parsed.data.nome,
        ruolo: "admin",
        stato: "attivo",
        password_hash,
      })
      .where(eq(utentiTable.id, existingAdmin.id))
      .returning()
    : await db
      .insert(utentiTable)
      .values({
        nome: parsed.data.nome,
        email: parsed.data.email.toLowerCase(),
        ruolo: "admin",
        stato: "attivo",
        password_hash,
      })
      .returning();

  await logAuditAction({
    req,
    azione: "bootstrap_admin",
    entita: "utente",
    entitaId: user.id,
    dettagli: { email: user.email },
  });

  res.status(201).json(toAuthUser(user));
});

export default router;
