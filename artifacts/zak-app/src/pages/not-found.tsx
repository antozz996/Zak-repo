import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex gap-3">
            <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold">Pagina non trovata</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                La sezione richiesta non esiste o non e` piu` disponibile in produzione.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
