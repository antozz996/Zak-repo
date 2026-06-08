import { db, statoLeadStoricoTable } from "@workspace/db";

export async function logLeadStatusChange(input: {
  contattoId: string;
  previousStatus: string | null | undefined;
  nextStatus: string | null | undefined;
  origine: string;
  nota?: string | null;
}) {
  if (!input.nextStatus || input.previousStatus === input.nextStatus) {
    return;
  }

  await db.insert(statoLeadStoricoTable).values({
    contatto_id: input.contattoId,
    stato_precedente: input.previousStatus ?? null,
    stato_successivo: input.nextStatus,
    origine: input.origine,
    nota: input.nota ?? null,
  });
}
