import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, TrendingUp, Clock, Target, Sparkles, CalendarDays, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FuncionarioModal } from "@/components/FuncionarioModal";
import {
  RegistroDiario, FuncionarioMetrics, calcFuncionarioMetrics, calcSetorMetrics,
  getSetorOptions,
} from "@/lib/calculations";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

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

export default function Dashboard() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [filtroSetor, setFiltroSetor] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [selectedFunc, setSelectedFunc] = useState<FuncionarioMetrics | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("registros_diarios")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: true })
      .then(({ data }) => {
        const d = (data || []) as unknown as RegistroDiario[];
        setRegistros(d);
        if (d.length > 0) {
          const dates = d.map(r => r.data).sort();
          const lastDate = dates[dates.length - 1];
          const lastMonth = lastDate.substring(0, 7);
          setDataInicio(`${lastMonth}-01`);
          setDataFim(lastDate);
        }
      });
  }, [user]);

  const setorOptions = useMemo(() => getSetorOptions(registros), [registros]);

  const filtered = useMemo(() => {
    return registros.filter(r => {
      const matchDate = (!dataInicio || r.data >= dataInicio) && (!dataFim || r.data <= dataFim);
      const matchSetor = filtroSetor === "all" || r.setor === filtroSetor;
      return matchDate && matchSetor;
    });
  }, [registros, dataInicio, dataFim, filtroSetor]);

  const funcMetrics = useMemo(() => calcFuncionarioMetrics(filtered), [filtered]);
  const setorMetrics = useMemo(() => calcSetorMetrics(funcMetrics), [funcMetrics]);

  const mediaMeta = funcMetrics.length > 0 ? funcMetrics.reduce((a, f) => a + f.pct_meta, 0) / funcMetrics.length : 0;
  const totalProduzido = funcMetrics.reduce((a, f) => a + f.producao_total, 0);
  const totalHoras = funcMetrics.reduce((a, f) => a + f.horas_trabalhadas, 0);
  const totalFunc = funcMetrics.length;
  const mediaAbsenteismo = funcMetrics.length > 0 ? funcMetrics.reduce((a, f) => a + f.taxa_absenteismo, 0) / funcMetrics.length : 0;

  const ranking = [...funcMetrics].sort((a, b) => b.pct_meta - a.pct_meta);

  const prodPorSetorData = setorMetrics.map(s => ({
    setor: s.setor,
    producao: Number(s.producao_total.toFixed(3)),
    "% Meta": Number(s.media_pct_meta.toFixed(1)),
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verde": return <Badge className="bg-success/20 text-success border border-success/30">🟢</Badge>;
      case "amarelo": return <Badge className="bg-warning/20 text-warning border border-warning/30">🟡</Badge>;
      default: return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">🔴</Badge>;
    }
  };

  const noData = registros.length === 0;

  const kpis = [
    { title: "Score Médio", value: `${mediaMeta.toFixed(1)}%`, icon: Target, color: mediaMeta >= 90 ? "text-success" : mediaMeta >= 70 ? "text-warning" : "text-destructive", bgColor: mediaMeta >= 90 ? "bg-success/10" : mediaMeta >= 70 ? "bg-warning/10" : "bg-destructive/10" },
    { title: "Total Produzido", value: Number(totalProduzido.toFixed(3)).toLocaleString("pt-BR"), icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Horas Trabalhadas", value: `${totalHoras.toFixed(1)}h`, icon: Clock, color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Funcionários", value: totalFunc, icon: Users, color: "text-neon-cyan", bgColor: "bg-neon-cyan/10" },
    { title: "Absenteísmo Médio", value: `${mediaAbsenteismo.toFixed(1)}%`, icon: AlertTriangle, color: mediaAbsenteismo > 10 ? "text-destructive" : "text-muted-foreground", bgColor: mediaAbsenteismo > 10 ? "bg-destructive/10" : "bg-muted/20" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho da empresa</p>
        </div>

        <Card className="glass border-border/40">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">De:</span>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-40 bg-muted/50 border-border/50 text-sm" />
              <span className="text-xs text-muted-foreground">Até:</span>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40 bg-muted/50 border-border/50 text-sm" />
            </div>
            <Select value={filtroSetor} onValueChange={setFiltroSetor}>
              <SelectTrigger className="w-44 bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {setorOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {noData ? (
          <Card className="glass border-border/40">
            <CardContent className="py-20 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary/40" />
              <p className="font-display text-lg font-medium">Nenhum dado importado ainda</p>
              <p className="mt-2 text-sm">Vá para "Importar Dados" para carregar sua planilha.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {kpis.map((kpi, i) => (
                <motion.div key={kpi.title} variants={fadeIn} custom={i}>
                  <Card className="glass border-border/40 hover:border-primary/20 transition-all duration-300 group">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={`rounded-xl p-3 ${kpi.bgColor} ${kpi.color} transition-transform group-hover:scale-110`}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                        <p className={`text-2xl font-display font-bold ${kpi.color}`}>{kpi.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <motion.div variants={fadeIn} custom={5}>
                <Card className="glass border-border/40">
                  <CardHeader><CardTitle className="font-display text-lg">Desempenho Médio por Setor</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prodPorSetorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 16%)" />
                        <XAxis dataKey="setor" tick={{ fontSize: 11, fill: "hsl(225 15% 55%)" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(225 15% 55%)" }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(230 18% 16% / 0.5)' }} />
                        <Legend />
                        <Bar dataKey="producao" fill="hsl(250 84% 64%)" name="Produção Total" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="% Meta" fill="hsl(185 100% 55%)" name="% Meta Média" radius={[6, 6, 0, 0]} opacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn} custom={6}>
                <Card className="glass border-border/40">
                  <CardHeader><CardTitle className="font-display text-lg">Ranking de Funcionários</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {ranking.slice(0, 10).map((f, i) => (
                        <div
                          key={f.funcionario_id}
                          onClick={() => { setSelectedFunc(f); setModalOpen(true); }}
                          className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <span className="font-display text-sm font-bold text-muted-foreground w-6">{i + 1}º</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{f.nome}</p>
                            <p className="text-xs text-muted-foreground">{f.setor}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${f.pct_meta >= 90 ? 'text-success' : f.pct_meta >= 70 ? 'text-warning' : 'text-destructive'}`}>
                              {f.pct_meta.toFixed(1)}%
                            </p>
                          </div>
                          {getStatusBadge(f.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <FuncionarioModal open={modalOpen} onOpenChange={setModalOpen} funcionario={selectedFunc} registros={registros} />
    </AppLayout>
  );
}
