CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  channel_slack boolean NOT NULL DEFAULT false,
  channel_email boolean NOT NULL DEFAULT false,
  channel_sms boolean NOT NULL DEFAULT false,
  recipient_titles text[] NOT NULL DEFAULT '{}',
  recipient_ids uuid[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view alert rules"
  ON public.alert_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert alert rules"
  ON public.alert_rules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alert rules"
  ON public.alert_rules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alert rules"
  ON public.alert_rules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the default rules so the page isn't empty on first load
INSERT INTO public.alert_rules (title, description, priority, channel_slack, channel_email, channel_sms, recipient_titles, enabled, position) VALUES
  ('Very negative call', 'Sentiment below -0.5', 'Urgent', true, false, true, ARRAY['COO'], true, 0),
  ('Churn signal detected', 'Caller mentions leaving / other providers', 'Urgent', true, false, true, ARRAY['COO','Manager'], true, 1),
  ('Tier 1 negative call', 'Any negative call from a Key account', 'High', true, false, false, ARRAY['Manager'], true, 2),
  ('Repeat complaint', 'Same account, 2nd negative call in 7 days', 'High', true, true, false, ARRAY['Manager'], true, 3),
  ('Positive standout', 'Sentiment above 0.7 (for recognition)', 'Low', false, true, false, ARRAY['Manager'], false, 4);