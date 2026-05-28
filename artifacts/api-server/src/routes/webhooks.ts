import { Router } from "express";
import { db, contattiCrmTable, messaggiTable, agendaPersonaleTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/webhook/whatsapp", async (req, res) => {
  try {
    const payload = req.body;
    const entries = payload.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];
        for (const msg of messages) {
          const phone = msg.from;
          const text = msg.text?.body || "[media]";

          let [contatto] = await db.select().from(contattiCrmTable).where(eq(contattiCrmTable.telefono, phone));
          if (!contatto) {
            const [newContatto] = await db.insert(contattiCrmTable).values({
              nome: change.value?.contacts?.[0]?.profile?.name || "Sconosciuto",
              telefono: phone,
              origine_lead: "whatsapp",
              stato_lead: "entrata",
            }).returning();
            contatto = newContatto;
          }

          await db.insert(messaggiTable).values({
            contatto_id: contatto.id,
            canale: "whatsapp",
            direzione: "inbound",
            testo: text,
            mittente_nome: contatto.nome,
          });

          await db.update(contattiCrmTable).set({ ultimo_contatto: new Date() }).where(eq(contattiCrmTable.id, contatto.id));
        }
      }
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing webhook" });
  }
});

router.post("/webhook/voice-assistant", async (req, res) => {
  try {
    const { trascrizione, telefono, durata } = req.body;

    const titolo = `Chiamata vocale${telefono ? ` da ${telefono}` : ""}`;
    const now = new Date();
    const fine = new Date(now.getTime() + (durata || 5) * 60 * 1000);

    await db.insert(agendaPersonaleTable).values({
      titolo,
      descrizione: `Trascrizione: ${trascrizione}`,
      data_ora_inizio: now,
      data_ora_fine: fine,
      categoria: "lavoro",
    });

    res.json({ success: true, message: "Chiamata registrata in agenda" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing voice webhook" });
  }
});

export default router;
