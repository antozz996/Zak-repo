import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, ShieldCheck } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAuthSession } from "@/lib/auth-session";

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const session = await login.mutateAsync({
        data: {
          email: email.trim(),
          password,
          remember,
        },
      });
      saveAuthSession(session.token, session.expires_at);
      setLocation("/dashboard");
    } catch {
      setError("Credenziali non valide o account disattivato.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#1f3b57,_transparent_34%),linear-gradient(135deg,_#0b1220,_#152033_46%,_#f4ead8_46%,_#f8f2e8)] p-6 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-center text-white">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
              <ShieldCheck className="h-4 w-4" />
              Sala Operativa Zak
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Accesso staff con ruoli reali.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Login centralizzato per proteggere dashboard, inbox, preventivi, automazioni, B2B e audit log.
              I permessi vengono applicati sia nel frontend sia nel backend.
            </p>
          </section>

          <Card className="border-white/60 bg-white/90 shadow-2xl backdrop-blur">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <CardTitle>Login Staff</CardTitle>
              <CardDescription>Inserisci le credenziali assegnate dall'amministratore.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="staff@zak.local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Mantieni accesso per 7 giorni
                </label>
                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                <Button className="w-full" type="submit" disabled={login.isPending}>
                  {login.isPending ? "Accesso in corso..." : "Entra nella dashboard"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Primo accesso: usare `/api/auth/bootstrap-admin` per creare o proteggere il primo admin.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
