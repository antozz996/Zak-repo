import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetDashboardStats, useGetLeadPipeline, useGetEventiMese, useGetAttivitaRecente } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, FileText, CheckCircle, DollarSign, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: pipeline, isLoading: pipelineLoading } = useGetLeadPipeline();
  const { data: eventiMese, isLoading: eventiMeseLoading } = useGetEventiMese();
  const { data: attivita, isLoading: attivitaLoading } = useGetAttivitaRecente();

  const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value !== undefined ? value : "-"}</div>}
      </CardContent>
    </Card>
  );

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Panoramica delle performance e attività recenti.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Totale Contatti" value={stats?.totale_contatti} icon={Users} loading={statsLoading} />
          <StatCard title="Nuovi Oggi" value={stats?.nuovi_oggi} icon={UserPlus} loading={statsLoading} />
          <StatCard title="Preventivi Attivi" value={stats?.preventivi_attivi} icon={FileText} loading={statsLoading} />
          <StatCard title="Eventi Confermati" value={stats?.eventi_confermati} icon={CheckCircle} loading={statsLoading} />
          <StatCard title="Budget Totale" value={stats?.budget_totale_confermato} icon={DollarSign} loading={statsLoading} />
          <StatCard title="Messaggi Non Letti" value={stats?.messaggi_non_letti} icon={MessageCircle} loading={statsLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Lead</CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineLoading ? (
                <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipeline}>
                      <XAxis dataKey="stato" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
                 <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eventiMese}>
                      <XAxis dataKey="mese" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {attivitaLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : attivita?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nessuna attività recente.</p>
            ) : (
              <div className="space-y-4">
                {attivita?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 text-sm border-b pb-4 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p>
                        <span className="font-semibold">{item.tipo}</span> - {item.descrizione}
                        {item.contatto_nome && <span className="text-muted-foreground"> ({item.contatto_nome})</span>}
                      </p>
                      <p className="text-muted-foreground text-xs">{format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: it })}</p>
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
