import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Brain, AlertTriangle, TrendingDown, Lightbulb, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  RegistroDiario, calcFuncionarioMetrics, calcSetorMetrics, calcDependenciaColetiva,
  simulateWhatIf, generateInsights, getMonthOptions, getFuncionarioOptions,
} from "@/lib/calculations";

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

const CustomTooltipScatter = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      <p className="text-sm font-medium text-foreground">{d.nome}</p>
      <p className="text-xs text-muted-foreground">Eficiência: {d.eficiencia}%</p>
      <p className="text-xs text-muted-foreground">Meta: {d.meta}%</p>
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: entry.color }}>●</span> {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function InteligenciaOperacional() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [filtroMes, setFiltroMes] = useState("");
  const [ausentes, setAusentes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("registros_diarios").select("*").eq("user_id", user.id)
      .then(({ data }) => {
        const d = (data || []) as unknown as RegistroDiario[];
        setRegistros(d);
        const months = getMonthOptions(d);
        if (months.length > 0 && !filtroMes) setFiltroMes(months[0]);
      });
  }, [user]);

  const monthOptions = useMemo(() => getMonthOptions(registros), [registros]);
  const funcOptions = useMemo(() => getFuncionarioOptions(registros), [registros]);

  const filtered = useMemo(() => {
    return registros.filter(r => !filtroMes || r.data.startsWith(filtroMes));
  }, [registros, filtroMes]);

  const funcMetrics = useMemo(() => calcFuncionarioMetrics(filtered), [filtered]);
  const setorMetrics = useMemo(() => calcSetorMetrics(funcMetrics), [funcMetrics]);
  const insights = useMemo(() => generateInsights(funcMetrics, setorMetrics), [funcMetrics, setorMetrics]);
  const dependencias = useMemo(() => calcDependenciaColetiva(filtered), [filtered]);
  const whatIfResult = useMemo(() => simulateWhatIf(filtered, ausentes), [filtered, ausentes]);

  const scatterData = funcMetrics.map(f => ({
    nome: f.nome,
    eficiencia: Number(f.eficiencia_tempo.toFixed(1)),
    meta: Number(f.pct_meta.toFixed(1)),
  }));

  const setorChartData = setorMetrics.map(s => ({
    setor: s.setor,
    "% Meta": Number(s.media_pct_meta.toFixed(1)),
    "Eficiência %": Number(s.media_eficiencia.toFixed(1)),
    "Absenteísmo %": Number(s.taxa_absenteismo_media.toFixed(1)),
  }));

  const insightColor = (tipo: string) => {
    switch (tipo) {
      case "danger": return "border-l-destructive bg-destructive/5";
      case "warning": return "border-l-warning bg-warning/5";
      case "success": return "border-l-success bg-success/5";
      default: return "border-l-primary bg-primary/5";
    }
  };

  const insightIcon = (tipo: string) => {
    switch (tipo) {
      case "danger": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "warning": return <TrendingDown className="h-4 w-4 text-warning" />;
      case "success": return <Lightbulb className="h-4 w-4 text-success" />;
      default: return <Brain className="h-4 w-4 text-primary" />;
    }
  };

  const toggleAusente = (funcId: string) => {
    setAusentes(prev => prev.includes(funcId) ? prev.filter(id => id !== funcId) : [...prev, funcId]);
  };

  const noData = registros.length === 0;

  // Heatmap data: for each employee, show which days they hit the daily target
  const heatmapData = useMemo(() => {
    if (filtered.length === 0) return [];
    const grouped = new Map<string, RegistroDiario[]>();
    filtered.forEach(r => {
      if (!grouped.has(r.funcionario_id)) grouped.set(r.funcionario_id, []);
      grouped.get(r.funcionario_id)!.push(r);
    });

    return Array.from(grouped.entries()).map(([funcId, regs]) => {
      const diasBateu = regs.filter(r => Number(r.producao_dia) >= Number(r.meta_diaria)).length;
      const total = regs.length;
      const constancia = total > 0 ? (diasBateu / total) * 100 : 0;
      return {
        nome: regs[0].nome,
        setor: regs[0].setor,
        constancia,
        diasBateu,
        total,
      };
    }).sort((a, b) => b.constancia - a.constancia);
  }, [filtered]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> Inteligência Operacional
            </h1>
            <p className="text-sm text-muted-foreground">Análises, alertas, dependência coletiva e simulação de impacto</p>
          </div>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-40 bg-muted/50 border-border/50"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>{monthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {noData ? (
          <Card className="glass border-border/40">
            <CardContent className="py-20 text-center text-muted-foreground">
              <Brain className="mx-auto mb-4 h-12 w-12 text-primary/40" />
              <p className="font-display text-lg">Importe dados para ver a inteligência operacional.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="bg-muted/50 border border-border/30">
              <TabsTrigger value="insights">Insights & Alertas</TabsTrigger>
              <TabsTrigger value="dependencia">Dependência Coletiva</TabsTrigger>
              <TabsTrigger value="simulador">Simulador What-If</TabsTrigger>
              <TabsTrigger value="constancia">Mapa de Constância</TabsTrigger>
              <TabsTrigger value="analises">Análises Visuais</TabsTrigger>
            </TabsList>

            {/* TAB: Insights & Alertas */}
            <TabsContent value="insights">
              <motion.div initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={fadeIn} custom={0}>
                  <Card className="glass border-border/40">
                    <CardHeader><CardTitle className="font-display text-lg">Diagnósticos Automáticos</CardTitle></CardHeader>
                    <CardContent>
                      {insights.length > 0 ? (
                        <div className="space-y-3">
                          {insights.map((ins, i) => (
                            <motion.div key={i} variants={fadeIn} custom={i}>
                              <div className={`rounded-lg border-l-4 border border-border/30 p-4 ${insightColor(ins.tipo)} flex items-start gap-3`}>
                                {insightIcon(ins.tipo)}
                                <div>
                                  <p className="text-sm font-medium text-foreground">{ins.titulo}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{ins.descricao}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum insight gerado para o período selecionado.</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* TAB: Dependência Coletiva */}
            <TabsContent value="dependencia">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Algoritmo de Dependência Coletiva</CardTitle>
                  <p className="text-xs text-muted-foreground">Mede quanto a equipe perde de eficiência quando um funcionário falta</p>
                </CardHeader>
                <CardContent>
                  {dependencias.length > 0 ? (
                    <div className="space-y-3">
                      {dependencias.slice(0, 15).map((dep, i) => (
                        <div key={dep.funcionario_id} className="flex items-center gap-4 rounded-lg border border-border/20 bg-muted/10 p-4">
                          <span className="font-display text-sm font-bold text-muted-foreground w-6">{i + 1}º</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{dep.nome}</p>
                            <p className="text-xs text-muted-foreground">{dep.setor} · {dep.dias_ausente} dia(s) ausente</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-display font-bold ${dep.impacto_pct >= 15 ? 'text-destructive' : dep.impacto_pct >= 5 ? 'text-warning' : 'text-success'}`}>
                              -{dep.impacto_pct.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">impacto na equipe</p>
                          </div>
                          <Badge className={
                            dep.impacto_pct >= 15 ? 'bg-destructive/20 text-destructive border-destructive/30' :
                            dep.impacto_pct >= 5 ? 'bg-warning/20 text-warning border-warning/30' :
                            'bg-success/20 text-success border-success/30'
                          }>
                            {dep.impacto_pct >= 15 ? 'Crítico' : dep.impacto_pct >= 5 ? 'Atenção' : 'Baixo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma dependência detectada. É necessário que haja registros com faltas para calcular o impacto.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Simulador What-If */}
            <TabsContent value="simulador">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="glass border-border/40">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Selecionar Funcionários Ausentes</CardTitle>
                    <p className="text-xs text-muted-foreground">Marque quem estaria ausente para simular o impacto</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {funcOptions.map(f => (
                        <label key={f.id} className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 p-3 hover:bg-muted/30 cursor-pointer transition-colors">
                          <Checkbox
                            checked={ausentes.includes(f.id)}
                            onCheckedChange={() => toggleAusente(f.id)}
                          />
                          <span className="text-sm text-foreground">{f.nome}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  <Card className="glass border-border/40">
                    <CardHeader>
                      <CardTitle className="font-display text-lg">Resultado da Simulação</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {ausentes.length === 0 ? "Selecione funcionários para simular" : `${ausentes.length} funcionário(s) ausente(s)`}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {ausentes.length > 0 && whatIfResult.length > 0 ? (
                        <div className="space-y-4">
                          {whatIfResult.filter(r => r.queda_pct > 0).map(r => (
                            <div key={r.setor} className="rounded-lg border border-border/20 bg-muted/10 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">{r.setor}</p>
                                <Badge className={r.queda_pct >= 20 ? 'bg-destructive/20 text-destructive' : r.queda_pct >= 10 ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}>
                                  -{r.queda_pct.toFixed(1)}% queda
                                </Badge>
                              </div>
                              <div className="flex gap-6 text-xs text-muted-foreground">
                                <span>Original: {Number(r.producao_original.toFixed(1)).toLocaleString("pt-BR")}</span>
                                <span>Estimada: {Number(r.producao_estimada.toFixed(1)).toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${r.queda_pct >= 20 ? 'bg-destructive' : r.queda_pct >= 10 ? 'bg-warning' : 'bg-success'}`}
                                  style={{ width: `${Math.max(0, 100 - r.queda_pct)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {whatIfResult.filter(r => r.queda_pct > 0).length === 0 && (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                              Os funcionários selecionados não têm produção registrada neste período.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                          <p className="text-sm">Selecione funcionários à esquerda para simular</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Mapa de Constância */}
            <TabsContent value="constancia">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Mapa de Constância de Batimento de Meta</CardTitle>
                  <p className="text-xs text-muted-foreground">Identifica funcionários "constantes" vs "inconstantes" no batimento da meta diária</p>
                </CardHeader>
                <CardContent>
                  {heatmapData.length > 0 ? (
                    <div className="space-y-2">
                      {heatmapData.map((item, i) => {
                        const hue = item.constancia >= 80 ? 160 : item.constancia >= 50 ? 38 : 0;
                        const sat = item.constancia >= 80 ? '72%' : item.constancia >= 50 ? '92%' : '72%';
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-border/20 p-3">
                            <div className="w-40 min-w-[10rem] truncate">
                              <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                              <p className="text-xs text-muted-foreground">{item.setor}</p>
                            </div>
                            <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${item.constancia}%`,
                                  backgroundColor: `hsl(${hue} ${sat} 42%)`,
                                }}
                              />
                            </div>
                            <span className={`text-sm font-display font-bold w-16 text-right ${
                              item.constancia >= 80 ? 'text-success' : item.constancia >= 50 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {item.constancia.toFixed(0)}%
                            </span>
                            <span className="text-xs text-muted-foreground w-20">
                              {item.diasBateu}/{item.total} dias
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">Sem dados para o período selecionado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Análises Visuais */}
            <TabsContent value="analises">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="glass border-border/40">
                  <CardHeader><CardTitle className="font-display text-lg">Eficiência vs % Meta</CardTitle></CardHeader>
                  <CardContent>
                    {scatterData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 16%)" />
                          <XAxis type="number" dataKey="eficiencia" name="Eficiência %" domain={[0, "auto"]} tick={{ fontSize: 12, fill: "hsl(225 15% 55%)" }} />
                          <YAxis type="number" dataKey="meta" name="Meta %" domain={[0, "auto"]} tick={{ fontSize: 12, fill: "hsl(225 15% 55%)" }} />
                          <Tooltip content={<CustomTooltipScatter />} />
                          <Scatter data={scatterData} fill="hsl(250 84% 64%)" name="Funcionários" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[350px] items-center justify-center text-muted-foreground">Sem dados.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass border-border/40">
                  <CardHeader><CardTitle className="font-display text-lg">Comparação entre Setores</CardTitle></CardHeader>
                  <CardContent>
                    {setorChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={setorChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 16%)" />
                          <XAxis dataKey="setor" tick={{ fontSize: 12, fill: "hsl(225 15% 55%)" }} />
                          <YAxis tick={{ fontSize: 12, fill: "hsl(225 15% 55%)" }} />
                          <Tooltip content={<CustomTooltipBar />} />
                          <Legend />
                          <Bar dataKey="% Meta" fill="hsl(250 84% 64%)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="Eficiência %" fill="hsl(185 100% 55%)" radius={[6, 6, 0, 0]} opacity={0.5} />
                          <Bar dataKey="Absenteísmo %" fill="hsl(0 72% 51%)" radius={[6, 6, 0, 0]} opacity={0.5} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[350px] items-center justify-center text-muted-foreground">Sem dados.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
