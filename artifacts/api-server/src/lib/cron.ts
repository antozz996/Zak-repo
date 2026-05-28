import cron from "node-cron";
import { logger } from "./logger";
import { runReengagement, runRicorrenze } from "../routes/automazioni";

export function startCronJobs() {
  // Ogni giorno alle 09:00 — controlla lead persi per re-engagement
  cron.schedule("0 9 * * *", async () => {
    logger.info("Cron: avvio job re-engagement lead persi");
    try {
      const result = await runReengagement();
      logger.info({ eseguiti: result.eseguiti }, "Cron: re-engagement completato");
    } catch (err) {
      logger.error({ err }, "Cron: errore nel job re-engagement");
    }
  });

  // Ogni giorno alle 10:00 — controlla ricorrenze annuali
  cron.schedule("0 10 * * *", async () => {
    logger.info("Cron: avvio job ricorrenze annuali");
    try {
      const result = await runRicorrenze();
      logger.info({ eseguiti: result.eseguiti }, "Cron: ricorrenze completate");
    } catch (err) {
      logger.error({ err }, "Cron: errore nel job ricorrenze");
    }
  });

  logger.info("Cron jobs avviati: re-engagement (09:00) e ricorrenze (10:00)");
}
