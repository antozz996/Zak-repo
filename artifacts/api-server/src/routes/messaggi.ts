import { Router } from "express";
import { db, messaggiTable, contattiCrmTable, utentiTable, insertMessaggioSchema } from "@workspace/db";
import { ListChatTypingQueryParams, UpdateChatTypingBody } from "@workspace/api-zod";
import { eq, and, desc, isNull, sql, type SQL } from "drizzle-orm";
import { sendWhatsAppTextSafely } from "../lib/whatsapp";
import { logWhatsAppOutbound } from "../lib/whatsapp-outbound-log";
import { getWhatsAppConversationWindow } from "../lib/whatsapp-conversation-window";
import { logAuditAction } from "../lib/audit-log";
import { publishChatEvent, streamChatEvents } from "../lib/chat-events";
import { parseLimit, parseOffset } from "../lib/pagination";

const router = Router();
const presenceHeartbeats = new Map<string, Date>();
const PRESENCE_TTL_MS = 90_000;
const typingStatuses = new Map<string, {
  contatto_id: string;
  canale: string;
  utente_id: string;
  utente_nome: string;
  is_typing: boolean;
  updated_at: string;
  expires_at: string | null;
}>();
const TYPING_TTL_MS = 7_000;

function isPresenceOnline(lastHeartbeat: Date) {
  return Date.now() - lastHeartbeat.getTime() <= PRESENCE_TTL_MS;
}

function getTypingKey(contattoId: string, canale: string, utenteId: string) {
  return `${contattoId}:${canale}:${utenteId}`;
}

function pruneTypingStatuses() {
  const now = Date.now();
  for (const [key, status] of typingStatuses.entries()) {
    if (status.expires_at && new Date(status.expires_at).getTime() <= now) {
      typingStatuses.delete(key);
    }
  }
}

router.get("/messaggi", async (req, res) => {
  const {
    canale,
    contatto_id,
    stato_lead,
    operatore_id,
    letto,
    limit,
    offset,
  } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 100, 300);
  const off = parseOffset(offset);
  const conditions: SQL[] = [];
  if (canale) conditions.push(eq(messaggiTable.canale, canale));
  if (contatto_id) conditions.push(eq(messaggiTable.contatto_id, contatto_id));
  if (stato_lead) conditions.push(eq(contattiCrmTable.stato_lead, stato_lead));
  if (operatore_id === "unassigned") {
    conditions.push(isNull(contattiCrmTable.operatore_assegnato_id));
  } else if (operatore_id) {
    conditions.push(eq(contattiCrmTable.operatore_assegnato_id, operatore_id));
  }
  if (letto === "true" || letto === "false") {
    conditions.push(eq(messaggiTable.letto, letto === "true"));
  }

  const rows = await db
    .select()
    .from(messaggiTable)
    .innerJoin(contattiCrmTable, eq(contattiCrmTable.id, messaggiTable.contatto_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(messaggiTable.timestamp))
    .limit(lim)
    .offset(off);
  res.json(rows.map((row) => row.messaggi));
});

router.post("/messaggi", async (req, res) => {
  const parsed = insertMessaggioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [contatto] = await db
    .select()
    .from(contattiCrmTable)
    .where(eq(contattiCrmTable.id, parsed.data.contatto_id));

  if (parsed.data.canale === "whatsapp") {
    if (!contatto?.telefono) {
      res.status(400).json({ error: "Contatto senza telefono WhatsApp valido" });
      return;
    }

    const window = await getWhatsAppConversationWindow(parsed.data.contatto_id);
    if (!window.isOpen) {
      res.status(409).json({
        error: "Finestra conversazionale WhatsApp 24 ore chiusa. Usa un template approvato Meta.",
        last_inbound_at: window.lastInboundAt,
        expires_at: window.expiresAt,
      });
      return;
    }
  }

  const [row] = await db.insert(messaggiTable).values({
    ...parsed.data,
    direzione: "outbound",
    mittente_nome: "Staff",
  }).returning();

  await db.update(contattiCrmTable)
    .set({ ultimo_contatto: new Date() })
    .where(eq(contattiCrmTable.id, parsed.data.contatto_id));

  if (parsed.data.canale === "whatsapp" && contatto?.telefono) {
    const result = await sendWhatsAppTextSafely({
      to: contatto.telefono,
      text: parsed.data.testo,
    });
    await logWhatsAppOutbound({
      contattoId: contatto.id,
      telefono: contatto.telefono,
      sorgente: "messaggi_api",
      testo: parsed.data.testo,
      result,
    });
  }

  await logAuditAction({ req, azione: "send", entita: "messaggio", entitaId: row.id, dettagli: { contatto_id: row.contatto_id, canale: row.canale } });
  publishChatEvent("message_created", {
    messaggio_id: row.id,
    contatto_id: row.contatto_id,
    canale: row.canale,
    direzione: row.direzione,
  });
  res.status(201).json(row);
});

router.patch("/messaggi/:id/read", async (req, res) => {
  const [row] = await db
    .update(messaggiTable)
    .set({ letto: true })
    .where(eq(messaggiTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({ req, azione: "mark_read", entita: "messaggio", entitaId: row.id, dettagli: { contatto_id: row.contatto_id } });
  publishChatEvent("message_read", {
    messaggio_id: row.id,
    contatto_id: row.contatto_id,
    canale: row.canale,
  });
  res.json(row);
});

// Unified inbox: one entry per contact with last message
router.get("/chat/inbox", async (req, res) => {
  const { canale, stato_lead, operatore_id, limit, offset } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 80, 200);
  const off = parseOffset(offset);
  const inboxFilters = [
    canale ? sql`AND m.canale = ${canale}` : sql``,
    stato_lead ? sql`AND c.stato_lead = ${stato_lead}` : sql``,
    operatore_id === "unassigned"
      ? sql`AND c.operatore_assegnato_id IS NULL`
      : operatore_id
        ? sql`AND c.operatore_assegnato_id = ${operatore_id}`
        : sql``,
  ];

  const inbox = await db.execute(sql`
    SELECT
      c.id as contatto_id,
      c.nome as contatto_nome,
      c.telefono,
      c.stato_lead,
      c.handoff_richiesto,
      c.operatore_assegnato_id,
      u.nome as operatore_assegnato_nome,
      m.canale,
      m.testo as ultimo_messaggio,
      m.timestamp,
      COUNT(CASE WHEN m2.letto = false AND m2.direzione = 'inbound' THEN 1 END)::int as non_letti
    FROM contatti_crm c
    INNER JOIN LATERAL (
      SELECT * FROM messaggi WHERE contatto_id = c.id ORDER BY timestamp DESC LIMIT 1
    ) m ON true
    LEFT JOIN messaggi m2 ON m2.contatto_id = c.id
    LEFT JOIN utenti u ON u.id = c.operatore_assegnato_id
    WHERE 1 = 1
      ${inboxFilters[0]}
      ${inboxFilters[1]}
      ${inboxFilters[2]}
    GROUP BY c.id, c.nome, c.telefono, c.stato_lead, c.handoff_richiesto, c.operatore_assegnato_id, u.nome, m.canale, m.testo, m.timestamp
    ORDER BY m.timestamp DESC
    LIMIT ${lim}
    OFFSET ${off}
  `);
  res.json(inbox.rows);
});

router.post("/chat/assign", async (req, res) => {
  const { contatto_id, operatore_id } = req.body;
  if (!contatto_id) {
    res.status(400).json({ error: "contatto_id required" });
    return;
  }
  const [row] = await db
    .update(contattiCrmTable)
    .set({ operatore_assegnato_id: operatore_id || null, handoff_richiesto: false })
    .where(eq(contattiCrmTable.id, contatto_id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logAuditAction({ req, azione: operatore_id ? "assign" : "release", entita: "chat", entitaId: contatto_id, dettagli: { operatore_id: operatore_id || null } });

  if (!operatore_id) {
    publishChatEvent("chat_assigned", {
      contatto_id: contatto_id,
      operatore_id: null,
      operatore_nome: null,
    });
    res.json({ ...row, operatore_assegnato_nome: null });
    return;
  }

  const [operatore] = await db.select().from(utentiTable).where(eq(utentiTable.id, operatore_id));
  publishChatEvent("chat_assigned", {
    contatto_id: contatto_id,
    operatore_id: operatore_id,
    operatore_nome: operatore?.nome ?? null,
  });
  res.json({ ...row, operatore_assegnato_nome: operatore?.nome ?? null });
});

router.get("/chat/events", streamChatEvents);

router.get("/chat/typing", (req, res) => {
  const parsed = ListChatTypingQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  pruneTypingStatuses();
  res.json(Array.from(typingStatuses.values()).filter((status) => (
    status.contatto_id === parsed.data.contatto_id && status.canale === parsed.data.canale
  )));
});

router.post("/chat/typing", async (req, res) => {
  const parsed = UpdateChatTypingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [utente] = await db
    .select({
      id: utentiTable.id,
      nome: utentiTable.nome,
    })
    .from(utentiTable)
    .where(eq(utentiTable.id, parsed.data.utente_id));

  if (!utente) {
    res.status(404).json({ error: "Utente not found" });
    return;
  }

  const now = new Date();
  const status = {
    contatto_id: parsed.data.contatto_id,
    canale: parsed.data.canale,
    utente_id: utente.id,
    utente_nome: utente.nome,
    is_typing: parsed.data.is_typing,
    updated_at: now.toISOString(),
    expires_at: parsed.data.is_typing ? new Date(now.getTime() + TYPING_TTL_MS).toISOString() : null,
  };

  const key = getTypingKey(parsed.data.contatto_id, parsed.data.canale, utente.id);
  if (parsed.data.is_typing) {
    typingStatuses.set(key, status);
  } else {
    typingStatuses.delete(key);
  }

  publishChatEvent("typing_updated", status);
  res.json(status);
});

router.get("/chat/presence", async (_req, res) => {
  const utenti = await db
    .select({
      id: utentiTable.id,
      nome: utentiTable.nome,
      ruolo: utentiTable.ruolo,
    })
    .from(utentiTable);

  res.json(utenti.map((utente) => {
    const lastHeartbeat = presenceHeartbeats.get(utente.id) ?? new Date(0);
    return {
      utente_id: utente.id,
      nome: utente.nome,
      ruolo: utente.ruolo,
      online: isPresenceOnline(lastHeartbeat),
      ultimo_heartbeat: lastHeartbeat.toISOString(),
    };
  }));
});

router.post("/chat/presence/heartbeat", async (req, res) => {
  const utenteId = typeof req.body?.utente_id === "string" ? req.body.utente_id : "";
  if (!utenteId) {
    res.status(400).json({ error: "utente_id required" });
    return;
  }

  const [utente] = await db
    .select({
      id: utentiTable.id,
      nome: utentiTable.nome,
      ruolo: utentiTable.ruolo,
    })
    .from(utentiTable)
    .where(eq(utentiTable.id, utenteId));

  if (!utente) {
    res.status(404).json({ error: "Utente not found" });
    return;
  }

  const now = new Date();
  presenceHeartbeats.set(utente.id, now);
  publishChatEvent("presence_updated", {
    utente_id: utente.id,
    nome: utente.nome,
    ruolo: utente.ruolo,
    online: true,
    ultimo_heartbeat: now.toISOString(),
  });
  res.json({
    utente_id: utente.id,
    nome: utente.nome,
    ruolo: utente.ruolo,
    online: true,
    ultimo_heartbeat: now.toISOString(),
  });
});

export default router;
