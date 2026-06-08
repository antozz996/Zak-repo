import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Users,
  Send,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Clock,
  Check,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  User,
  Bot,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Operator {
  id: string;
  nome: string;
  ruolo: string;
  online: boolean;
  activeChat?: string;
}

interface Message {
  id: string;
  sender: "client" | "operator" | "system";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
  operatorName?: string;
}

export default function RealtimeInboxMock() {
  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  
  // Lock state: simulate that "Giuseppe" has locked the chat
  const [isLockedByOther, setIsLockedByOther] = useState(true);
  const [lockedOperatorName, setLockedOperatorName] = useState("Giuseppe");

  // Client typing simulation
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [inputText, setInputText] = useState("");

  // Operators list
  const [operators, setOperators] = useState<Operator[]>([
    { id: "1", nome: "Giuseppe R.", ruolo: "Venue Manager", online: true, activeChat: "Mario Rossi" },
    { id: "2", nome: "Lucia B.", ruolo: "Event Planner", online: true },
    { id: "3", nome: "Marco V.", ruolo: "Commerciale", online: false },
    { id: "4", nome: "Sofia T.", ruolo: "Staff Accoglienza", online: true },
  ]);

  // Messages list
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "client", text: "Salve, vorrei opzionare la sala per sabato 12 settembre.", time: "18:30", status: "read" },
    { id: "2", sender: "system", text: "ZAK AI ha identificato l'intento: Opzione Data (12/09/2026)", time: "18:30", status: "read" },
    { id: "3", sender: "operator", text: "Buonasera! Certo, verifico subito la disponibilita' in agenda.", time: "18:32", status: "read", operatorName: "Giuseppe R." },
    { id: "4", sender: "client", text: "Grazie mille. Potete mandarmi anche i dettagli sul catering?", time: "18:33", status: "read" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isClientTyping]);

  // Simulates client typing and replying
  const triggerClientReply = () => {
    if (isClientTyping) return;
    setIsClientTyping(true);
    setTimeout(() => {
      setIsClientTyping(false);
      const newMsg: Message = {
        id: Date.now().toString(),
        sender: "client",
        text: "Ho visto che Villa Reale offre il catering incluso. Voi che opzioni avete?",
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };
      setMessages((prev) => [...prev, newMsg]);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (isLockedByOther) return;
    if (!isConnected) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "operator",
      text: inputText,
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      operatorName: "Tu (Operatore)",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate tick updates
    const msgId = newMsg.id;
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "delivered" } : m))
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "read" } : m))
      );
    }, 2500);
  };

  // Force bypass other operator's lock
  const handleTakeOverLock = () => {
    setIsLockedByOther(false);
    const systemMsg: Message = {
      id: Date.now().toString(),
      sender: "system",
      text: "Subentro effettuato. La chat e' ora gestita da te.",
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header and simulation bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-indigo-500" /> Realtime Inbox (Mockup)
            </h1>
            <p className="text-muted-foreground mt-1">
              Simulatore UX per inbox collaborativo multi-operatore in tempo reale.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isConnected ? "outline" : "destructive"}
              onClick={() => setIsConnected(!isConnected)}
              className="text-xs font-semibold"
            >
              {isConnected ? (
                <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Connesso</span>
              ) : (
                <span className="flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5" /> Disconnesso</span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLockedByOther(!isLockedByOther)}
              className="text-xs font-semibold"
            >
              {isLockedByOther ? (
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-500" /> Sblocca Chat</span>
              ) : (
                <span className="flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-emerald-500" /> Blocca Chat</span>
              )}
            </Button>
            <Button
              onClick={triggerClientReply}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Simula Ricezione Cliente
            </Button>
          </div>
        </div>

        {/* Fallback offline banner if disconnected */}
        {!isConnected && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-bounce">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Realtime non disponibile. La connessione WebSocket e' stata persa. Clicca su Aggiorna per tentare il ripristino.
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsConnected(true)}
              className="h-8 text-[11px] font-bold text-amber-800 hover:bg-amber-500/20 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Aggiorna Manualmente
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Sidebar operators list */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" /> Operatori Connessi
                </CardTitle>
                <CardDescription className="text-[10px]">Stato presenza dello staff</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-3">
                {operators.map((op) => (
                  <div key={op.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                          {op.nome.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                          op.online ? "bg-emerald-500" : "bg-slate-400"
                        }`} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{op.nome}</div>
                        <div className="text-[10px] text-muted-foreground">{op.ruolo}</div>
                      </div>
                    </div>
                    {op.activeChat && (
                      <Badge variant="outline" className="text-[9px] bg-indigo-500/5 text-indigo-700 border-indigo-500/20">
                        In chat
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-3">
            <Card className="h-[500px] flex flex-col justify-between overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b bg-muted/20 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                    MR
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Mario Rossi</h3>
                    <p className="text-[10px] text-emerald-600 font-medium">WhatsApp · Attivo</p>
                  </div>
                </div>
                
                {/* Active operator indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Presenza:</span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-700 bg-amber-500/5">
                    {lockedOperatorName} sta guardando
                  </Badge>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                {messages.map((m) => {
                  if (m.sender === "system") {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-indigo-500" /> {m.text}
                        </div>
                      </div>
                    );
                  }
                  const isOperator = m.sender === "operator";
                  return (
                    <div key={m.id} className={`flex ${isOperator ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[70%]">
                        {isOperator && m.operatorName && (
                          <span className="text-[9px] text-muted-foreground block mb-0.5 text-right">{m.operatorName}</span>
                        )}
                        <div className={`p-3 rounded-2xl text-xs ${
                          isOperator ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-900 border text-foreground rounded-tl-none"
                        }`}>
                          <p>{m.text}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isOperator ? "text-indigo-200" : "text-muted-foreground"
                          }`}>
                            <span>{m.time}</span>
                            {isOperator && (
                              <span>
                                {m.status === "sent" && <Check className="w-3 h-3 text-indigo-300" />}
                                {m.status === "delivered" && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                                {m.status === "read" && <CheckCheck className="w-3 h-3 text-sky-300" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Client typing indicator animation */}
                {isClientTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-900 border p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-[10px] text-muted-foreground ml-1.5 font-medium">Mario Rossi sta scrivendo...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input / Controls */}
              <div className="p-4 border-t bg-card relative">
                {/* Operator locked state warning */}
                {isLockedByOther && (
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-background border border-amber-500/30 shadow-lg rounded-xl p-3.5 max-w-sm w-full text-center space-y-2.5">
                      <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-xs">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Chat bloccata da {lockedOperatorName}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Giuseppe sta gestendo questa chat. Per evitare conflitti, l'area di input e' stata disabilitata.
                      </p>
                      <Button
                        onClick={handleTakeOverLock}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-7 text-[10px] w-full"
                      >
                        Forza Subentro (Sblocca)
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder={isConnected ? "Rispondi a Mario Rossi..." : "Disconnesso... impossibile inviare"}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!isConnected || isLockedByOther}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="text-xs"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!isConnected || isLockedByOther || !inputText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
