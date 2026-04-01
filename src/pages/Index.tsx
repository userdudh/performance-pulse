import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Brain, Users, ArrowRight, Shield, Zap, LineChart, Target, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const stats = [
  { value: "3 Níveis", label: "de Análise", sub: "Individual · Equipe · Fábrica" },
  { value: "Real-time", label: "Monitoramento", sub: "Alertas automáticos" },
  { value: "What-If", label: "Simulações", sub: "Cenários preditivos" },
  { value: "100%", label: "Seguro", sub: "Dados isolados por usuário" },
];

const features = [
  {
    icon: TrendingUp,
    title: "Análise de Impacto",
    desc: "Quantifique exatamente como a ausência de um funcionário afeta a produção da equipe e do setor inteiro.",
    color: "from-primary to-secondary",
  },
  {
    icon: Brain,
    title: "Inteligência Operacional",
    desc: "Insights automáticos identificam gargalos, sugerem realocações e geram alertas antes que problemas se agravem.",
    color: "from-secondary to-[hsl(var(--neon-cyan))]",
  },
  {
    icon: Users,
    title: "Drill-Down Completo",
    desc: "Navegue da visão geral da fábrica até o funcionário individual com métricas detalhadas em cada nível.",
    color: "from-[hsl(var(--neon-cyan))] to-primary",
  },
  {
    icon: Target,
    title: "Metas & Eficiência",
    desc: "Acompanhe % de meta atingida, eficiência por hora trabalhada e saldo de horas de cada colaborador.",
    color: "from-primary to-[hsl(var(--neon-purple))]",
  },
  {
    icon: AlertTriangle,
    title: "Absenteísmo Inteligente",
    desc: "Detecte padrões de faltas e atrasos que comprometem a operação antes que se tornem críticos.",
    color: "from-[hsl(var(--warning))] to-[hsl(var(--destructive))]",
  },
  {
    icon: LineChart,
    title: "Simulação What-If",
    desc: "Simule cenários de ausência e veja em tempo real o impacto estimado na produção de cada setor.",
    color: "from-[hsl(var(--neon-blue))] to-secondary",
  },
];

const workflow = [
  { step: "01", icon: Zap, title: "Importe seus dados", desc: "Upload via planilha Excel com dados de produção, presença e metas." },
  { step: "02", icon: BarChart3, title: "Visualize métricas", desc: "Dashboard interativo com KPIs, gráficos e filtros por mês e setor." },
  { step: "03", icon: Brain, title: "Receba insights", desc: "O sistema analisa padrões e gera alertas e sugestões automaticamente." },
  { step: "04", icon: Shield, title: "Tome decisões", desc: "Use simulações what-if para planejar realocações e reduzir riscos." },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg glow-sm">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground tracking-tight">PerformanceHub</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => navigate("/auth")} variant="outline" className="border-border/50 text-foreground hover:bg-muted/50">
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 text-center">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Gestão de desempenho baseada em dados</span>
          </motion.div>
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text leading-[1.1] max-w-4xl mx-auto"
          >
            Descubra o impacto real de cada colaborador na sua operação
          </motion.h1>
          <motion.p
            {...fadeUp(0.2)}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Rastreie a correlação de produtividade em três níveis — individual, equipe e fábrica. Identifique gargalos, simule cenários e otimize sua operação com inteligência.
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate("/auth")} size="lg" className="gradient-bg text-primary-foreground glow-md text-base px-8 h-12">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => {
              document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
            }} variant="outline" size="lg" className="border-border/50 text-foreground h-12 px-8 text-base">
              Como Funciona
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/40 bg-card/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={i} {...fadeUp(0.1 * i)} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text font-display">{s.value}</div>
                <div className="text-sm font-medium text-foreground mt-1">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Tudo que você precisa para{" "}
            <span className="gradient-text">gestão inteligente</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Ferramentas poderosas que transformam dados brutos em decisões estratégicas para sua operação.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fadeUp(0.08 * i)}
              className="group glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:glow-sm"
            >
              <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-y border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Como <span className="gradient-text">funciona</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Em quatro passos simples, transforme seus dados em vantagem competitiva.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((w, i) => (
              <motion.div key={i} {...fadeUp(0.1 * i)} className="relative">
                <div className="text-5xl font-black text-primary/10 font-display absolute -top-2 -left-1">{w.step}</div>
                <div className="relative pt-8 pl-1">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mb-4">
                    <w.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground">{w.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
        <motion.div
          {...fadeUp()}
          className="relative overflow-hidden rounded-3xl gradient-bg p-10 sm:p-16 text-center glow-lg"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              Pronto para otimizar sua operação?
            </h2>
            <p className="mt-4 text-white/80 max-w-lg mx-auto">
              Comece gratuitamente. Importe seus dados e descubra insights que transformam resultados.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8 text-base"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-bg">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">PerformanceHub</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PerformanceHub. Gestão de desempenho inteligente.
          </p>
        </div>
      </footer>
    </div>
  );
}
