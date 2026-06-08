import cron from "node-cron";
import { logger } from "./logger";
import { runPromemoriaAgenda, runReengagement, runRicorrenze } from "../routes/automazioni";

const runningJobs = new Set<string>();

async function runCronJob(name: string, action: () => Promise<{ eseguiti: number }>) {
  if (runningJobs.has(name)) {
    logger.warn({ job: name }, "Cron: job gia in esecuzione, salto questa iterazione");
    return null;
  }

  runningJobs.add(name);
  try {
    return await action();
  } finally {
    runningJobs.delete(name);
  }
}

export function startCronJobs() {
  // Ogni giorno alle 09:00 — controlla lead persi per re-engagement
  cron.schedule("0 9 * * *", async () => {
    logger.info("Cron: avvio job re-engagement lead persi");
    try {
      const result = await runCronJob("reengagement", runReengagement);
      if (!result) return;
      logger.info({ eseguiti: result.eseguiti }, "Cron: re-engagement completato");
    } catch (err) {
      logger.error({ err }, "Cron: errore nel job re-engagement");
    }
  });

  // Ogni giorno alle 10:00 — controlla ricorrenze annuali
  cron.schedule("0 10 * * *", async () => {
    logger.info("Cron: avvio job ricorrenze annuali");
    try {
      const result = await runCronJob("ricorrenza", runRicorrenze);
      if (!result) return;
      logger.info({ eseguiti: result.eseguiti }, "Cron: ricorrenze completate");
    } catch (err) {
      logger.error({ err }, "Cron: errore nel job ricorrenze");
    }
  });

  // Ogni 15 minuti — registra promemoria agenda imminenti nel log automazioni
  cron.schedule("*/15 * * * *", async () => {
    try {
      const result = await runCronJob("promemoria", runPromemoriaAgenda);
      if (!result) return;
      if (result.eseguiti > 0) {
        logger.info({ eseguiti: result.eseguiti }, "Cron: promemoria agenda registrati");
      }
    } catch (err) {
      logger.error({ err }, "Cron: errore nel job promemoria agenda");
    }
  });

  logger.info("Cron jobs avviati: re-engagement (09:00), ricorrenze (10:00), promemoria agenda (ogni 15 minuti)");
}
