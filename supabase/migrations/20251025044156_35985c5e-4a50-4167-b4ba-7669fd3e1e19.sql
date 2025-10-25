-- Agregar columna para distinguir datos de prueba
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
ALTER TABLE ip_metrics ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
ALTER TABLE anomaly_detections ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;

-- Marcar datos existentes como de prueba (IPs conocidas de prueba)
UPDATE login_attempts 
SET is_test_data = true 
WHERE ip_address IN (
  '185.220.101.2', '198.98.57.1', '23.129.64.1', '45.155.205.1', 
  '185.220.101.1', '10.0.0.50', '10.0.0.51', '10.0.0.52',
  '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
  '172.16.0.10', '172.16.0.11'
);

UPDATE ip_metrics 
SET is_test_data = true 
WHERE ip_address IN (
  '185.220.101.2', '198.98.57.1', '23.129.64.1', '45.155.205.1', 
  '185.220.101.1', '10.0.0.50', '10.0.0.51', '10.0.0.52',
  '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
  '172.16.0.10', '172.16.0.11'
);

UPDATE anomaly_detections 
SET is_test_data = true 
WHERE ip_address IN (
  '185.220.101.2', '198.98.57.1', '23.129.64.1', '45.155.205.1', 
  '185.220.101.1', '10.0.0.50', '10.0.0.51', '10.0.0.52',
  '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
  '172.16.0.10', '172.16.0.11'
);

-- Vista para IPs sospechosas (solo datos reales)
CREATE OR REPLACE VIEW real_suspicious_ips AS
SELECT 
  ad.ip_address,
  COUNT(*) as detection_count,
  MAX(ad.anomaly_score) as max_anomaly_score,
  MAX(ad.detected_at) as last_detected,
  MAX(ad.status) as status,
  SUM(CASE WHEN ad.is_anomaly THEN 1 ELSE 0 END) as anomaly_count
FROM anomaly_detections ad
WHERE ad.is_test_data = false
GROUP BY ad.ip_address
ORDER BY max_anomaly_score DESC;

-- Función para obtener top IPs sospechosas (solo reales)
CREATE OR REPLACE FUNCTION get_real_suspicious_ips(limit_count integer DEFAULT 10)
RETURNS TABLE(
  ip_address inet,
  detection_count bigint,
  max_anomaly_score numeric,
  last_detected timestamp with time zone,
  status text,
  anomaly_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM real_suspicious_ips
  ORDER BY max_anomaly_score DESC
  LIMIT limit_count;
$$;

-- Función para obtener actividad reciente de login real
CREATE OR REPLACE FUNCTION get_real_login_activity(hours_back integer DEFAULT 24)
RETURNS TABLE(
  ip_address inet,
  total_attempts bigint,
  failed_attempts bigint,
  success_attempts bigint,
  unique_emails bigint,
  first_attempt timestamp with time zone,
  last_attempt timestamp with time zone,
  error_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    la.ip_address,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN la.success = false THEN 1 ELSE 0 END) as failed_attempts,
    SUM(CASE WHEN la.success = true THEN 1 ELSE 0 END) as success_attempts,
    COUNT(DISTINCT la.email) as unique_emails,
    MIN(la.attempted_at) as first_attempt,
    MAX(la.attempted_at) as last_attempt,
    ROUND(
      CAST(SUM(CASE WHEN la.success = false THEN 1 ELSE 0 END) AS numeric) / 
      CAST(COUNT(*) AS numeric) * 100, 
      2
    ) as error_rate
  FROM login_attempts la
  WHERE la.is_test_data = false
    AND la.attempted_at > NOW() - (hours_back || ' hours')::interval
  GROUP BY la.ip_address
  ORDER BY last_attempt DESC;
$$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_login_attempts_is_test 
ON login_attempts(is_test_data, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_ip_metrics_is_test 
ON ip_metrics(is_test_data, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_is_test 
ON anomaly_detections(is_test_data, detected_at DESC);