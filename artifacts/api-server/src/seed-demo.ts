import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, utentiTable, contattiCrmTable, messaggiTable, preventiviEventiTable, agendaPersonaleTable, taskPersonaliTable } from "@workspace/db";
import { hashPassword } from "./lib/auth";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCsv(content: string): string[][] {
  const lines: string[][] = [];
  const rows = content.split(/\r?\n/);
  for (const row of rows) {
    if (!row.trim()) continue;
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    lines.push(cols);
  }
  return lines;
}

async function main() {
  const rootDir = path.resolve(__dirname, "../../..");
  console.log("🚀 Starting database seeding with demo data...");

  try {
    // 1. Clear existing data to avoid duplicates and ensure a clean testing state
    console.log("🧹 Clearing existing demo data...");
    await db.delete(taskPersonaliTable);
    await db.delete(agendaPersonaleTable);
    await db.delete(preventiviEventiTable);
    await db.delete(messaggiTable);
    await db.delete(contattiCrmTable);
    // Keep bootstrap admin in utentiTable, but delete other staff users
    await db.delete(utentiTable).where(eq(utentiTable.email, "alessandro.rossi@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "giuseppe.esposito@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "chiara.ferrari@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "roberto.martini@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "valeria.conte@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "marco.bianchi@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "giulia.romano@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "luca.moretti@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "francesca.ricci@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "stefano.bruno@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "elena.gallo@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "fabio.messina@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "davide.barbieri@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "alice.deluca@villazak.com"));
    await db.delete(utentiTable).where(eq(utentiTable.email, "silvia.fontana@villazak.com"));

    // 2. Seed utenti-staff
    console.log("👤 Seeding staff users...");
    const staffCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-utenti-staff.csv"), "utf-8");
    const staffLines = parseCsv(staffCsv);
    const defaultPwdHash = await hashPassword("VillaZak2026!");

    const staffMap = new Map<string, string>(); // nome -> id

    for (let i = 1; i < staffLines.length; i++) {
      const cols = staffLines[i];
      if (cols.length < 4) continue;
      const nome = cols[0];
      const email = cols[1];
      const ruolo = cols[2];
      const stato = cols[3];

      const [row] = await db.insert(utentiTable).values({
        nome,
        email,
        ruolo,
        stato,
        password_hash: defaultPwdHash,
      }).returning();
      staffMap.set(nome, row.id);
    }
    console.log(`✅ Seeded ${staffMap.size} staff users.`);

    // 3. Seed contatti_crm
    console.log("📞 Seeding CRM contacts...");
    const contattiCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-contatti.csv"), "utf-8");
    const contattiLines = parseCsv(contattiCsv);
    const contactMap = new Map<string, string>(); // nome -> id

    for (let i = 1; i < contattiLines.length; i++) {
      const cols = contattiLines[i];
      if (cols.length < 6) continue;
      const nome = cols[0];
      const telefono = cols[1] || "";
      if (!telefono) {
        console.warn(`⚠️ Warning: Contact missing phone number at line ${i + 1}, skipping.`);
        continue;
      }
      const instagram_username = cols[2] || null;
      const origine_lead = cols[3] || "whatsapp";
      const tipo_evento = cols[4] || null;
      const stato_lead = cols[5] || "nuovo";
      const note_interna = cols[6] || null;

      // Assign a staff operator randomly or leave unassigned
      const operators = Array.from(staffMap.values());
      const operatore_assegnato_id = i % 3 === 0 ? operators[i % operators.length] : null;

      const [row] = await db.insert(contattiCrmTable).values({
        nome,
        telefono,
        instagram_username,
        origine_lead,
        tipo_evento,
        stato_lead,
        note_interna,
        operatore_assegnato_id,
        handoff_richiesto: stato_lead === "perso",
      }).returning();
      contactMap.set(nome, row.id);
    }
    console.log(`✅ Seeded ${contactMap.size} CRM contacts.`);

    // 4. Seed messaggi
    console.log("💬 Seeding chat messages...");
    const messaggiCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-messaggi.csv"), "utf-8");
    const messaggiLines = parseCsv(messaggiCsv);
    let messagesCount = 0;

    for (let i = 1; i < messaggiLines.length; i++) {
      const cols = messaggiLines[i];
      if (cols.length < 5) continue;
      const contatto_nome = cols[0];
      const timestamp = new Date(cols[1]);
      const mittente = cols[2];
      const canale = cols[3];
      const contenuto = cols[4];
      const letto = cols[5] === "letto";

      const contatto_id = contactMap.get(contatto_nome);
      if (!contatto_id) {
        console.warn(`⚠️ Warning: Contact not found for message: ${contatto_nome}`);
        continue;
      }

      await db.insert(messaggiTable).values({
        contatto_id,
        canale,
        direzione: mittente === "cliente" ? "inbound" : "outbound",
        testo: contenuto,
        timestamp,
        letto,
        mittente_nome: mittente === "cliente" ? contatto_nome : mittente === "ai" ? "Zak AI" : "Staff",
      });
      messagesCount++;
    }
    console.log(`✅ Seeded ${messagesCount} messages.`);

    // 5. Seed preventivi
    console.log("📄 Seeding preventivi events...");
    const prevCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-preventivi.csv"), "utf-8");
    const prevLines = parseCsv(prevCsv);
    let prevCount = 0;

    for (let i = 1; i < prevLines.length; i++) {
      const cols = prevLines[i];
      if (cols.length < 5) continue;
      const titolo = cols[0];
      const importo = cols[1];
      const stato = cols[2];
      const data_creazione = new Date(cols[3]);
      const contatto_nome = cols[4];
      const note = cols[5] || null;

      const contatto_id = contactMap.get(contatto_nome);
      if (!contatto_id) continue;

      // Deduce number of guests and request date if possible
      let guests = 50;
      if (note?.includes("100 pax") || titolo.includes("100 pax")) guests = 100;
      else if (note?.includes("60 persone")) guests = 60;
      else if (note?.includes("80 invitati")) guests = 80;
      else if (note?.includes("40 persone")) guests = 40;
      else if (note?.includes("15 persone")) guests = 15;

      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + 30 + i); // Future dates

      await db.insert(preventiviEventiTable).values({
        contatto_id,
        data_evento_richiesta: requestDate.toISOString().split("T")[0],
        numero_invitati: guests,
        budget_stimato: importo,
        note,
        stato_evento: stato,
        data_creazione,
      });
      prevCount++;
    }
    console.log(`✅ Seeded ${prevCount} preventivi.`);

    // 6. Seed agenda_personale
    console.log("📅 Seeding agenda items...");
    const agendaCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-agenda.csv"), "utf-8");
    const agendaLines = parseCsv(agendaCsv);
    let agendaCount = 0;

    for (let i = 1; i < agendaLines.length; i++) {
      const cols = agendaLines[i];
      if (cols.length < 5) continue;
      const titolo = cols[0];
      const descrizione = cols[1] || null;
      const categoria = cols[2] || "lavoro";
      const inizio = new Date(cols[3]);
      const fine = new Date(cols[4]);
      const contatto_nome = cols[5] || null;

      const contatto_id = contatto_nome ? contactMap.get(contatto_nome) : null;

      await db.insert(agendaPersonaleTable).values({
        titolo,
        descrizione,
        categoria,
        data_ora_inizio: inizio,
        data_ora_fine: fine,
        contatto_id,
      });
      agendaCount++;
    }
    console.log(`✅ Seeded ${agendaCount} agenda items.`);

    // 7. Seed task_personali
    console.log("📋 Seeding task board items...");
    const taskCsv = fs.readFileSync(path.resolve(rootDir, "attached_assets/demo-task-personali.csv"), "utf-8");
    const taskLines = parseCsv(taskCsv);
    let taskCount = 0;

    for (let i = 1; i < taskLines.length; i++) {
      const cols = taskLines[i];
      if (cols.length < 5) continue;
      const titolo = cols[0];
      const descrizione = cols[1] || null;
      const stato = cols[2] || "aperto";
      const priorita = cols[3] || "media";
      const fonte = cols[4] || "manuale";
      const scadenza = cols[5] ? new Date(cols[5]) : null;
      const contatto_nome = cols[6] || null;

      const contatto_id = contatto_nome ? contactMap.get(contatto_nome) : null;

      await db.insert(taskPersonaliTable).values({
        titolo,
        descrizione,
        stato,
        priorita,
        fonte,
        scadenza,
        contatto_id,
        completato_il: stato === "completato" ? new Date() : null,
      });
      taskCount++;
    }
    console.log(`✅ Seeded ${taskCount} task items.`);

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

main();
