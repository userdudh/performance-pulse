import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Brain, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen dot-pattern flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg glow-sm">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">PerformanceHub</span>
        </div>
        <Button onClick={() => navigate("/auth")} variant="outline" className="border-border/50 text-foreground hover:bg-muted/50">
          Entrar
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-bold gradient-text leading-tight"
          >
            Gestão de Desempenho Inteligente
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Rastreie a correlação de produtividade em três níveis: individual, equipe e fábrica. Identifique gargalos e otimize sua operação.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Button onClick={() => navigate("/auth")} size="lg" className="gradient-bg text-primary-foreground glow-md">
              Começar Agora
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { icon: TrendingUp, title: "Análise de Impacto", desc: "Quantifique como a ausência de um funcionário afeta a equipe" },
              { icon: Brain, title: "Inteligência Operacional", desc: "Insights automáticos, alertas e simulações what-if" },
              { icon: Users, title: "Drill-Down Completo", desc: "Navegue de empresa até funcionário com dados detalhados" },
            ].map((f, i) => (
              <div key={i} className="glass rounded-xl p-6 text-left hover:border-primary/20 transition-colors">
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
