import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Euro, Percent, TrendingUp, Users } from "lucide-react";
import {
  getGetMarginReportsQueryKey,
  useCreateEventCostSnapshot,
  useGetMarginReports,
  useListPreventivi,
} from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatCurrency(value: number) {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Euro;
  loading: boolean;
};

function StatCard({ title, value, subtitle, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [snapshotForm, setSnapshotForm] = useState({
    event_id: "",
    total_guests: "",
    total_revenue: "",
    food_cost_per_person: "18",
    beverage_cost_per_person: "5",
    fixed_extra_costs: "0",
  });
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    eventType: eventType.trim() || undefined,
  };

  const { data, isLoading, isError, refetch } = useGetMarginReports(filters);
  const { data: preventivi } = useListPreventivi();
  const createSnapshot = useCreateEventCostSnapshot();
  const rows = data ?? [];

  const summary = useMemo(() => {
    const totalSnapshots = rows.reduce((sum, row) => sum + row.snapshot_count, 0);
    const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0);
    const weighted = <T extends keyof (typeof rows)[number]>(key: T) => {
      if (totalSnapshots === 0) return 0;
      return rows.reduce((sum, row) => sum + Number(row[key]) * row.snapshot_count, 0) / totalSnapshots;
    };

    return {
      totalSnapshots,
      totalRevenue,
      averageMarginTotal: weighted("average_margin_total"),
      averageMarginPercentage: weighted("average_margin_percentage"),
      averageProfitPerPerson: weighted("average_profit_per_person"),
      averageFoodCostIncidence: weighted("average_food_cost_incidence"),
      averageGuests: weighted("average_total_guests"),
    };
  }, [rows]);

  const monthlyChartData = useMemo(() => {
    const grouped = new Map<string, {
      monthKey: string;
      label: string;
      snapshotCount: number;
      weightedMarginTotal: number;
      weightedProfitPerPerson: number;
      totalRevenue: number;
    }>();

    for (const row of rows) {
      const key = row.month_start;
      const existing = grouped.get(key) ?? {
        monthKey: key,
        label: format(new Date(`${row.month_start}T00:00:00`), "MMM yyyy", { locale: it }),
        snapshotCount: 0,
        weightedMarginTotal: 0,
        weightedProfitPerPerson: 0,
        totalRevenue: 0,
      };

      existing.snapshotCount += row.snapshot_count;
      existing.weightedMarginTotal += row.average_margin_total * row.snapshot_count;
      existing.weightedProfitPerPerson += row.average_profit_per_person * row.snapshot_count;
      existing.totalRevenue += row.total_revenue;
      grouped.set(key, existing);
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        mese: item.label,
        margine_medio: item.snapshotCount > 0 ? item.weightedMarginTotal / item.snapshotCount : 0,
        profitto_medio_persona: item.snapshotCount > 0 ? item.weightedProfitPerPerson / item.snapshotCount : 0,
        ricavi_totali: item.totalRevenue,
      }));
  }, [rows]);

  const eventTypeData = useMemo(() => {
    const grouped = new Map<string, {
      label: string;
      snapshotCount: number;
      totalRevenue: number;
      weightedMarginPercentage: number;
    }>();

    for (const row of rows) {
      const key = row.event_type ?? "non_definito";
      const existing = grouped.get(key) ?? {
        label: row.event_type ?? "Non definito",
        snapshotCount: 0,
        totalRevenue: 0,
        weightedMarginPercentage: 0,
      };
      existing.snapshotCount += row.snapshot_count;
      existing.totalRevenue += row.total_revenue;
      existing.weightedMarginPercentage += row.average_margin_percentage * row.snapshot_count;
      grouped.set(key, existing);
    }

    return Array.from(grouped.values())
      .map((item) => ({
        tipo: item.label,
        ricavi_totali: item.totalRevenue,
        margine_percentuale: item.snapshotCount > 0 ? item.weightedMarginPercentage / item.snapshotCount : 0,
      }))
      .sort((a, b) => b.ricavi_totali - a.ricavi_totali);
  }, [rows]);

  const saveSnapshot = async () => {
    if (!snapshotForm.event_id) {
      setSnapshotMessage("Seleziona prima un preventivo evento.");
      return;
    }

    const totalGuests = Number.parseInt(snapshotForm.total_guests, 10);
    const totalRevenue = Number.parseFloat(snapshotForm.total_revenue);
    const foodCostPerPerson = Number.parseFloat(snapshotForm.food_cost_per_person);
    const beverageCostPerPerson = Number.parseFloat(snapshotForm.beverage_cost_per_person);
    const fixedExtraCosts = Number.parseFloat(snapshotForm.fixed_extra_costs);

    if (!Number.isFinite(totalGuests) || totalGuests <= 0 || !Number.isFinite(totalRevenue) || totalRevenue < 0) {
      setSnapshotMessage("Completa invitati e ricavo totale prima di salvare lo snapshot.");
      return;
    }

    try {
      await createSnapshot.mutateAsync({
        data: {
          event_id: snapshotForm.event_id,
          total_guests: totalGuests,
          total_revenue: totalRevenue,
          food_cost_per_person: Number.isFinite(foodCostPerPerson) ? foodCostPerPerson : 0,
          beverage_cost_per_person: Number.isFinite(beverageCostPerPerson) ? beverageCostPerPerson : 0,
          fixed_extra_costs: Number.isFinite(fixedExtraCosts) ? fixedExtraCosts : 0,
        },
      });

      setSnapshotMessage("Snapshot economico salvato correttamente.");
      await queryClient.invalidateQueries({ queryKey: getGetMarginReportsQueryKey(filters) });
      await queryClient.invalidateQueries({ queryKey: getGetMarginReportsQueryKey() });
    } catch {
      setSnapshotMessage("Errore durante il salvataggio dello snapshot economico.");
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold">Report Marginalita</h1>
          <p className="mt-1 text-muted-foreground">
            Analisi storica di ricavi, margine lordo e profitto medio per persona dagli snapshot economici degli eventi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Filtri analisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dal</label>
                  <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Al</label>
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
                <div className="space-y-2 xl:min-w-[220px]">
                  <label className="text-sm font-medium">Tipologia evento</label>
                  <Input
                    placeholder="es. matrimonio"
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setEventType("");
                  }}
                  disabled={!startDate && !endDate && !eventType}
                >
                  Azzera filtri
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nuovo snapshot economico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preventivo evento</label>
                <Select
                  value={snapshotForm.event_id}
                  onValueChange={(value) => {
                    const selected = preventivi?.find((item) => item.id === value);
                    setSnapshotForm((current) => ({
                      ...current,
                      event_id: value,
                      total_guests: selected?.numero_invitati?.toString() ?? "",
                      total_revenue: selected?.budget_stimato?.toString() ?? "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona preventivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {preventivi?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {(item.contatto_nome ?? "Cliente")} - {item.data_evento_richiesta ?? "Data da definire"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invitati</label>
                  <Input
                    type="number"
                    min="1"
                    value={snapshotForm.total_guests}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, total_guests: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ricavo totale</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={snapshotForm.total_revenue}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, total_revenue: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Food cost persona</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={snapshotForm.food_cost_per_person}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, food_cost_per_person: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bevande persona</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={snapshotForm.beverage_cost_per_person}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, beverage_cost_per_person: event.target.value }))}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Extra fissi</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={snapshotForm.fixed_extra_costs}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, fixed_extra_costs: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Congela i numeri economici dell'evento per la reportistica storica.</p>
                <Button onClick={() => void saveSnapshot()} disabled={createSnapshot.isPending}>
                  {createSnapshot.isPending ? "Salvataggio..." : "Salva snapshot"}
                </Button>
              </div>
              {snapshotMessage ? <p className="text-xs text-muted-foreground">{snapshotMessage}</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Ricavi Totali"
            value={formatCurrency(summary.totalRevenue)}
            subtitle={`${summary.totalSnapshots} snapshot analizzati`}
            icon={Euro}
            loading={isLoading}
          />
          <StatCard
            title="Margine Medio Evento"
            value={formatCurrency(summary.averageMarginTotal)}
            subtitle="Media ponderata per snapshot"
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title="Margine Percentuale"
            value={formatPercentage(summary.averageMarginPercentage)}
            subtitle="Margine lordo medio"
            icon={Percent}
            loading={isLoading}
          />
          <StatCard
            title="Profitto Medio Persona"
            value={formatCurrency(summary.averageProfitPerPerson)}
            subtitle={`Media ospiti ${summary.averageGuests.toFixed(1) || "0.0"}`}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            title="Incidenza Food Cost"
            value={formatPercentage(summary.averageFoodCostIncidence)}
            subtitle="Media reale sui ricavi"
            icon={BarChart3}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Trend mensile margine e profitto persona</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[320px] items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : monthlyChartData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Nessuno snapshot disponibile nel periodo selezionato.</p>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mese" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          name === "ricavi_totali" ? formatCurrency(value) : formatCurrency(value),
                          name === "margine_medio" ? "Margine medio" : name === "profitto_medio_persona" ? "Profitto medio persona" : "Ricavi totali",
                        ]}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="margine_medio" name="margine_medio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="profitto_medio_persona" name="profitto_medio_persona" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marginalita per tipologia evento</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[320px] items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : eventTypeData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Nessuna tipologia disponibile.</p>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeData} layout="vertical" margin={{ left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="tipo" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          name === "ricavi_totali" ? formatCurrency(value) : formatPercentage(value),
                          name === "ricavi_totali" ? "Ricavi totali" : "Margine %",
                        ]}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Bar dataKey="margine_percentuale" name="margine_percentuale" fill="#0f766e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dettaglio aggregazioni</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-sm text-destructive">Errore durante il caricamento dei report.</p>
                <Button variant="outline" onClick={() => void refetch()}>
                  Riprova
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Crea i primi snapshot economici per vedere la reportistica storica.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Mese</th>
                      <th className="px-3 py-2 font-medium">Tipologia</th>
                      <th className="px-3 py-2 font-medium">Snapshot</th>
                      <th className="px-3 py-2 font-medium">Ricavi</th>
                      <th className="px-3 py-2 font-medium">Margine medio</th>
                      <th className="px-3 py-2 font-medium">Margine %</th>
                      <th className="px-3 py-2 font-medium">Profitto persona</th>
                      <th className="px-3 py-2 font-medium">Food cost %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.month_start}-${row.event_type ?? "all"}`} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {format(new Date(`${row.month_start}T00:00:00`), "MMMM yyyy", { locale: it })}
                        </td>
                        <td className="px-3 py-2 capitalize">{row.event_type ?? "Non definito"}</td>
                        <td className="px-3 py-2">{row.snapshot_count}</td>
                        <td className="px-3 py-2">{formatCurrency(row.total_revenue)}</td>
                        <td className="px-3 py-2">{formatCurrency(row.average_margin_total)}</td>
                        <td className="px-3 py-2">{formatPercentage(row.average_margin_percentage)}</td>
                        <td className="px-3 py-2">{formatCurrency(row.average_profit_per_person)}</td>
                        <td className="px-3 py-2">{formatPercentage(row.average_food_cost_incidence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
