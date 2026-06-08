import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertCircle, Bot, FileText, MessageCircle, Phone, Send, User } from "lucide-react";
import { FaFacebookMessenger, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetChatInboxQueryKey,
  getGetContattoQueryKey,
  getListChatTypingQueryKey,
  getListMessaggiQueryKey,
  getListPreventiviQueryKey,
  getStreamChatEventsUrl,
  useAssignChat,
  useGetChatInbox,
  useGetContatto,
  useListChatTyping,
  useListMessaggi,
  useListPreventivi,
  useListUtenti,
  useMarkMessaggioRead,
  useSendMessaggio,
  useUpdateChatTyping,
} from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { getStoredAuthToken } from "@/lib/auth-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getChannelIcon = (canale: string) => {
  switch (canale) {
    case "whatsapp":
      return <FaWhatsapp className="h-5 w-5 text-green-500" />;
    case "instagram":
      return <FaInstagram className="h-5 w-5 text-pink-500" />;
    case "facebook":
      return <FaFacebookMessenger className="h-5 w-5 text-blue-500" />;
    case "voice":
      return <Phone className="h-5 w-5 text-sky-500" />;
    default:
      return <MessageCircle className="h-5 w-5 text-gray-500" />;
  }
};

export default function Inbox() {
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterLeadStatus, setFilterLeadStatus] = useState<string>("all");
  const [filterOperator, setFilterOperator] = useState<string>("all");

  const inboxFilters = useMemo(() => ({
    canale: filterChannel === "all" ? undefined : filterChannel,
    stato_lead: filterLeadStatus === "all" ? undefined : filterLeadStatus,
    operatore_id: filterOperator === "all" ? undefined : filterOperator,
  }), [filterChannel, filterLeadStatus, filterOperator]);

  const { data: inbox, isLoading: inboxLoading } = useGetChatInbox(inboxFilters);
  const inboxEntries = inbox ?? [];
  const { data: utenti } = useListUtenti();

  const messaggiParams = useMemo(() => ({
    contatto_id: selectedContactId || undefined,
    canale: selectedChannel || undefined,
  }), [selectedChannel, selectedContactId]);
  const typingParams = useMemo(() => ({
    contatto_id: selectedContactId || "",
    canale: selectedChannel || "",
  }), [selectedChannel, selectedContactId]);
  const preventiviParams = useMemo(() => ({ contatto_id: selectedContactId || undefined }), [selectedContactId]);

  const { data: contattoDettaglio } = useGetContatto(selectedContactId || "", {
    query: { queryKey: getGetContattoQueryKey(selectedContactId || ""), enabled: !!selectedContactId },
  });
  const { data: preventiviContatto } = useListPreventivi(preventiviParams, {
    query: { queryKey: getListPreventiviQueryKey(preventiviParams), enabled: !!selectedContactId },
  });
  const { data: messages, isLoading: messagesLoading } = useListMessaggi(messaggiParams, {
    query: {
      queryKey: getListMessaggiQueryKey(messaggiParams),
      enabled: !!selectedContactId && !!selectedChannel,
    },
  });
  const { data: typingOperators } = useListChatTyping(typingParams, {
    query: {
      queryKey: getListChatTypingQueryKey(typingParams),
      enabled: !!selectedContactId && !!selectedChannel,
    },
  });

  const sendMessage = useSendMessaggio();
  const assignChat = useAssignChat();
  const markMessaggioRead = useMarkMessaggioRead();
  const updateChatTyping = useUpdateChatTyping();

  const selectedEntry = inbox?.find((entry) => entry.contatto_id === selectedContactId && entry.canale === selectedChannel);
  const preventivoAttivo = preventiviContatto?.find((preventivo) => preventivo.stato_evento === "opzionato") ?? preventiviContatto?.[0];

  const leadStatuses = useMemo(() => {
    return Array.from(new Set(inboxEntries.map((entry) => entry.stato_lead))).filter(Boolean);
  }, [inboxEntries]);

  const unreadInboundIds = useMemo(() => {
    return (messages ?? [])
      .filter((message) => message.direzione === "inbound" && message.letto === false)
      .map((message) => message.id);
  }, [messages]);

  const visibleTypingOperators = useMemo(() => {
    return (typingOperators ?? []).filter((status) => status.is_typing && status.utente_id !== selectedOperatorId);
  }, [selectedOperatorId, typingOperators]);

  useEffect(() => {
    if (unreadInboundIds.length === 0 || markMessaggioRead.isPending) {
      return;
    }

    const markAllAsRead = async () => {
      await Promise.all(unreadInboundIds.map((id) => markMessaggioRead.mutateAsync({ id })));
      await queryClient.invalidateQueries({ queryKey: getListMessaggiQueryKey(messaggiParams) });
      await queryClient.invalidateQueries({ queryKey: getGetChatInboxQueryKey(inboxFilters) });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    };

    void markAllAsRead();
  }, [inboxFilters, markMessaggioRead, messaggiParams, queryClient, unreadInboundIds]);

  useEffect(() => {
    const token = getStoredAuthToken();
    const eventsUrl = token
      ? `${getStreamChatEventsUrl()}?token=${encodeURIComponent(token)}`
      : getStreamChatEventsUrl();
    const events = new EventSource(eventsUrl);

    const refreshInbox = () => {
      void queryClient.invalidateQueries({ queryKey: getGetChatInboxQueryKey(inboxFilters) });
      void queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      if (selectedContactId && selectedChannel) {
        void queryClient.invalidateQueries({ queryKey: getListMessaggiQueryKey(messaggiParams) });
        void queryClient.invalidateQueries({ queryKey: getListChatTypingQueryKey(typingParams) });
        void queryClient.invalidateQueries({ queryKey: getGetContattoQueryKey(selectedContactId) });
      }
    };

    events.addEventListener("message_created", refreshInbox);
    events.addEventListener("message_read", refreshInbox);
    events.addEventListener("chat_assigned", refreshInbox);
    events.addEventListener("presence_updated", refreshInbox);
    events.addEventListener("typing_updated", refreshInbox);

    return () => {
      events.removeEventListener("message_created", refreshInbox);
      events.removeEventListener("message_read", refreshInbox);
      events.removeEventListener("chat_assigned", refreshInbox);
      events.removeEventListener("presence_updated", refreshInbox);
      events.removeEventListener("typing_updated", refreshInbox);
      events.close();
    };
  }, [inboxFilters, messaggiParams, queryClient, selectedChannel, selectedContactId, typingParams]);

  useEffect(() => {
    if (!selectedContactId || !selectedChannel || selectedOperatorId === "unassigned") {
      return;
    }

    if (!messageText.trim()) {
      updateChatTyping.mutate({
        data: {
          contatto_id: selectedContactId,
          canale: selectedChannel,
          utente_id: selectedOperatorId,
          is_typing: false,
        },
      });
      return;
    }

    updateChatTyping.mutate({
      data: {
        contatto_id: selectedContactId,
        canale: selectedChannel,
        utente_id: selectedOperatorId,
        is_typing: true,
      },
    });

    const clearTyping = window.setTimeout(() => {
      updateChatTyping.mutate({
        data: {
          contatto_id: selectedContactId,
          canale: selectedChannel,
          utente_id: selectedOperatorId,
          is_typing: false,
        },
      });
    }, 4_500);

    return () => {
      window.clearTimeout(clearTyping);
    };
  }, [messageText, selectedChannel, selectedContactId, selectedOperatorId]);

  const handleSend = () => {
    if (!selectedContactId || !selectedChannel || !messageText.trim()) {
      return;
    }

    sendMessage.mutate(
      { data: { contatto_id: selectedContactId, canale: selectedChannel, testo: messageText } },
      {
        onSuccess: async () => {
          setMessageText("");
          await queryClient.invalidateQueries({ queryKey: getListMessaggiQueryKey({ contatto_id: selectedContactId, canale: selectedChannel }) });
          await queryClient.invalidateQueries({ queryKey: getGetChatInboxQueryKey(inboxFilters) });
        },
      },
    );
  };

  const handleSelectConversation = (contattoId: string, canale: string, operatoreId?: string | null) => {
    setSelectedContactId(contattoId);
    setSelectedChannel(canale);
    setSelectedOperatorId(operatoreId || "unassigned");
  };

  const handleAssignOperator = (operatoreId: string) => {
    setSelectedOperatorId(operatoreId);
    if (!selectedContactId) {
      return;
    }

    assignChat.mutate(
      { data: { contatto_id: selectedContactId, operatore_id: operatoreId === "unassigned" ? null : operatoreId } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetChatInboxQueryKey(inboxFilters) });
          await queryClient.invalidateQueries({ queryKey: getGetContattoQueryKey(selectedContactId) });
        },
      },
    );
  };

  const formatShortDate = (value?: string | null) => {
    if (!value) {
      return "Non definita";
    }

    return format(new Date(value), "d MMM yyyy");
  };

  return (
    <SidebarLayout>
      <div className="flex h-full">
        <div className="flex w-80 flex-col border-r border-border bg-card">
          <div className="space-y-4 border-b p-4">
            <div>
              <h2 className="text-lg font-semibold">Messaggi</h2>
              <p className="text-sm text-muted-foreground">Filtra la inbox per smistare le conversazioni.</p>
            </div>
            <div className="space-y-2">
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Canale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i canali</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="voice">Telefonate</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLeadStatus} onValueChange={setFilterLeadStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterOperator} onValueChange={setFilterOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Operatore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli operatori</SelectItem>
                  <SelectItem value="unassigned">Solo Zak AI</SelectItem>
                  {utenti?.map((utente) => (
                    <SelectItem key={utente.id} value={utente.id}>
                      {utente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {inboxLoading ? (
              <div className="p-4 text-center text-muted-foreground">Caricamento...</div>
            ) : inboxEntries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Nessun messaggio.</div>
            ) : (
              <div className="divide-y">
                {inboxEntries.map((entry) => (
                  <button
                    key={`${entry.contatto_id}-${entry.canale}`}
                    onClick={() => handleSelectConversation(entry.contatto_id, entry.canale, entry.operatore_assegnato_id)}
                    className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-accent ${
                      selectedContactId === entry.contatto_id && selectedChannel === entry.canale ? "bg-accent" : ""
                    }`}
                  >
                    <div className="mt-1">{getChannelIcon(entry.canale)}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">{entry.contatto_nome}</span>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">{format(new Date(entry.timestamp), "HH:mm")}</span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{entry.ultimo_messaggio}</p>
                      {entry.handoff_richiesto && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          <AlertCircle className="h-3 w-3" />
                          Richiede staff
                        </span>
                      )}
                    </div>
                    {entry.non_letti > 0 && (
                      <div className="flex h-5 w-5 flex-shrink-0 self-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        <span className="m-auto">{entry.non_letti}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex flex-1 flex-col bg-background">
          {selectedContactId ? (
            <>
              <div className="flex items-center justify-between border-b bg-card p-4">
                <div className="flex items-center gap-3">
                  {selectedChannel && getChannelIcon(selectedChannel)}
                  <div>
                    <h3 className="font-semibold">{selectedEntry?.contatto_nome}</h3>
                    <p className="text-xs text-muted-foreground">{selectedEntry?.telefono}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEntry?.handoff_richiesto ? (
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                      <AlertCircle className="h-3 w-3" />
                      Handoff richiesto
                    </Badge>
                  ) : !selectedEntry?.operatore_assegnato_nome && (
                    <Badge variant="secondary" className="gap-1">
                      <Bot className="h-3 w-3" />
                      Zak AI attivo
                    </Badge>
                  )}
                  <Badge variant="outline">{selectedEntry?.stato_lead}</Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground">Caricamento messaggi...</div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((message) => (
                      <div key={message.id} className={`flex ${message.direzione === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${message.direzione === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p className="text-sm">{message.testo}</p>
                          {message.media_id && (
                            <div className={`mt-2 flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${message.direzione === "outbound" ? "border-primary-foreground/20 text-primary-foreground/80" : "border-border text-muted-foreground"}`}>
                              <FileText className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {message.media_tipo || "media"}
                                {message.media_filename ? ` - ${message.media_filename}` : ""}
                                {message.media_mime_type ? ` (${message.media_mime_type})` : ""}
                              </span>
                            </div>
                          )}
                          <div className={`mt-1 text-right text-[10px] ${message.direzione === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {format(new Date(message.timestamp), "HH:mm")}
                            {message.direzione === "inbound" && message.letto === false ? " - da leggere" : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {visibleTypingOperators.length > 0 && (
                <div className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  {visibleTypingOperators.length === 1
                    ? `${visibleTypingOperators[0]?.utente_nome} sta scrivendo...`
                    : `${visibleTypingOperators.length} operatori stanno scrivendo...`}
                </div>
              )}

              <div className="flex gap-2 border-t bg-card p-4">
                <Input
                  placeholder="Scrivi un messaggio..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">Seleziona una conversazione per iniziare.</div>
          )}
        </div>

        {selectedContactId && selectedEntry && (
          <div className="flex w-72 flex-col gap-6 border-l bg-card p-4">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-center text-lg font-semibold">{selectedEntry.contatto_nome}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">TELEFONO</p>
                <p className="text-sm">{selectedEntry.telefono}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">CANALE PRINCIPALE</p>
                <p className="flex items-center gap-2 text-sm capitalize">
                  {getChannelIcon(selectedEntry.canale)} {selectedEntry.canale}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">STATO LEAD</p>
                <Badge>{selectedEntry.stato_lead}</Badge>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">TIPO EVENTO</p>
                <p className="text-sm capitalize">{contattoDettaglio?.tipo_evento || "Da definire"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">DATA RICHIESTA</p>
                <p className="text-sm">{formatShortDate(preventivoAttivo?.data_evento_richiesta)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">INVITATI</p>
                <p className="text-sm">{preventivoAttivo?.numero_invitati || "Da definire"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">OPERATORE</p>
                <p className="text-sm">{selectedEntry.operatore_assegnato_nome || "Nessuno"}</p>
              </div>
              {selectedEntry.handoff_richiesto && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Il cliente ha chiesto un operatore. Assegna la chat a un membro dello staff per chiudere la richiesta di handoff.
                </div>
              )}
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">ASSEGNA CONVERSAZIONE</p>
                <div className="space-y-2">
                  <Select value={selectedOperatorId} onValueChange={handleAssignOperator} disabled={assignChat.isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona operatore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Nessuna assegnazione</SelectItem>
                      {utenti?.map((utente) => (
                        <SelectItem key={utente.id} value={utente.id}>
                          {utente.nome} - {utente.ruolo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Quando una chat e assegnata, l'assistente automatico si ferma e lascia il controllo allo staff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
