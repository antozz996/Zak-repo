import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListUtenti,
  useCreateUtente,
  useUpdateUtente,
  useDeleteUtente,
  getListUtentiQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Pencil, Trash2, ShieldCheck, User, Users } from "lucide-react";

type Utente = {
  id: string;
  nome: string;
  ruolo: string;
  email: string;
  data_creazione: string;
};

const ruoloLabel: Record<string, string> = {
  admin: "Amministratore",
  manager: "Manager",
  staff: "Staff",
};

const ruoloColore: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-amber-100 text-amber-800",
  staff: "bg-blue-100 text-blue-800",
};

const RuoloIcon = ({ ruolo }: { ruolo: string }) => {
  if (ruolo === "admin") return <ShieldCheck className="w-3.5 h-3.5" />;
  if (ruolo === "manager") return <Users className="w-3.5 h-3.5" />;
  return <User className="w-3.5 h-3.5" />;
};

const vuoto = { nome: "", ruolo: "staff", email: "" };

export default function Impostazioni() {
  const qc = useQueryClient();
  const [drawerAperto, setDrawerAperto] = useState(false);
  const [selezionato, setSelezionato] = useState<Utente | null>(null);
  const [form, setForm] = useState(vuoto);
  const [errore, setErrore] = useState("");

  const { data: utenti, isLoading } = useListUtenti();
  const crea = useCreateUtente();
  const aggiorna = useUpdateUtente();
  const elimina = useDeleteUtente();

  const invalida = () => qc.invalidateQueries({ queryKey: getListUtentiQueryKey() });

  const apriNuovo = () => {
    setSelezionato(null);
    setForm(vuoto);
    setErrore("");
    setDrawerAperto(true);
  };

  const apriModifica = (u: Utente) => {
    setSelezionato(u);
    setForm({ nome: u.nome, ruolo: u.ruolo, email: u.email });
    setErrore("");
    setDrawerAperto(true);
  };

  const salva = async () => {
    if (!form.nome.trim()) { setErrore("Il nome è obbligatorio."); return; }
    if (!form.email.trim()) { setErrore("L'email è obbligatoria."); return; }
    try {
      if (selezionato) {
        await aggiorna.mutateAsync({ id: selezionato.id, data: form });
      } else {
        await crea.mutateAsync({ data: form });
      }
      await invalida();
      setDrawerAperto(false);
    } catch {
      setErrore("Errore durante il salvataggio. L'email potrebbe essere già in uso.");
    }
  };

  const rimuovi = async (id: string) => {
    if (!confirm("Eliminare questo membro dello staff?")) return;
    await elimina.mutateAsync({ id });
    await invalida();
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">Gestione del team e accessi al sistema.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Team Staff</h2>
              <p className="text-sm text-muted-foreground">
                {utenti?.length || 0} {utenti?.length === 1 ? "membro" : "membri"} del team
              </p>
            </div>
            <Button onClick={apriNuovo}>
              <Plus className="w-4 h-4 mr-2" /> Aggiungi Membro
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Aggiunto il</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Caricamento...</TableCell>
                  </TableRow>
                ) : utenti?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Nessun membro trovato.</TableCell>
                  </TableRow>
                ) : (
                  utenti?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ruoloColore[u.ruolo] || "bg-muted"}`}>
                          <RuoloIcon ruolo={u.ruolo} />
                          {ruoloLabel[u.ruolo] || u.ruolo}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.data_creazione), "d MMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => apriModifica(u as Utente)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => rimuovi(u.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Sheet open={drawerAperto} onOpenChange={setDrawerAperto}>
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle>{selezionato ? "Modifica Membro" : "Nuovo Membro Staff"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                placeholder="es. Marco Rossi"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="es. marco@zak.it"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ruolo</Label>
              <Select value={form.ruolo} onValueChange={(v) => setForm((f) => ({ ...f, ruolo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Amministratore</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerAperto(false)}>Annulla</Button>
            <Button onClick={salva} disabled={crea.isPending || aggiorna.isPending}>
              {crea.isPending || aggiorna.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SidebarLayout>
  );
}
