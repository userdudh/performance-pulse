import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Users } from "lucide-react";
import { FuncionarioModal } from "@/components/FuncionarioModal";
import {
  RegistroDiario, FuncionarioMetrics, calcFuncionarioMetrics, getMonthOptions, getSetorOptions,
} from "@/lib/calculations";

export default function Funcionarios() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFunc, setSelectedFunc] = useState<FuncionarioMetrics | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
  const setorOptions = useMemo(() => getSetorOptions(registros), [registros]);

  const filtered = useMemo(() => {
    return registros.filter(r => {
      const matchMonth = !filtroMes || r.data.startsWith(filtroMes);
      const matchSetor = filtroSetor === "all" || r.setor === filtroSetor;
      return matchMonth && matchSetor;
    });
  }, [registros, filtroMes, filtroSetor]);

  const funcMetrics = useMemo(() => {
    const metrics = calcFuncionarioMetrics(filtered);
    if (!search) return metrics;
    return metrics.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
  }, [filtered, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verde": return <Badge className="bg-success/20 text-success border border-success/30">🟢 &gt;90%</Badge>;
      case "amarelo": return <Badge className="bg-warning/20 text-warning border border-warning/30">🟡 70-90%</Badge>;
      default: return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">🔴 &lt;70%</Badge>;
    }
  };

  const getRowHighlight = (status: string) => {
    switch (status) {
      case "verde": return "border-l-2 border-l-success/50";
      case "amarelo": return "border-l-2 border-l-warning/50";
      default: return "border-l-2 border-l-destructive/50";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Hierarquia: Empresa → Setor → Equipe → Funcionário</p>
        </div>

        <Card className="glass border-border/40">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-muted/50 border-border/50" />
              </div>
              <Select value={filtroMes} onValueChange={setFiltroMes}>
                <SelectTrigger className="w-40 bg-muted/50 border-border/50"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>{monthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger className="w-44 bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {setorOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Setor</TableHead>
                    <TableHead className="text-muted-foreground">Produção</TableHead>
                    <TableHead className="text-muted-foreground">% Meta</TableHead>
                    <TableHead className="text-muted-foreground">Horas</TableHead>
                    <TableHead className="text-muted-foreground">Eficiência</TableHead>
                    <TableHead className="text-muted-foreground">Absenteísmo</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcMetrics.length > 0 ? funcMetrics.sort((a, b) => b.pct_meta - a.pct_meta).map(f => (
                    <TableRow
                      key={f.funcionario_id}
                      onClick={() => { setSelectedFunc(f); setModalOpen(true); }}
                      className={`border-border/20 hover:bg-muted/40 transition-colors cursor-pointer ${getRowHighlight(f.status)}`}
                    >
                      <TableCell className="font-medium text-foreground py-3">{f.nome}</TableCell>
                      <TableCell className="text-muted-foreground py-3">{f.setor}</TableCell>
                      <TableCell className="py-3">{Number(f.producao_total.toFixed(3)).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(f.pct_meta, 100)} className="h-2 w-16" />
                          <span className="text-xs font-medium">{f.pct_meta.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{f.horas_trabalhadas.toFixed(1)}h</TableCell>
                      <TableCell className={`font-medium py-3 ${f.eficiencia_tempo >= 90 ? "text-success" : f.eficiencia_tempo >= 70 ? "text-warning" : "text-destructive"}`}>
                        {f.eficiencia_tempo.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`py-3 ${f.taxa_absenteismo > 15 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {f.taxa_absenteismo.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-3">{getStatusBadge(f.status)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        Nenhum dado encontrado. Importe uma planilha primeiro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <FuncionarioModal open={modalOpen} onOpenChange={setModalOpen} funcionario={selectedFunc} registros={registros} />
    </AppLayout>
  );
}
