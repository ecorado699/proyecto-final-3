-- Create table for IP metrics (collected every minute)
CREATE TABLE IF NOT EXISTS public.ip_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_end timestamp with time zone NOT NULL,
  requests_per_minute integer NOT NULL DEFAULT 0,
  failed_attempts integer NOT NULL DEFAULT 0,
  success_attempts integer NOT NULL DEFAULT 0,
  error_ratio numeric NOT NULL DEFAULT 0,
  avg_time_between_requests numeric,
  min_time_between_requests numeric,
  max_time_between_requests numeric,
  unique_emails_tried integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ip_address, window_start)
);

-- Create table for anomaly detections
CREATE TABLE IF NOT EXISTS public.anomaly_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  anomaly_score numeric NOT NULL,
  is_anomaly boolean NOT NULL DEFAULT false,
  metrics jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_positive')),
  resolved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table to store the trained model parameters
CREATE TABLE IF NOT EXISTS public.ml_model_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type text NOT NULL DEFAULT 'isolation_forest',
  training_data jsonb NOT NULL,
  parameters jsonb NOT NULL,
  trained_at timestamp with time zone NOT NULL DEFAULT now(),
  metrics_summary jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ip_metrics_ip_time ON public.ip_metrics(ip_address, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_ip ON public.anomaly_detections(ip_address, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_status ON public.anomaly_detections(status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON public.login_attempts(attempted_at DESC);

-- Enable RLS
ALTER TABLE public.ip_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ip_metrics
CREATE POLICY "Super admins can view IP metrics"
  ON public.ip_metrics FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "System can insert IP metrics"
  ON public.ip_metrics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for anomaly_detections
CREATE POLICY "Super admins can view anomalies"
  ON public.anomaly_detections FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "Super admins can update anomalies"
  ON public.anomaly_detections FOR UPDATE
  USING (has_role_or_higher(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "System can insert anomalies"
  ON public.anomaly_detections FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ml_model_state
CREATE POLICY "Super admins can view ML models"
  ON public.ml_model_state FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "System can manage ML models"
  ON public.ml_model_state FOR ALL
  USING (true);

-- Function to get top suspicious IPs
CREATE OR REPLACE FUNCTION public.get_top_suspicious_ips(limit_count integer DEFAULT 10)
RETURNS TABLE (
  ip_address inet,
  anomaly_count bigint,
  last_detected timestamp with time zone,
  avg_anomaly_score numeric,
  total_failed_attempts bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.ip_address,
    COUNT(ad.id) as anomaly_count,
    MAX(ad.detected_at) as last_detected,
    AVG(ad.anomaly_score) as avg_anomaly_score,
    COALESCE(SUM(la.failed_count), 0) as total_failed_attempts
  FROM public.anomaly_detections ad
  LEFT JOIN (
    SELECT ip_address, COUNT(*) as failed_count
    FROM public.login_attempts
    WHERE success = false
    GROUP BY ip_address
  ) la ON la.ip_address = ad.ip_address
  WHERE ad.is_anomaly = true
    AND ad.status = 'active'
  GROUP BY ad.ip_address
  ORDER BY anomaly_count DESC, avg_anomaly_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;