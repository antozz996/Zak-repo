import { Router } from "express";
import { and, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { db, contattiCrmTable, eventCostSnapshotsTable, preventiviEventiTable } from "@workspace/db";
import { CreateEventCostSnapshotBody, GetMarginReportsQueryParams } from "@workspace/api-zod";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercentage(value: number) {
  return Math.round(value * 100) / 100;
}

function parseNumericValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value: string | Date) {
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

function normalizeSnapshot(row: typeof eventCostSnapshotsTable.$inferSelect) {
  return {
    ...row,
    event_type: row.event_type ?? null,
    food_cost_per_person: Number(row.food_cost_per_person),
    beverage_cost_per_person: Number(row.beverage_cost_per_person),
    fixed_extra_costs: Number(row.fixed_extra_costs),
    total_revenue: Number(row.total_revenue),
    calculated_margin_total: Number(row.calculated_margin_total),
    calculated_margin_percentage: Number(row.calculated_margin_percentage),
  };
}

router.post("/reports/snapshots", async (req, res) => {
  const parsed = CreateEventCostSnapshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: preventiviEventiTable.id,
        numero_invitati: preventiviEventiTable.numero_invitati,
        budget_stimato: preventiviEventiTable.budget_stimato,
        tipo_evento: contattiCrmTable.tipo_evento,
      })
      .from(preventiviEventiTable)
      .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
      .where(eq(preventiviEventiTable.id, parsed.data.event_id));

    if (!eventRow) {
      return { kind: "not_found" } as const;
    }

    const totalGuests = parsed.data.total_guests ?? eventRow.numero_invitati ?? null;
    const totalRevenue = parsed.data.total_revenue ?? parseNumericValue(eventRow.budget_stimato);

    if (!totalGuests || totalGuests <= 0 || totalRevenue === null) {
      return { kind: "missing_baseline" } as const;
    }

    const totalVariableCost = totalGuests * (parsed.data.food_cost_per_person + parsed.data.beverage_cost_per_person);
    const totalCost = roundCurrency(totalVariableCost + parsed.data.fixed_extra_costs);
    const calculatedMarginTotal = roundCurrency(totalRevenue - totalCost);
    const calculatedMarginPercentage = totalRevenue > 0
      ? roundPercentage((calculatedMarginTotal / totalRevenue) * 100)
      : 0;

    const [inserted] = await tx
      .insert(eventCostSnapshotsTable)
      .values({
        event_id: parsed.data.event_id,
        event_type: eventRow.tipo_evento ?? null,
        total_guests: totalGuests,
        food_cost_per_person: parsed.data.food_cost_per_person.toFixed(2),
        beverage_cost_per_person: parsed.data.beverage_cost_per_person.toFixed(2),
        fixed_extra_costs: parsed.data.fixed_extra_costs.toFixed(2),
        total_revenue: totalRevenue.toFixed(2),
        calculated_margin_total: calculatedMarginTotal.toFixed(2),
        calculated_margin_percentage: calculatedMarginPercentage.toFixed(2),
      })
      .returning();

    return { kind: "created", snapshot: normalizeSnapshot(inserted) } as const;
  });

  if (result.kind === "not_found") {
    res.status(404).json({ error: "Preventivo evento non trovato." });
    return;
  }

  if (result.kind === "missing_baseline") {
    res.status(400).json({ error: "Numero invitati o ricavo totale mancanti: completa il preventivo oppure invia i valori nel body." });
    return;
  }

  await logAuditAction({
    req,
    azione: "create",
    entita: "event_cost_snapshot",
    entitaId: result.snapshot.id,
    dettagli: {
      event_id: result.snapshot.event_id,
      total_revenue: result.snapshot.total_revenue,
      margin_total: result.snapshot.calculated_margin_total,
    },
  });

  res.status(201).json(result.snapshot);
});

router.get("/reports/margins", async (req, res) => {
  const parsed = GetMarginReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions: SQL[] = [];

  if (parsed.data.startDate) {
    conditions.push(gte(eventCostSnapshotsTable.snapshot_date, new Date(`${parsed.data.startDate}T00:00:00.000Z`)));
  }

  if (parsed.data.endDate) {
    const endDateExclusive = new Date(`${parsed.data.endDate}T00:00:00.000Z`);
    endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
    conditions.push(lt(eventCostSnapshotsTable.snapshot_date, endDateExclusive));
  }

  if (parsed.data.eventType) {
    conditions.push(eq(eventCostSnapshotsTable.event_type, parsed.data.eventType));
  }

  const monthStartExpr = sql<string>`DATE_TRUNC('month', ${eventCostSnapshotsTable.snapshot_date})::date`;

  const rows = await db
    .select({
      month_start: monthStartExpr,
      month_label: sql<string>`TO_CHAR(DATE_TRUNC('month', ${eventCostSnapshotsTable.snapshot_date}), 'YYYY-MM')`,
      event_type: eventCostSnapshotsTable.event_type,
      snapshot_count: sql<number>`COUNT(*)::int`,
      total_revenue: sql<string>`ROUND(COALESCE(SUM(${eventCostSnapshotsTable.total_revenue}::numeric), 0), 2)`,
      average_margin_total: sql<string>`ROUND(AVG(${eventCostSnapshotsTable.calculated_margin_total}::numeric), 2)`,
      average_margin_percentage: sql<string>`ROUND(AVG(${eventCostSnapshotsTable.calculated_margin_percentage}::numeric), 2)`,
      average_profit_per_person: sql<string>`ROUND(AVG(CASE WHEN ${eventCostSnapshotsTable.total_guests} > 0 THEN ${eventCostSnapshotsTable.calculated_margin_total}::numeric / ${eventCostSnapshotsTable.total_guests} ELSE 0 END), 2)`,
      average_food_cost_incidence: sql<string>`ROUND(AVG(CASE WHEN ${eventCostSnapshotsTable.total_revenue}::numeric > 0 THEN ((${eventCostSnapshotsTable.total_revenue}::numeric - ${eventCostSnapshotsTable.calculated_margin_total}::numeric) / ${eventCostSnapshotsTable.total_revenue}::numeric) * 100 ELSE 0 END), 2)`,
      average_total_guests: sql<string>`ROUND(AVG(${eventCostSnapshotsTable.total_guests}), 1)`,
    })
    .from(eventCostSnapshotsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(monthStartExpr, eventCostSnapshotsTable.event_type)
    .orderBy(monthStartExpr, eventCostSnapshotsTable.event_type);

  res.json(rows.map((row) => ({
    month_start: toIsoDate(row.month_start),
    month_label: row.month_label,
    event_type: row.event_type ?? null,
    snapshot_count: row.snapshot_count,
    total_revenue: Number(row.total_revenue),
    average_margin_total: Number(row.average_margin_total),
    average_margin_percentage: Number(row.average_margin_percentage),
    average_profit_per_person: Number(row.average_profit_per_person),
    average_food_cost_incidence: Number(row.average_food_cost_incidence),
    average_total_guests: Number(row.average_total_guests),
  })));
});

export default router;
