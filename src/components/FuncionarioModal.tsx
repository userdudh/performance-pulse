import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { RegistroDiario, FuncionarioMetrics } from "@/lib/calculations";
import { TrendingUp, Clock, Target, Calendar, AlertTriangle } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: entry.color }}>●</span> {entry.name}: {typeof entry.value === 'number' ? Number(entry.value.toFixed(3)).toLocaleString("pt-BR") : entry.value}
        </p>
      ))}
    </div>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: FuncionarioMetrics | null;
  registros: RegistroDiario[];
}

export function FuncionarioModal({ open, onOpenChange, funcionario, registros }: Props) {
  const evolucaoDiaria = useMemo(() => {
    if (!funcionario) return [];
    return registros
      .filter(r => r.funcionario_id === funcionario.funcionario_id)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(r => ({
        data: r.data.substring(5),
        producao: Number(Number(r.producao_dia).toFixed(3)),
        horas: Number(Number(r.horas_trabalhadas).toFixed(1)),
        presenca: r.status_presenca || 'Presente',
      }));
  }, [registros, funcionario]);

  const evolucaoMensal = useMemo(() => {
    if (!funcionario) return [];
    const byMonth = new Map<string, { producao: number; horas: number; count: number }>();
    registros
      .filter(r => r.funcionario_id === funcionario.funcionario_id)
      .forEach(r => {
        const month = r.data.substring(0, 7);
        const cur = byMonth.get(month) || { producao: 0, horas: 0, count: 0 };
        cur.producao += Number(r.producao_dia) || 0;
        cur.horas += Number(r.horas_trabalhadas) || 0;
        cur.count++;
        byMonth.set(month, cur);
      });
    return Array.from(byMonth.entries())
      .map(([mes, v]) => ({ mes, producao: Number(v.producao.toFixed(3)), horas: Number(v.horas.toFixed(1)) }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [registros, funcionario]);

  if (!funcionario) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verde": return <Badge className="bg-success/20 text-success border border-success/30">🟢 Acima de 90%</Badge>;
      case "amarelo": return <Badge className="bg-warning/20 text-warning border border-warning/30">🟡 70-90%</Badge>;
      default: return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">🔴 Abaixo de 70%</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl text-foreground">{funcionario.nome}</DialogTitle>
              <DialogDescription className="text-muted-foreground">{funcionario.setor} · {funcionario.dias_trabalhados} dias</DialogDescription>
            </div>
            {getStatusBadge(funcionario.status)}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Produção Total", value: Number(funcionario.producao_total.toFixed(3)).toLocaleString("pt-BR"), icon: TrendingUp, color: "text-primary" },
            { label: "% Meta", value: `${funcionario.pct_meta.toFixed(1)}%`, icon: Target, color: funcionario.pct_meta >= 90 ? "text-success" : funcionario.pct_meta >= 70 ? "text-warning" : "text-destructive" },
            { label: "Horas", value: `${funcionario.horas_trabalhadas.toFixed(1)}h`, icon: Clock, color: "text-secondary" },
            { label: "Absenteísmo", value: `${funcionario.taxa_absenteismo.toFixed(1)}%`, icon: AlertTriangle, color: funcionario.taxa_absenteismo > 15 ? "text-destructive" : "text-muted-foreground" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border/30 bg-muted/20 p-3 text-center">
              <kpi.icon className={`mx-auto h-5 w-5 ${kpi.color} mb-1`} />
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-lg font-bold font-display ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso da Meta</span>
            <span className="font-medium text-foreground">{funcionario.pct_meta.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(funcionario.pct_meta, 100)} className="h-3" />
        </div>

        {evolucaoDiaria.length > 0 && (
          <div>
            <h3 className="font-display text-sm font-medium text-foreground mb-2">Produção Diária</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={evolucaoDiaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 16%)" />
                <XAxis dataKey="data" tick={{ fontSize: 10, fill: "hsl(225 15% 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(225 15% 55%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="producao" stroke="hsl(250 84% 64%)" fill="hsl(250 84% 64% / 0.2)" name="Produção" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {evolucaoMensal.length > 1 && (
          <div>
            <h3 className="font-display text-sm font-medium text-foreground mb-2">Evolução Mensal</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 16%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(225 15% 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(225 15% 55%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="producao" fill="hsl(220 90% 56%)" name="Produção" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
