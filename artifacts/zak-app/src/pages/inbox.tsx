import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetChatInbox, useListMessaggi, useSendMessaggio, getListMessaggiQueryKey, useAssignChat } from "@workspace/api-client-react";
import { FaWhatsapp, FaInstagram, FaFacebookMessenger } from "react-icons/fa";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { Send, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getChannelIcon = (canale: string) => {
  switch (canale) {
    case 'whatsapp': return <FaWhatsapp className="text-green-500 w-5 h-5" />;
    case 'instagram': return <FaInstagram className="text-pink-500 w-5 h-5" />;
    case 'facebook': return <FaFacebookMessenger className="text-blue-500 w-5 h-5" />;
    default: return <MessageCircle className="text-gray-500 w-5 h-5" />;
  }
};

import { MessageCircle } from "lucide-react";

export default function Inbox() {
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: inbox, isLoading: inboxLoading } = useGetChatInbox();
  
  const { data: messages, isLoading: messagesLoading } = useListMessaggi(
    { contatto_id: selectedContactId || undefined, canale: selectedChannel || undefined },
    { query: { enabled: !!selectedContactId && !!selectedChannel, refetchInterval: 5000 } }
  );

  const sendMessage = useSendMessaggio();

  const handleSend = () => {
    if (!selectedContactId || !selectedChannel || !messageText.trim()) return;
    sendMessage.mutate(
      { data: { contatto_id: selectedContactId, canale: selectedChannel, testo: messageText } },
      {
        onSuccess: () => {
          setMessageText("");
          queryClient.invalidateQueries({ queryKey: getListMessaggiQueryKey({ contatto_id: selectedContactId, canale: selectedChannel }) });
        }
      }
    );
  };

  const selectedEntry = inbox?.find(e => e.contatto_id === selectedContactId && e.canale === selectedChannel);

  return (
    <SidebarLayout>
      <div className="flex h-full">
        {/* Inbox List */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Messaggi</h2>
          </div>
          <ScrollArea className="flex-1">
            {inboxLoading ? (
              <div className="p-4 text-center text-muted-foreground">Caricamento...</div>
            ) : inbox?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Nessun messaggio.</div>
            ) : (
              <div className="divide-y">
                {inbox?.map((entry) => (
                  <button
                    key={`${entry.contatto_id}-${entry.canale}`}
                    onClick={() => {
                      setSelectedContactId(entry.contatto_id);
                      setSelectedChannel(entry.canale);
                    }}
                    className={`w-full text-left p-4 hover:bg-accent transition-colors flex gap-3 ${selectedContactId === entry.contatto_id && selectedChannel === entry.canale ? 'bg-accent' : ''}`}
                  >
                    <div className="mt-1">
                      {getChannelIcon(entry.canale)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium truncate pr-2">{entry.contatto_nome}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(entry.timestamp), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{entry.ultimo_messaggio}</p>
                    </div>
                    {entry.non_letti > 0 && (
                      <div className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 self-center">
                        {entry.non_letti}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedContactId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {selectedChannel && getChannelIcon(selectedChannel)}
                  <div>
                    <h3 className="font-semibold">{selectedEntry?.contatto_nome}</h3>
                    <p className="text-xs text-muted-foreground">{selectedEntry?.telefono}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline">{selectedEntry?.stato_lead}</Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground">Caricamento messaggi...</div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.direzione === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.direzione === 'outbound' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.testo}</p>
                          <div className={`text-[10px] mt-1 text-right ${msg.direzione === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-card flex gap-2">
                <Input 
                  placeholder="Scrivi un messaggio..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Seleziona una conversazione per iniziare.
            </div>
          )}
        </div>

        {/* Contact Details Sidebar (if selected) */}
        {selectedContactId && selectedEntry && (
          <div className="w-72 border-l bg-card p-4 flex flex-col gap-6">
            <div>
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
               </div>
               <h3 className="text-center font-semibold text-lg">{selectedEntry.contatto_nome}</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TELEFONO</p>
                <p className="text-sm">{selectedEntry.telefono}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CANALE PRINCIPALE</p>
                <p className="text-sm capitalize flex items-center gap-2">
                  {getChannelIcon(selectedEntry.canale)} {selectedEntry.canale}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">STATO LEAD</p>
                <Badge>{selectedEntry.stato_lead}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OPERATORE</p>
                <p className="text-sm">{selectedEntry.operatore_assegnato_nome || 'Nessuno'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}