import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { CheckCircle, DollarSign, FileText, MessageCircle, UserPlus, Users } from "lucide-react";
import { useGetAttivitaRecente, useGetDashboardStats, useGetEventiMese, useGetLeadPipeline } from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StatCardProps = {
  title: string;
  value?: number;
  icon: any;
  loading: boolean;
  formatter?: (value: number) => string;
};

function StatCard({ title, value, icon: Icon, loading, formatter }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value !== undefined ? formatter?.(value) ?? value : "-"}</div>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [dataDa, setDataDa] = useState("");
  const [dataA, setDataA] = useState("");
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const filters = {
    data_da: dataDa || undefined,
    data_a: dataA || undefined,
  };

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(filters);
  const { data: pipeline, isLoading: pipelineLoading } = useGetLeadPipeline(filters);
  const { data: eventiMese, isLoading: eventiMeseLoading } = useGetEventiMese(filters);
  const { data: attivita, isLoading: attivitaLoading } = useGetAttivitaRecente(filters);

  const handleExportReport = () => {
    const rows = [
      ["Report", "Valore"],
      ["Totale Contatti", String(stats?.totale_contatti ?? 0)],
      ["Nuovi Oggi", String(stats?.nuovi_oggi ?? 0)],
      ["Preventivi Attivi", String(stats?.preventivi_attivi ?? 0)],
      ["Eventi Confermati", String(stats?.eventi_confermati ?? 0)],
      ["Budget Totale", String(stats?.budget_totale_confermato ?? 0)],
      ["Messaggi Non Letti", String(stats?.messaggi_non_letti ?? 0)],
      ["Lead con Preventivo", String(stats?.lead_con_preventivo ?? 0)],
      ["Lead Confermati", String(stats?.lead_confermati ?? 0)],
      ["Conversione Lead -> Preventivo", formatPercentage(stats?.conversione_lead_preventivo ?? 0)],
      ["Conversione Preventivo -> Confermato", formatPercentage(stats?.conversione_preventivo_confermato ?? 0)],
      ["Conversione Lead -> Confermato", formatPercentage(stats?.conversione_lead_confermato ?? 0)],
      [""],
      ["Pipeline Lead", ""],
      ...(pipeline ?? []).map((item) => [item.stato, String(item.count)]),
      [""],
      ["Eventi per Mese", ""],
      ...(eventiMese ?? []).map((item) => [item.mese, String(item.count)]),
      [""],
      ["Attivita Recente", ""],
      ...(attivita ?? []).map((item) => [item.tipo, item.descrizione, item.timestamp]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const suffix = [dataDa || "inizio", dataA || "oggi"].join("_");
    anchor.href = url;
    anchor.download = `zak-dashboard-report_${suffix}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Panoramica delle performance e attivita recenti.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data da</label>
                <Input type="date" value={dataDa} onChange={(event) => setDataDa(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data a</label>
                <Input type="date" value={dataA} onChange={(event) => setDataA(event.target.value)} />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setDataDa("");
                  setDataA("");
                }}
                disabled={!dataDa && !dataA}
              >
                Azzera filtri
              </Button>
              <Button onClick={handleExportReport} disabled={statsLoading || pipelineLoading || eventiMeseLoading || attivitaLoading}>
                Esporta report CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Totale Contatti" value={stats?.totale_contatti} icon={Users} loading={statsLoading} />
          <StatCard title="Nuovi Oggi" value={stats?.nuovi_oggi} icon={UserPlus} loading={statsLoading} />
          <StatCard title="Preventivi Attivi" value={stats?.preventivi_attivi} icon={FileText} loading={statsLoading} />
          <StatCard title="Eventi Confermati" value={stats?.eventi_confermati} icon={CheckCircle} loading={statsLoading} />
          <StatCard title="Budget Totale" value={stats?.budget_totale_confermato} icon={DollarSign} loading={statsLoading} />
          <StatCard title="Messaggi Non Letti" value={stats?.messaggi_non_letti} icon={MessageCircle} loading={statsLoading} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Lead con Preventivo" value={stats?.lead_con_preventivo} icon={FileText} loading={statsLoading} />
          <StatCard title="Lead Confermati" value={stats?.lead_confermati} icon={CheckCircle} loading={statsLoading} />
          <StatCard
            title="Lead -> Preventivo"
            value={stats?.conversione_lead_preventivo}
            icon={Users}
            loading={statsLoading}
            formatter={formatPercentage}
          />
          <StatCard
            title="Preventivo -> Confermato"
            value={stats?.conversione_preventivo_confermato}
            icon={DollarSign}
            loading={statsLoading}
            formatter={formatPercentage}
          />
          <StatCard
            title="Lead -> Confermato"
            value={stats?.conversione_lead_confermato}
            icon={CheckCircle}
            loading={statsLoading}
            formatter={formatPercentage}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Lead</CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipeline}>
                      <XAxis dataKey="stato" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventi per Mese</CardTitle>
            </CardHeader>
            <CardContent>
              {eventiMeseLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eventiMese}>
                      <XAxis dataKey="mese" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attivita Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {attivitaLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
              </div>
            ) : attivita?.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">Nessuna attivita recente.</p>
            ) : (
              <div className="space-y-4">
                {attivita?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4 text-sm last:border-0 last:pb-0">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p>
                        <span className="font-semibold">{item.tipo}</span> - {item.descrizione}
                        {item.contatto_nome && <span className="text-muted-foreground"> ({item.contatto_nome})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: it })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
