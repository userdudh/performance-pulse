export interface RegistroDiario {
  id: string;
  data: string;
  funcionario_id: string;
  nome: string;
  setor: string;
  meta_mensal: number;
  meta_diaria: number;
  producao_dia: number;
  hora_entrada: string | null;
  hora_saida: string | null;
  horas_trabalhadas: number;
  status_presenca: string | null;
  user_id: string;
  created_at: string;
}

export interface FuncionarioMetrics {
  funcionario_id: string;
  nome: string;
  setor: string;
  producao_total: number;
  meta_mensal: number;
  horas_trabalhadas: number;
  carga_horaria_mensal: number;
  pct_meta: number;
  eficiencia_tempo: number;
  saldo_horas: number;
  dias_trabalhados: number;
  dias_falta_justificada: number;
  dias_falta_injustificada: number;
  dias_atraso: number;
  taxa_absenteismo: number;
  status: "verde" | "amarelo" | "vermelho";
}

export interface SetorMetrics {
  setor: string;
  producao_total: number;
  media_pct_meta: number;
  media_eficiencia: number;
  total_funcionarios: number;
  taxa_absenteismo_media: number;
}

export interface DependenciaColetiva {
  funcionario_id: string;
  nome: string;
  setor: string;
  impacto_pct: number;
  dias_ausente: number;
  producao_equipe_com: number;
  producao_equipe_sem: number;
}

export interface Insight {
  tipo: "danger" | "warning" | "success" | "info";
  titulo: string;
  descricao: string;
}

const CARGA_HORARIA_MENSAL = 220;

export function calcFuncionarioMetrics(registros: RegistroDiario[]): FuncionarioMetrics[] {
  const grouped = new Map<string, RegistroDiario[]>();
  registros.forEach((r) => {
    const key = r.funcionario_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  return Array.from(grouped.entries()).map(([funcionario_id, regs]) => {
    const nome = regs[0].nome;
    const setor = regs[0].setor;

    const meta_mensal = regs.reduce((a, r) => a + (Number(r.meta_diaria) || 0), 0);
    const producao_total = regs.reduce((a, r) => a + (Number(r.producao_dia) || 0), 0);
    const horas_trabalhadas = regs.reduce((a, r) => a + (Number(r.horas_trabalhadas) || 0), 0);
    const carga_horaria_mensal = regs.length * 8;

    const dias_falta_justificada = regs.filter((r) => r.status_presenca?.toLowerCase() === "falta justificada").length;
    const dias_falta_injustificada = regs.filter(
      (r) => r.status_presenca?.toLowerCase() === "falta injustificada",
    ).length;
    const dias_atraso = regs.filter((r) => r.status_presenca?.toLowerCase() === "atraso").length;
    const total_dias = regs.length;
    const taxa_absenteismo =
      total_dias > 0 ? ((dias_falta_justificada + dias_falta_injustificada) / total_dias) * 100 : 0;

    const pct_meta = meta_mensal > 0 ? (producao_total / meta_mensal) * 100 : 0;
    const eficiencia_tempo = carga_horaria_mensal > 0 ? (horas_trabalhadas / carga_horaria_mensal) * 100 : 0;
    const saldo_horas = horas_trabalhadas - carga_horaria_mensal;
    const score = pct_meta * 0.7 + eficiencia_tempo * 0.3;

    let status: "verde" | "amarelo" | "vermelho" = "verde";
    if (pct_meta < 70) status = "vermelho";
    else if (pct_meta < 90) status = "amarelo";

    return {
      funcionario_id,
      nome,
      setor,
      producao_total,
      meta_mensal,
      horas_trabalhadas,
      carga_horaria_mensal,
      pct_meta,
      eficiencia_tempo,
      saldo_horas,
      score,
      dias_trabalhados: total_dias,
      dias_falta_justificada,
      dias_falta_injustificada,
      dias_atraso,
      taxa_absenteismo,
      status,
    };
  });
}

export function calcSetorMetrics(funcMetrics: FuncionarioMetrics[]): SetorMetrics[] {
  const grouped = new Map<string, FuncionarioMetrics[]>();
  funcMetrics.forEach((f) => {
    if (!grouped.has(f.setor)) grouped.set(f.setor, []);
    grouped.get(f.setor)!.push(f);
  });

  return Array.from(grouped.entries()).map(([setor, funcs]) => ({
    setor,
    producao_total: funcs.reduce((a, f) => a + f.producao_total, 0),
    media_pct_meta: funcs.reduce((a, f) => a + f.pct_meta, 0) / funcs.length,
    media_eficiencia: funcs.reduce((a, f) => a + f.eficiencia_tempo, 0) / funcs.length,
    media_score: funcs.reduce((a, f) => a + f.score, 0) / funcs.length,
    total_funcionarios: funcs.length,
    taxa_absenteismo_media: funcs.reduce((a, f) => a + f.taxa_absenteismo, 0) / funcs.length,
  }));
}

export function calcDependenciaColetiva(registros: RegistroDiario[]): DependenciaColetiva[] {
  const setores = new Map<string, RegistroDiario[]>();
  registros.forEach((r) => {
    if (!setores.has(r.setor)) setores.set(r.setor, []);
    setores.get(r.setor)!.push(r);
  });

  const resultados: DependenciaColetiva[] = [];

  setores.forEach((regsSetor, setor) => {
    const funcionarios = new Map<string, RegistroDiario[]>();
    regsSetor.forEach((r) => {
      if (!funcionarios.has(r.funcionario_id)) funcionarios.set(r.funcionario_id, []);
      funcionarios.get(r.funcionario_id)!.push(r);
    });

    const prodPorDia = new Map<string, number>();
    regsSetor.forEach((r) => {
      prodPorDia.set(r.data, (prodPorDia.get(r.data) || 0) + (Number(r.producao_dia) || 0));
    });

    const totalDias = prodPorDia.size;
    const prodMediaDiaria = totalDias > 0 ? Array.from(prodPorDia.values()).reduce((a, b) => a + b, 0) / totalDias : 0;

    funcionarios.forEach((regsFunc, funcId) => {
      const diasPresente = new Set(
        regsFunc
          .filter(
            (r) =>
              !r.status_presenca ||
              r.status_presenca.toLowerCase() === "presente" ||
              r.status_presenca.toLowerCase() === "atraso",
          )
          .map((r) => r.data),
      );

      const diasAusente = new Set(
        regsFunc.filter((r) => r.status_presenca?.toLowerCase().includes("falta")).map((r) => r.data),
      );

      if (diasAusente.size === 0) return;

      let prodComFunc = 0,
        diasCom = 0;
      let prodSemFunc = 0,
        diasSem = 0;

      prodPorDia.forEach((prod, dia) => {
        if (diasPresente.has(dia)) {
          prodComFunc += prod;
          diasCom++;
        } else if (diasAusente.has(dia)) {
          prodSemFunc += prod;
          diasSem++;
        }
      });

      const mediaCom = diasCom > 0 ? prodComFunc / diasCom : prodMediaDiaria;
      const mediaSem = diasSem > 0 ? prodSemFunc / diasSem : prodMediaDiaria;
      const impacto = mediaCom > 0 ? ((mediaCom - mediaSem) / mediaCom) * 100 : 0;

      resultados.push({
        funcionario_id: funcId,
        nome: regsFunc[0].nome,
        setor,
        impacto_pct: Math.max(0, impacto),
        dias_ausente: diasAusente.size,
        producao_equipe_com: mediaCom,
        producao_equipe_sem: mediaSem,
      });
    });
  });

  return resultados.sort((a, b) => b.impacto_pct - a.impacto_pct);
}

export function simulateWhatIf(
  registros: RegistroDiario[],
  funcionariosAusentes: string[],
): { setor: string; producao_original: number; producao_estimada: number; queda_pct: number }[] {
  const setores = new Map<string, RegistroDiario[]>();
  registros.forEach((r) => {
    if (!setores.has(r.setor)) setores.set(r.setor, []);
    setores.get(r.setor)!.push(r);
  });

  const resultado: { setor: string; producao_original: number; producao_estimada: number; queda_pct: number }[] = [];

  setores.forEach((regsSetor, setor) => {
    const prodTotal = regsSetor.reduce((a, r) => a + (Number(r.producao_dia) || 0), 0);
    const prodAusentes = regsSetor
      .filter((r) => funcionariosAusentes.includes(r.funcionario_id))
      .reduce((a, r) => a + (Number(r.producao_dia) || 0), 0);

    const prodEstimada = prodTotal - prodAusentes;
    const queda = prodTotal > 0 ? ((prodTotal - prodEstimada) / prodTotal) * 100 : 0;

    resultado.push({
      setor,
      producao_original: prodTotal,
      producao_estimada: prodEstimada,
      queda_pct: queda,
    });
  });

  return resultado;
}

export function generateInsights(funcMetrics: FuncionarioMetrics[], setorMetrics: SetorMetrics[]): Insight[] {
  const insights: Insight[] = [];

  const muitasHorasBaixaProd = funcMetrics.filter((f) => f.eficiencia_tempo > 90 && f.pct_meta < 70);
  if (muitasHorasBaixaProd.length > 0) {
    insights.push({
      tipo: "danger",
      titulo: "⚠️ Muitas horas, baixa produção",
      descricao: `${muitasHorasBaixaProd.map((f) => f.nome).join(", ")} trabalham muitas horas mas têm produtividade abaixo de 70%. Pode indicar ineficiência operacional.`,
    });
  }

  const altaProdMenosHoras = funcMetrics.filter((f) => f.pct_meta >= 90 && f.eficiencia_tempo < 80);
  if (altaProdMenosHoras.length > 0) {
    insights.push({
      tipo: "success",
      titulo: "🌟 Alta produtividade com menos horas",
      descricao: `${altaProdMenosHoras.map((f) => f.nome).join(", ")} atingem metas acima de 90% com menos horas que o esperado.`,
    });
  }

  const setoresBaixos = setorMetrics.filter((s) => s.media_score < 60);
  if (setoresBaixos.length > 0) {
    insights.push({
      tipo: "warning",
      titulo: "📉 Setores com baixa eficiência",
      descricao: `${setoresBaixos.map((s) => s.setor).join(", ")} apresentam score médio abaixo de 60%.`,
    });
  }

  const setoresAltos = setorMetrics.filter((s) => s.media_score >= 85);
  if (setoresAltos.length > 0) {
    insights.push({
      tipo: "success",
      titulo: "🏆 Setores com alta performance",
      descricao: `${setoresAltos.map((s) => s.setor).join(", ")} mantêm score médio acima de 85%.`,
    });
  }

  const criticos = funcMetrics.filter((f) => f.status === "vermelho");
  if (criticos.length > 0) {
    insights.push({
      tipo: "danger",
      titulo: `🔴 ${criticos.length} funcionário(s) abaixo de 70% da meta`,
      descricao: `${criticos.map((f) => `${f.nome} (${f.pct_meta.toFixed(0)}%)`).join(", ")}`,
    });
  }

  const altoAbsenteismo = funcMetrics.filter((f) => f.taxa_absenteismo > 15);
  if (altoAbsenteismo.length > 0) {
    insights.push({
      tipo: "warning",
      titulo: "📋 Alto absenteísmo detectado",
      descricao: `${altoAbsenteismo.map((f) => `${f.nome} (${f.taxa_absenteismo.toFixed(0)}%)`).join(", ")} apresentam taxa de absenteísmo acima de 15%.`,
    });
  }

  // Sugestão de realocação
  const funcionariosComImpacto = funcMetrics.filter((f) => f.status === "vermelho" && f.taxa_absenteismo > 10);
  if (funcionariosComImpacto.length > 0) {
    const porSetor = new Map<string, string[]>();
    funcionariosComImpacto.forEach((f) => {
      if (!porSetor.has(f.setor)) porSetor.set(f.setor, []);
      porSetor.get(f.setor)!.push(f.nome);
    });
    porSetor.forEach((nomes, setor) => {
      insights.push({
        tipo: "info",
        titulo: `💡 Sugestão de realocação - ${setor}`,
        descricao: `${nomes.join(", ")} apresentam baixa produção e alto absenteísmo. Considere remanejamento para reduzir impacto no setor.`,
      });
    });
  }

  return insights;
}

export function getMonthOptions(registros: RegistroDiario[]): string[] {
  const months = new Set<string>();
  registros.forEach((r) => months.add(r.data.substring(0, 7)));
  return Array.from(months).sort().reverse();
}

export function getSetorOptions(registros: RegistroDiario[]): string[] {
  const setores = new Set<string>();
  registros.forEach((r) => setores.add(r.setor));
  return Array.from(setores).sort();
}

export function getFuncionarioOptions(registros: RegistroDiario[]): { id: string; nome: string }[] {
  const map = new Map<string, string>();
  registros.forEach((r) => map.set(r.funcionario_id, r.nome));
  return Array.from(map.entries())
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}
