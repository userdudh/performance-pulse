import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedRow {
  data: string;
  funcionario_id: string;
  nome: string;
  setor: string;
  meta_mensal: number;
  meta_diaria: number;
  producao_dia: number;
  hora_entrada: string;
  hora_saida: string;
  horas_trabalhadas: number;
  status_presenca: string;
}

const EXPECTED_COLUMNS = [
  "data",
  "funcionario_id",
  "nome",
  "setor",
  "meta_mensal",
  "meta_diaria",
  "producao_dia",
  "hora_entrada",
  "hora_saida",
  "horas_trabalhadas",
  "status_presenca",
];

export default function ImportarDados() {
  const { user } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [fileName, setFileName] = useState("");

  const parseDate = (val: string | number): string => {
    if (!val) return "";

    // 1. Lida com números puros de data do Excel
    const num = Number(val);
    if (!isNaN(num) && num > 30000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return date.toISOString().split("T")[0];
    }

    // 2. Lida com textos (do CSV ou Excel)
    const strVal = String(val).trim();

    // Se já estiver no formato correto YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return strVal;

    const delimiter = strVal.includes("/") ? "/" : "-";
    const parts = strVal.split(delimiter);

    if (parts.length === 3) {
      let d, m, y;

      // Se começar com o Ano (ex: 2025-30-11)
      if (parts[0].length === 4) {
        y = parts[0];
        if (Number(parts[1]) > 12) {
          // O mês veio no lugar do dia
          d = parts[1];
          m = parts[2];
        } else {
          m = parts[1];
          d = parts[2];
        }
      }
      // Se terminar com o Ano (ex: 30-11-2025 ou 11-30-2025)
      else {
        y = parts[2];
        if (Number(parts[1]) > 12) {
          // O mês está no início (MM-DD-YYYY)
          m = parts[0];
          d = parts[1];
        } else {
          // Padrão normal (DD-MM-YYYY)
          d = parts[0];
          m = parts[1];
        }
      }

      y = y.length === 2 ? `20${y}` : y;
      return `${y.padStart(4, "20")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    return strVal; // Retorna como veio se não conseguir identificar
  };

  const parseFile = useCallback((file: File) => {
    setErrors([]);
    setParsedData([]);
    setImported(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { raw: true });

        if (json.length === 0) {
          setErrors(["A planilha está vazia."]);
          return;
        }

        const cols = Object.keys(json[0]).map((c) => c.toLowerCase().trim());
        const missing = EXPECTED_COLUMNS.filter((c) => !cols.includes(c));
        if (missing.length > 0) {
          setErrors([`Colunas faltando: ${missing.join(", ")}`]);
          return;
        }

        const errs: string[] = [];
        const rows: ParsedRow[] = json.map((row, i) => {
          const normalize = (key: string) => {
            const found = Object.keys(row).find((k) => k.toLowerCase().trim() === key);
            return found ? String(row[found] ?? "").trim() : "";
          };

          const dataVal = normalize("data");
          const funcId = normalize("funcionario_id");
          const nome = normalize("nome");

          if (!dataVal) errs.push(`Linha ${i + 2}: campo "data" vazio`);
          if (!funcId) errs.push(`Linha ${i + 2}: campo "funcionario_id" vazio`);
          if (!nome) errs.push(`Linha ${i + 2}: campo "nome" vazio`);

          return {
            data: parseDate(dataVal),
            funcionario_id: funcId,
            nome,
            setor: normalize("setor"),
            meta_mensal: parseFloat(normalize("meta_mensal")) || 0,
            meta_diaria: parseFloat(normalize("meta_diaria")) || 0,
            producao_dia: parseFloat(normalize("producao_dia")) || 0,
            hora_entrada: normalize("hora_entrada"),
            hora_saida: normalize("hora_saida"),
            horas_trabalhadas: parseFloat(normalize("horas_trabalhadas")) || 0,
            status_presenca: normalize("status_presenca") || "Presente",
          };
        });

        if (errs.length > 5) {
          setErrors([...errs.slice(0, 5), `...e mais ${errs.length - 5} erros`]);
        } else {
          setErrors(errs);
        }

        setParsedData(rows);
        toast.success(`${rows.length} registros lidos da planilha`);
      } catch {
        setErrors(["Erro ao ler o arquivo. Verifique se é um Excel ou CSV válido."]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = async () => {
    if (!user || parsedData.length === 0) return;
    setImporting(true);

    try {
      const BATCH_SIZE = 200;
      for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
        const batch = parsedData.slice(i, i + BATCH_SIZE).map((r) => ({
          ...r,
          user_id: user.id,
        }));

        const { error } = await supabase.from("registros_diarios").upsert(batch as any, {
          onConflict: "data,funcionario_id,user_id",
        });

        if (error) throw error;
      }

      setImported(true);
      toast.success(`${parsedData.length} registros importados com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja apagar TODOS os dados importados?")) return;
    const { error } = await supabase.from("registros_diarios").delete().eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Todos os dados foram apagados.");
      setParsedData([]);
      setImported(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Importar Dados</h1>
            <p className="text-sm text-muted-foreground">Importe sua planilha com dados diários de produção</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Limpar Dados
          </Button>
        </div>

        <Card className="glass border-border/40">
          <CardContent className="p-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-muted/10 p-16 text-center transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 cursor-pointer group"
            >
              <div className="rounded-xl bg-primary/10 p-4 transition-transform group-hover:scale-110">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">Arraste e solte sua planilha aqui</p>
              <p className="mt-1 text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
              <label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
                <Button variant="outline" asChild className="mt-4 border-border/50">
                  <span className="cursor-pointer">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Selecionar Arquivo
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="font-display text-base">Formato Esperado da Planilha</CardTitle>
            <CardDescription>A planilha deve conter as seguintes colunas (case-insensitive):</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EXPECTED_COLUMNS.map((col) => (
                <Badge
                  key={col}
                  variant="secondary"
                  className={`bg-primary/10 text-primary border border-primary/20 ${col === "status_presenca" ? "ring-2 ring-warning/50" : ""}`}
                >
                  {col} {col === "status_presenca" && "⭐"}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              ⭐ <strong>status_presenca</strong>: Valores aceitos: "Presente", "Falta Justificada", "Falta
              Injustificada", "Atraso"
            </p>
          </CardContent>
        </Card>

        {errors.length > 0 && (
          <Card className="border-destructive/50 glass">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {parsedData.length > 0 && (
          <Card className="glass border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-base">Pré-visualização: {fileName}</CardTitle>
                  <CardDescription>{parsedData.length} registros prontos para importar</CardDescription>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing || imported}
                  className="gradient-bg text-primary-foreground"
                >
                  {imported ? "✓ Importado" : importing ? "Importando..." : "Importar Dados"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-muted-foreground">Data</TableHead>
                      <TableHead className="text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-muted-foreground">Setor</TableHead>
                      <TableHead className="text-muted-foreground">Produção</TableHead>
                      <TableHead className="text-muted-foreground">Horas</TableHead>
                      <TableHead className="text-muted-foreground">Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 20).map((r, i) => (
                      <TableRow key={i} className="border-border/20">
                        <TableCell className="text-sm">{r.data}</TableCell>
                        <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.setor}</TableCell>
                        <TableCell className="text-sm">{r.producao_dia}</TableCell>
                        <TableCell className="text-sm">{r.horas_trabalhadas}h</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              r.status_presenca.includes("Injustificada")
                                ? "bg-destructive/20 text-destructive"
                                : r.status_presenca.includes("Justificada")
                                  ? "bg-warning/20 text-warning"
                                  : r.status_presenca === "Atraso"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-success/20 text-success"
                            }
                          >
                            {r.status_presenca}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 20 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    ...e mais {parsedData.length - 20} registros
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
