import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetEventDetailQueryKey,
  getListPreventiviQueryKey,
  type EventDetail,
  type EventPayment,
  type EventStaffAllocation,
  useCreateEventPayment,
  useCreateEventStaffAllocation,
  useDeleteEventPayment,
  useDeleteEventStaffAllocation,
  useGetEventDetail,
  useListUtenti,
  useUpdateEventPayment,
  useUpdateEventStaffAllocation,
  useUpdateEventStatus,
  useUpdatePreventivo,
} from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Euro, Save, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";

type EventStage = "draft" | "quoted" | "confirmed" | "in_production" | "closed";

const eventStageLabels: Record<string, string> = {
  draft: "Draft",
  quoted: "Quoted",
  confirmed: "Confirmed",
  in_production: "In Production",
  closed: "Closed",
};

const paymentTypeLabels: Record<string, string> = {
  acconto_1: "Acconto 1",
  acconto_2: "Acconto 2",
  saldo: "Saldo",
};

const paymentStatusClass: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-green-200 bg-green-50 text-green-800",
};

function formatCurrency(value?: number | null) {
  return typeof value === "number"
    ? value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })
    : "-";
}

function parseFloatValue(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id ?? "";
  const queryClient = useQueryClient();
  const { data: eventDetail, isLoading, isError, refetch } = useGetEventDetail(eventId);
  const { data: utenti } = useListUtenti();
  const updateEventStatus = useUpdateEventStatus();
  const updatePreventivo = useUpdatePreventivo();
  const createPayment = useCreateEventPayment();
  const updatePayment = useUpdateEventPayment();
  const deletePayment = useDeleteEventPayment();
  const createStaff = useCreateEventStaffAllocation();
  const updateStaff = useUpdateEventStaffAllocation();
  const deleteStaff = useDeleteEventStaffAllocation();

  const [eventStage, setEventStage] = useState<EventStage>("draft");
  const [menuForm, setMenuForm] = useState({
    menu_cibo: "",
    menu_bevande: "",
    note_allergie: "",
    note_logistica: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_type: "acconto_1",
    amount: "",
    due_date: "",
    status: "pending",
    payment_method: "",
  });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentForm, setEditingPaymentForm] = useState({
    payment_type: "acconto_1",
    amount: "",
    due_date: "",
    status: "pending",
    payment_method: "",
  });
  const [staffForm, setStaffForm] = useState({ user_id: "", role_allocated: "" });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffRole, setEditingStaffRole] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!eventDetail) return;
    setEventStage((eventDetail.event_stage as EventStage | undefined) ?? "draft");
    setMenuForm({
      menu_cibo: eventDetail.menu_cibo ?? "",
      menu_bevande: eventDetail.menu_bevande ?? "",
      note_allergie: eventDetail.note_allergie ?? "",
      note_logistica: eventDetail.note_logistica ?? "",
    });
  }, [eventDetail]);

  const invalidateEvent = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetEventDetailQueryKey(eventId) });
    await queryClient.invalidateQueries({ queryKey: getListPreventiviQueryKey() });
  };

  const orderedStaffUsers = useMemo(
    () => (utenti ?? []).filter((utente) => utente.stato === "attivo"),
    [utenti],
  );

  const handleSaveStatus = async () => {
    try {
      await updateEventStatus.mutateAsync({ id: eventId, data: { event_stage: eventStage } });
      setFeedback("Stato operativo aggiornato.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'aggiornamento dello stato operativo.");
    }
  };

  const handleSaveMenu = async () => {
    try {
      await updatePreventivo.mutateAsync({ id: eventId, data: menuForm });
      setFeedback("Menu e logistica salvati.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante il salvataggio di menu e logistica.");
    }
  };

  const handleCreatePayment = async () => {
    try {
      await createPayment.mutateAsync({
        id: eventId,
        data: {
          payment_type: paymentForm.payment_type as "acconto_1" | "acconto_2" | "saldo",
          amount: parseFloatValue(paymentForm.amount),
          due_date: paymentForm.due_date,
          status: paymentForm.status as "pending" | "paid",
          payment_method: paymentForm.payment_method || undefined,
        },
      });
      setPaymentForm({
        payment_type: "acconto_1",
        amount: "",
        due_date: "",
        status: "pending",
        payment_method: "",
      });
      setFeedback("Pagamento aggiunto.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante la creazione del pagamento.");
    }
  };

  const startEditPayment = (payment: EventPayment) => {
    setEditingPaymentId(payment.id);
    setEditingPaymentForm({
      payment_type: payment.payment_type,
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      status: payment.status,
      payment_method: payment.payment_method ?? "",
    });
  };

  const handleSavePayment = async (paymentId: string) => {
    try {
      await updatePayment.mutateAsync({
        id: eventId,
        paymentId,
        data: {
          payment_type: editingPaymentForm.payment_type as "acconto_1" | "acconto_2" | "saldo",
          amount: parseFloatValue(editingPaymentForm.amount),
          due_date: editingPaymentForm.due_date,
          status: editingPaymentForm.status as "pending" | "paid",
          payment_method: editingPaymentForm.payment_method || undefined,
        },
      });
      setEditingPaymentId(null);
      setFeedback("Pagamento aggiornato.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'aggiornamento del pagamento.");
    }
  };

  const handleMarkPaid = async (payment: EventPayment) => {
    try {
      await updatePayment.mutateAsync({
        id: eventId,
        paymentId: payment.id,
        data: {
          status: "paid",
          payment_method: payment.payment_method ?? undefined,
        },
      });
      setFeedback("Pagamento segnato come pagato.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'aggiornamento dello stato pagamento.");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Eliminare questa rata?")) return;
    try {
      await deletePayment.mutateAsync({ id: eventId, paymentId });
      setFeedback("Pagamento eliminato.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'eliminazione del pagamento.");
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.user_id || !staffForm.role_allocated.trim()) {
      setFeedback("Seleziona un membro staff e il ruolo assegnato.");
      return;
    }
    try {
      await createStaff.mutateAsync({
        id: eventId,
        data: {
          user_id: staffForm.user_id,
          role_allocated: staffForm.role_allocated.trim(),
        },
      });
      setStaffForm({ user_id: "", role_allocated: "" });
      setFeedback("Assegnazione staff creata.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'assegnazione del membro staff.");
    }
  };

  const startEditStaff = (allocation: EventStaffAllocation) => {
    setEditingStaffId(allocation.id);
    setEditingStaffRole(allocation.role_allocated);
  };

  const handleSaveStaff = async (allocationId: string) => {
    try {
      await updateStaff.mutateAsync({
        id: eventId,
        allocationId,
        data: {
          role_allocated: editingStaffRole.trim(),
        },
      });
      setEditingStaffId(null);
      setFeedback("Ruolo staff aggiornato.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante l'aggiornamento del ruolo staff.");
    }
  };

  const handleDeleteStaff = async (allocationId: string) => {
    if (!confirm("Rimuovere questa assegnazione staff?")) return;
    try {
      await deleteStaff.mutateAsync({ id: eventId, allocationId });
      setFeedback("Assegnazione rimossa.");
      await invalidateEvent();
    } catch {
      setFeedback("Errore durante la rimozione dell'assegnazione staff.");
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6 p-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-[480px] w-full" />
        </div>
      </SidebarLayout>
    );
  }

  if (isError || !eventDetail) {
    return (
      <SidebarLayout>
        <div className="space-y-4 p-8">
          <p className="text-lg font-semibold text-destructive">Evento non disponibile.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Riprova
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 -ml-3">
              <Link href="/preventivi">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna ai Preventivi
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Scheda Evento</h1>
            <p className="mt-1 text-muted-foreground">
              {eventDetail.contatto_nome ?? "Cliente"}{eventDetail.tipo_evento ? ` - ${eventDetail.tipo_evento}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{eventDetail.stato_evento}</Badge>
            <Badge>{eventStageLabels[eventDetail.event_stage ?? "draft"] ?? eventDetail.event_stage}</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Budget Totale</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrency(eventDetail.financial_summary.budget_totale)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Totale Pagato</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrency(eventDetail.financial_summary.totale_pagato)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo Residuo</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrency(eventDetail.financial_summary.saldo_residuo)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Prossima Scadenza</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">
              {eventDetail.financial_summary.prossima_scadenza
                ? format(new Date(eventDetail.financial_summary.prossima_scadenza), "d MMM yyyy", { locale: it })
                : "-"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Data Evento</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">
              {eventDetail.data_evento_richiesta
                ? format(new Date(eventDetail.data_evento_richiesta), "d MMM yyyy", { locale: it })
                : "Da definire"}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Stato operativo</Label>
                <Select value={eventStage} onValueChange={(value) => setEventStage(value as EventStage)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventStageLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  {eventDetail.contatto_nome ?? "-"}{eventDetail.contatto_telefono ? ` - ${eventDetail.contatto_telefono}` : ""}
                </div>
              </div>
            </div>
            <Button onClick={() => void handleSaveStatus()} disabled={updateEventStatus.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateEventStatus.isPending ? "Salvataggio..." : "Aggiorna stato"}
            </Button>
          </CardContent>
        </Card>

        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

        <Tabs defaultValue="economico" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="economico">Economico & Pagamenti</TabsTrigger>
            <TabsTrigger value="menu">Menu & Logistica</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="economico">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Aggiungi rata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo pagamento</Label>
                      <Select value={paymentForm.payment_type} onValueChange={(value) => setPaymentForm((current) => ({ ...current, payment_type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Importo</Label>
                      <Input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Scadenza</Label>
                      <Input type="date" value={paymentForm.due_date} onChange={(event) => setPaymentForm((current) => ({ ...current, due_date: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <Select value={paymentForm.status} onValueChange={(value) => setPaymentForm((current) => ({ ...current, status: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pagato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Metodo pagamento</Label>
                      <Input value={paymentForm.payment_method} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))} placeholder="bonifico, contanti, carta..." />
                    </div>
                  </div>
                  <Button onClick={() => void handleCreatePayment()} disabled={createPayment.isPending}>
                    <Euro className="mr-2 h-4 w-4" />
                    {createPayment.isPending ? "Salvataggio..." : "Aggiungi pagamento"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scadenziario evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventDetail.pagamenti.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Nessuna rata registrata.</p>
                  ) : (
                    eventDetail.pagamenti.map((payment) => (
                      <div key={payment.id} className="space-y-3 rounded-lg border p-4">
                        {editingPaymentId === payment.id ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Select value={editingPaymentForm.payment_type} onValueChange={(value) => setEditingPaymentForm((current) => ({ ...current, payment_type: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(paymentTypeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input type="number" min="0" step="0.01" value={editingPaymentForm.amount} onChange={(event) => setEditingPaymentForm((current) => ({ ...current, amount: event.target.value }))} />
                              <Input type="date" value={editingPaymentForm.due_date} onChange={(event) => setEditingPaymentForm((current) => ({ ...current, due_date: event.target.value }))} />
                              <Select value={editingPaymentForm.status} onValueChange={(value) => setEditingPaymentForm((current) => ({ ...current, status: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Pagato</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="sm:col-span-2">
                                <Input value={editingPaymentForm.payment_method} onChange={(event) => setEditingPaymentForm((current) => ({ ...current, payment_method: event.target.value }))} placeholder="Metodo pagamento" />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => void handleSavePayment(payment.id)} disabled={updatePayment.isPending}>Salva</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingPaymentId(null)}>Annulla</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">{paymentTypeLabels[payment.payment_type] ?? payment.payment_type}</p>
                                  <Badge variant="outline" className={paymentStatusClass[payment.status] ?? ""}>
                                    {payment.status === "paid" ? "Pagato" : "Pendente"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Scadenza: {format(new Date(payment.due_date), "d MMM yyyy", { locale: it })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Metodo: {payment.payment_method || "-"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
                                {payment.paid_at ? (
                                  <p className="text-xs text-muted-foreground">Pagato il {format(new Date(payment.paid_at), "d MMM yyyy, HH:mm", { locale: it })}</p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEditPayment(payment)}>Modifica</Button>
                              {payment.status !== "paid" ? (
                                <Button size="sm" variant="outline" onClick={() => void handleMarkPaid(payment)}>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Segna pagato
                                </Button>
                              ) : null}
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => void handleDeletePayment(payment.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <Card>
              <CardHeader>
                <CardTitle>Menu & Logistica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Menu cibo</Label>
                    <Textarea rows={6} value={menuForm.menu_cibo} onChange={(event) => setMenuForm((current) => ({ ...current, menu_cibo: event.target.value }))} placeholder="Buffet, portate, tavolo torta..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Menu bevande</Label>
                    <Textarea rows={6} value={menuForm.menu_bevande} onChange={(event) => setMenuForm((current) => ({ ...current, menu_bevande: event.target.value }))} placeholder="Open bar, vini, soft drink..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Note allergie</Label>
                    <Textarea rows={5} value={menuForm.note_allergie} onChange={(event) => setMenuForm((current) => ({ ...current, note_allergie: event.target.value }))} placeholder="Allergeni, intolleranze, richieste veg..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Note logistica</Label>
                    <Textarea rows={5} value={menuForm.note_logistica} onChange={(event) => setMenuForm((current) => ({ ...current, note_logistica: event.target.value }))} placeholder="Allestimenti, tempi servizio, arrivo staff..." />
                  </div>
                </div>
                <Button onClick={() => void handleSaveMenu()} disabled={updatePreventivo.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updatePreventivo.isPending ? "Salvataggio..." : "Salva menu e logistica"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Assegna membro staff</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Membro staff</Label>
                    <Select value={staffForm.user_id} onValueChange={(value) => setStaffForm((current) => ({ ...current, user_id: value }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona utente..." /></SelectTrigger>
                      <SelectContent>
                        {orderedStaffUsers.map((utente) => (
                          <SelectItem key={utente.id} value={utente.id}>
                            {utente.nome} - {utente.ruolo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ruolo assegnato</Label>
                    <Input value={staffForm.role_allocated} onChange={(event) => setStaffForm((current) => ({ ...current, role_allocated: event.target.value }))} placeholder="responsabile_sala, chef, cameriere..." />
                  </div>
                  <Button onClick={() => void handleCreateStaff()} disabled={createStaff.isPending}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {createStaff.isPending ? "Salvataggio..." : "Assegna staff"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team assegnato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventDetail.staff_allocato.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Nessun membro staff assegnato.</p>
                  ) : (
                    eventDetail.staff_allocato.map((allocation) => (
                      <div key={allocation.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{allocation.user_nome}</p>
                              <Badge variant="outline">{allocation.user_ruolo ?? "staff"}</Badge>
                            </div>
                            {editingStaffId === allocation.id ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Input value={editingStaffRole} onChange={(event) => setEditingStaffRole(event.target.value)} className="max-w-xs" />
                                <Button size="sm" onClick={() => void handleSaveStaff(allocation.id)} disabled={updateStaff.isPending}>Salva</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingStaffId(null)}>Annulla</Button>
                              </div>
                            ) : (
                              <p className="mt-1 text-sm text-muted-foreground">Ruolo operativo: {allocation.role_allocated}</p>
                            )}
                          </div>
                          {editingStaffId !== allocation.id ? (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEditStaff(allocation)}>
                                <Users className="mr-2 h-4 w-4" />
                                Modifica ruolo
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => void handleDeleteStaff(allocation.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Rimuovi
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
