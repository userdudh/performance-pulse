CREATE TABLE public.registros_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  funcionario_id text NOT NULL,
  nome text NOT NULL,
  setor text NOT NULL,
  meta_mensal numeric NOT NULL DEFAULT 0,
  meta_diaria numeric NOT NULL DEFAULT 0,
  producao_dia numeric NOT NULL DEFAULT 0,
  hora_entrada text,
  hora_saida text,
  horas_trabalhadas numeric NOT NULL DEFAULT 0,
  status_presenca text DEFAULT 'Presente',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(data, funcionario_id, user_id)
);

ALTER TABLE public.registros_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON public.registros_diarios FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own records" ON public.registros_diarios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own records" ON public.registros_diarios FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own records" ON public.registros_diarios FOR DELETE TO authenticated USING (user_id = auth.uid());