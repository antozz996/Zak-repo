import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListContatti, useGetContatto } from "@workspace/api-client-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Contatti() {
  const [search, setSearch] = useState("");
  const [statoLead, setStatoLead] = useState<string>("all");

  const { data: contatti, isLoading } = useListContatti({ 
    search: search || undefined, 
    stato_lead: statoLead !== "all" ? statoLead : undefined 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entrata': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_trattativa': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'confermato': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'perso': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contatti</h1>
            <p className="text-muted-foreground">Gestisci i lead e i clienti.</p>
          </div>
          <Button asChild>
            <Link href="/contatti/nuovo">
              <Plus className="w-4 h-4 mr-2" /> Nuovo Contatto
            </Link>
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca per nome o telefono..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statoLead} onValueChange={setStatoLead}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tutti gli stati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="entrata">In entrata</SelectItem>
              <SelectItem value="in_trattativa">In trattativa</SelectItem>
              <SelectItem value="confermato">Confermato</SelectItem>
              <SelectItem value="perso">Perso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Tipo Evento</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data Creazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Caricamento...</TableCell>
                </TableRow>
              ) : contatti?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Nessun contatto trovato.</TableCell>
                </TableRow>
              ) : (
                contatti?.map((contatto) => (
                  <TableRow key={contatto.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{contatto.nome}</TableCell>
                    <TableCell>{contatto.telefono}</TableCell>
                    <TableCell className="capitalize">{contatto.origine_lead}</TableCell>
                    <TableCell className="capitalize">{contatto.tipo_evento?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(contatto.stato_lead)}`}>
                        {contatto.stato_lead.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(contatto.data_creazione), "d MMM yyyy", { locale: it })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarLayout>
  );
}