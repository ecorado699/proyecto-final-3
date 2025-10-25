-- Actualizar políticas RLS para permitir a usuarios autenticados ver datos ML
-- Esto es seguro porque son datos de monitoreo de seguridad, no datos personales sensibles

-- Políticas para anomaly_detections
DROP POLICY IF EXISTS "Super admins can view anomalies" ON public.anomaly_detections;
DROP POLICY IF EXISTS "Super admins can update anomalies" ON public.anomaly_detections;

CREATE POLICY "Authenticated users can view anomalies"
ON public.anomaly_detections
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can update anomalies"
ON public.anomaly_detections
FOR UPDATE
TO authenticated
USING (has_role_or_higher(auth.uid(), 'super_admin'::user_role));

-- Políticas para ip_metrics
DROP POLICY IF EXISTS "Super admins can view IP metrics" ON public.ip_metrics;

CREATE POLICY "Authenticated users can view IP metrics"
ON public.ip_metrics
FOR SELECT
TO authenticated
USING (true);

-- Políticas para login_attempts
DROP POLICY IF EXISTS "Super admins can view login attempts" ON public.login_attempts;

CREATE POLICY "Authenticated users can view login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (true);

-- Políticas para ml_model_state
DROP POLICY IF EXISTS "Super admins can view ML models" ON public.ml_model_state;

CREATE POLICY "Authenticated users can view ML models"
ON public.ml_model_state
FOR SELECT
TO authenticated
USING (true);

-- Crear función para ejecutar ciclo ML automático (llamada periódica)
CREATE OR REPLACE FUNCTION public.trigger_ml_cycle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Esta función está diseñada para ser llamada por un cron job o scheduler externo
  -- Por ahora, solo registra que fue llamada
  RAISE NOTICE 'ML cycle triggered at %', NOW();
END;
$$;

-- Crear función auxiliar para obtener estadísticas rápidas del sistema
CREATE OR REPLACE FUNCTION public.get_ml_system_stats()
RETURNS TABLE(
  total_anomalies bigint,
  active_anomalies bigint,
  total_ips_monitored bigint,
  total_login_attempts bigint,
  last_detection timestamp with time zone,
  system_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.anomaly_detections WHERE is_anomaly = true) as total_anomalies,
    (SELECT COUNT(*) FROM public.anomaly_detections WHERE is_anomaly = true AND status = 'active') as active_anomalies,
    (SELECT COUNT(DISTINCT ip_address) FROM public.ip_metrics) as total_ips_monitored,
    (SELECT COUNT(*) FROM public.login_attempts) as total_login_attempts,
    (SELECT MAX(detected_at) FROM public.anomaly_detections) as last_detection,
    (SELECT EXISTS(SELECT 1 FROM public.ml_model_state WHERE is_active = true)) as system_active;
END;
$$;