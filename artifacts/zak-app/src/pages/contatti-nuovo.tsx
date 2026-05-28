import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useCreateContatto, getListContattiQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const vuoto = {
  nome: "",
  telefono: "",
  instagram_username: "",
  origine_lead: "manuale",
  tipo_evento: "",
  stato_lead: "entrata",
};

export default function ContattiNuovo() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [form, setForm] = useState(vuoto);
  const [errore, setErrore] = useState("");

  const crea = useCreateContatto();

  const salva = async () => {
    if (!form.nome.trim()) { setErrore("Il nome è obbligatorio."); return; }
    if (!form.telefono.trim()) { setErrore("Il telefono è obbligatorio."); return; }
    try {
      await crea.mutateAsync({
        data: {
          nome: form.nome,
          telefono: form.telefono,
          instagram_username: form.instagram_username || undefined,
          origine_lead: form.origine_lead,
          tipo_evento: form.tipo_evento || undefined,
          stato_lead: form.stato_lead,
        },
      });
      await qc.invalidateQueries({ queryKey: getListContattiQueryKey() });
      navigate("/contatti");
    } catch {
      setErrore("Errore durante il salvataggio. Il numero potrebbe essere già registrato.");
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contatti")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuovo Contatto</h1>
            <p className="text-muted-foreground">Aggiungi un lead o cliente al CRM.</p>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-5 bg-background">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Nome completo <span className="text-destructive">*</span></Label>
              <Input
                placeholder="es. Alessia Conti"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefono <span className="text-destructive">*</span></Label>
              <Input
                placeholder="es. +39 333 1234567"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Username Instagram</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
              <Input
                className="pl-7"
                placeholder="nomeutente"
                value={form.instagram_username}
                onChange={(e) => setForm((f) => ({ ...f, instagram_username: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Canale di origine</Label>
              <Select value={form.origine_lead} onValueChange={(v) => setForm((f) => ({ ...f, origine_lead: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="manuale">Manuale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo evento</Label>
              <Select value={form.tipo_evento} onValueChange={(v) => setForm((f) => ({ ...f, tipo_evento: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleziona tipo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diciottesimo">18° compleanno</SelectItem>
                  <SelectItem value="laurea">Laurea</SelectItem>
                  <SelectItem value="compleanno">Compleanno</SelectItem>
                  <SelectItem value="matrimonio">Matrimonio</SelectItem>
                  <SelectItem value="aziendale">Aziendale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Stato lead</Label>
            <Select value={form.stato_lead} onValueChange={(v) => setForm((f) => ({ ...f, stato_lead: v }))}>
              <SelectTrigger className="max-w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrata">In entrata</SelectItem>
                <SelectItem value="in_trattativa">In trattativa</SelectItem>
                <SelectItem value="confermato">Confermato</SelectItem>
                <SelectItem value="perso">Perso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errore && <p className="text-sm text-destructive">{errore}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/contatti")}>Annulla</Button>
            <Button onClick={salva} disabled={crea.isPending}>
              {crea.isPending ? "Salvataggio..." : "Crea Contatto"}
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
