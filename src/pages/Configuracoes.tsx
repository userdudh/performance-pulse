import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Ajustes do sistema</p>
        </div>
        <Card className="glass border-border/40">
          <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Geral</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configurações do sistema estarão disponíveis em breve.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
