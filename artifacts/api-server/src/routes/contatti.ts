import { Router, type Response } from "express";
import { db, contattiCrmTable, messaggiTable, statoLeadStoricoTable, insertContattoSchema, updateContattoSchema, utentiTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { logLeadStatusChange } from "../lib/lead-status-history";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index++;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function normalizePhoneForDedupe(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

function normalizeInstagramUsername(username?: string | null) {
  const normalized = (username ?? "").trim().replace(/^@+/, "").toLowerCase();
  return normalized || undefined;
}

type DuplicateMatch = {
  field: "telefono" | "instagram_username";
  contattoId: string;
};

function findDuplicateInContacts(
  contacts: Array<{ id: string; telefono: string; instagram_username: string | null }>,
  input: { telefono?: string | null; instagram_username?: string | null },
  excludeId?: string,
): DuplicateMatch | null {
  const phone = normalizePhoneForDedupe(input.telefono);
  const instagram = normalizeInstagramUsername(input.instagram_username);

  for (const contact of contacts) {
    if (contact.id === excludeId) continue;
    if (phone && normalizePhoneForDedupe(contact.telefono) === phone) {
      return { field: "telefono", contattoId: contact.id };
    }
    if (instagram && normalizeInstagramUsername(contact.instagram_username) === instagram) {
      return { field: "instagram_username", contattoId: contact.id };
    }
  }

  return null;
}

async function findDuplicateContact(
  input: { telefono?: string | null; instagram_username?: string | null },
  excludeId?: string,
) {
  const contacts = await db
    .select({
      id: contattiCrmTable.id,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
    })
    .from(contattiCrmTable);

  return findDuplicateInContacts(contacts, input, excludeId);
}

function sendDuplicateResponse(res: Response, duplicate: DuplicateMatch) {
  res.status(409).json({
    error: "Contatto duplicato",
    duplicate_field: duplicate.field,
    duplicate_contatto_id: duplicate.contattoId,
  });
}

router.get("/contatti", async (req, res) => {
  const { stato_lead, tipo_evento, origine_lead, search } = req.query as Record<string, string>;

  const conditions = [];
  if (stato_lead) conditions.push(eq(contattiCrmTable.stato_lead, stato_lead));
  if (tipo_evento) conditions.push(eq(contattiCrmTable.tipo_evento, tipo_evento));
  if (origine_lead) conditions.push(eq(contattiCrmTable.origine_lead, origine_lead));
  if (search) conditions.push(or(ilike(contattiCrmTable.nome, `%${search}%`), ilike(contattiCrmTable.telefono, `%${search}%`)));

  const contatti = await db
    .select({
      id: contattiCrmTable.id,
      nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
      origine_lead: contattiCrmTable.origine_lead,
      tipo_evento: contattiCrmTable.tipo_evento,
      note_interna: contattiCrmTable.note_interna,
      stato_lead: contattiCrmTable.stato_lead,
      handoff_richiesto: contattiCrmTable.handoff_richiesto,
      data_creazione: contattiCrmTable.data_creazione,
      ultimo_contatto: contattiCrmTable.ultimo_contatto,
      operatore_assegnato_id: contattiCrmTable.operatore_assegnato_id,
      operatore_assegnato_nome: utentiTable.nome,
    })
    .from(contattiCrmTable)
    .leftJoin(utentiTable, eq(contattiCrmTable.operatore_assegnato_id, utentiTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contattiCrmTable.data_creazione));

  res.json(contatti);
});

router.post("/contatti", async (req, res) => {
  const parsed = insertContattoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    telefono: normalizePhone(parsed.data.telefono),
    instagram_username: normalizeInstagramUsername(parsed.data.instagram_username),
  };
  if (!normalizePhoneForDedupe(data.telefono)) {
    res.status(400).json({ error: "Telefono obbligatorio" });
    return;
  }
  const duplicate = await findDuplicateContact(data);
  if (duplicate) {
    sendDuplicateResponse(res, duplicate);
    return;
  }
  const [row] = await db.insert(contattiCrmTable).values(data).returning();
  await logLeadStatusChange({
    contattoId: row.id,
    previousStatus: null,
    nextStatus: row.stato_lead,
    origine: "contatti_api",
    nota: "Creazione contatto CRM",
  });
  await logAuditAction({ req, azione: "create", entita: "contatto", entitaId: row.id, dettagli: { origine_lead: row.origine_lead, stato_lead: row.stato_lead } });
  res.status(201).json({ ...row, operatore_assegnato_nome: null });
});

router.post("/contatti/import-csv", async (req, res) => {
  const csv = typeof req.body?.csv === "string" ? req.body.csv : "";
  if (!csv.trim()) {
    res.status(400).json({ error: "csv required" });
    return;
  }

  const lines = csv.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "").map((header) => header.trim().toLowerCase());
  const missing = ["nome", "telefono"].filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    res.status(400).json({ error: `Colonne obbligatorie mancanti: ${missing.join(", ")}` });
    return;
  }

  let creati = 0;
  let saltati = 0;
  const errori: Array<{ riga: number; motivo: string }> = [];
  const existingContacts = await db
    .select({
      id: contattiCrmTable.id,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
    })
    .from(contattiCrmTable);

  for (let index = 1; index < lines.length; index++) {
    const values = parseCsvLine(lines[index] ?? "");
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]?.trim() ?? ""]));
    const telefono = normalizePhone(record.telefono ?? "");
    const instagramUsername = normalizeInstagramUsername(record.instagram_username);

    if (!record.nome || !telefono) {
      errori.push({ riga: index + 1, motivo: "Nome o telefono mancante" });
      continue;
    }

    const duplicate = findDuplicateInContacts(existingContacts, { telefono, instagram_username: instagramUsername });
    if (duplicate) {
      saltati++;
      continue;
    }

    const parsed = insertContattoSchema.safeParse({
      nome: record.nome,
      telefono,
      instagram_username: instagramUsername,
      origine_lead: record.origine_lead || "manuale",
      tipo_evento: record.tipo_evento || undefined,
      stato_lead: record.stato_lead || "entrata",
      note_interna: record.note_interna || undefined,
    });

    if (!parsed.success) {
      errori.push({ riga: index + 1, motivo: parsed.error.message });
      continue;
    }

    const [row] = await db.insert(contattiCrmTable).values(parsed.data).returning();
    await logLeadStatusChange({
      contattoId: row.id,
      previousStatus: null,
      nextStatus: row.stato_lead,
      origine: "import_csv",
      nota: "Importazione CSV contatti",
    });
    creati++;
    existingContacts.push({ id: row.id, telefono: row.telefono, instagram_username: row.instagram_username });
  }

  await logAuditAction({ req, azione: "import_csv", entita: "contatto", dettagli: { totale_righe: Math.max(lines.length - 1, 0), creati, saltati, errori: errori.length } });
  res.json({ totale_righe: Math.max(lines.length - 1, 0), creati, saltati, errori });
});

router.get("/contatti/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: contattiCrmTable.id,
      nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
      origine_lead: contattiCrmTable.origine_lead,
      tipo_evento: contattiCrmTable.tipo_evento,
      note_interna: contattiCrmTable.note_interna,
      stato_lead: contattiCrmTable.stato_lead,
      handoff_richiesto: contattiCrmTable.handoff_richiesto,
      data_creazione: contattiCrmTable.data_creazione,
      ultimo_contatto: contattiCrmTable.ultimo_contatto,
      operatore_assegnato_id: contattiCrmTable.operatore_assegnato_id,
      operatore_assegnato_nome: utentiTable.nome,
    })
    .from(contattiCrmTable)
    .leftJoin(utentiTable, eq(contattiCrmTable.operatore_assegnato_id, utentiTable.id))
    .where(eq(contattiCrmTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/contatti/:id", async (req, res) => {
  const parsed = updateContattoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(contattiCrmTable).where(eq(contattiCrmTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const data = {
    ...parsed.data,
    ...(parsed.data.telefono !== undefined ? { telefono: normalizePhone(parsed.data.telefono) } : {}),
    ...(parsed.data.instagram_username !== undefined
      ? { instagram_username: normalizeInstagramUsername(parsed.data.instagram_username) ?? null }
      : {}),
  };
  if (data.telefono !== undefined && !normalizePhoneForDedupe(data.telefono)) {
    res.status(400).json({ error: "Telefono obbligatorio" });
    return;
  }
  const duplicate = await findDuplicateContact(
    {
      telefono: data.telefono !== undefined ? data.telefono : existing.telefono,
      instagram_username: data.instagram_username !== undefined ? data.instagram_username : existing.instagram_username,
    },
    req.params.id,
  );
  if (duplicate) {
    sendDuplicateResponse(res, duplicate);
    return;
  }
  const [row] = await db.update(contattiCrmTable).set(data).where(eq(contattiCrmTable.id, req.params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logLeadStatusChange({
    contattoId: row.id,
    previousStatus: existing.stato_lead,
    nextStatus: row.stato_lead,
    origine: "contatti_api",
    nota: "Aggiornamento manuale contatto",
  });
  await logAuditAction({ req, azione: "update", entita: "contatto", entitaId: row.id, dettagli: parsed.data });
  res.json({ ...row, operatore_assegnato_nome: null });
});

router.delete("/contatti/:id", async (req, res) => {
  await db.delete(contattiCrmTable).where(eq(contattiCrmTable.id, req.params.id));
  await logAuditAction({ req, azione: "delete", entita: "contatto", entitaId: req.params.id });
  res.status(204).send();
});

router.get("/contatti/:id/messaggi", async (req, res) => {
  const rows = await db
    .select()
    .from(messaggiTable)
    .where(eq(messaggiTable.contatto_id, req.params.id))
    .orderBy(messaggiTable.timestamp);
  res.json(rows);
});

router.get("/contatti/:id/storico-stato", async (req, res) => {
  const rows = await db
    .select()
    .from(statoLeadStoricoTable)
    .where(eq(statoLeadStoricoTable.contatto_id, req.params.id))
    .orderBy(desc(statoLeadStoricoTable.data_cambio));
  res.json(rows);
});

export default router;
