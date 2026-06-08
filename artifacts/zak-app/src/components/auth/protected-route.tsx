import { Redirect } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAuthSession } from "@/lib/auth-session";

type StaffRole = "admin" | "manager" | "staff";

const roleRank: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

export function ProtectedRoute({
  children,
  minimumRole = "staff",
}: {
  children: React.ReactNode;
  minimumRole?: StaffRole;
}) {
  const { data: user, isLoading, isError } = useGetCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Verifica sessione staff...
      </div>
    );
  }

  if (isError || !user) {
    clearAuthSession();
    return <Redirect to="/login" />;
  }

  if (roleRank[user.ruolo] < roleRank[minimumRole]) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Accesso non autorizzato
            </CardTitle>
            <CardDescription>
              Il tuo ruolo attuale non permette di accedere a questa sezione.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/dashboard">Torna alla dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
