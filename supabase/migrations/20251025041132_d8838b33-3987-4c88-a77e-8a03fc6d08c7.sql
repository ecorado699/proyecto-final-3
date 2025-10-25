-- Función para verificar si una IP es sospechosa basándose en detecciones ML
CREATE OR REPLACE FUNCTION public.is_ip_suspicious(_ip_address inet)
RETURNS TABLE(
  is_suspicious boolean,
  anomaly_score numeric,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_anomaly RECORD;
  recent_score numeric;
BEGIN
  -- Buscar la detección de anomalía más reciente (últimos 15 minutos)
  SELECT 
    anomaly_score,
    is_anomaly,
    detected_at
  INTO recent_anomaly
  FROM public.anomaly_detections
  WHERE ip_address = _ip_address
    AND detected_at > NOW() - INTERVAL '15 minutes'
    AND status = 'active'
  ORDER BY detected_at DESC
  LIMIT 1;

  -- Si hay una anomalía reciente detectada
  IF recent_anomaly.is_anomaly = true THEN
    RETURN QUERY SELECT 
      true as is_suspicious,
      recent_anomaly.anomaly_score,
      'Patrón de ataque detectado por ML (Isolation Forest)' as reason;
    RETURN;
  END IF;

  -- Si no hay anomalías recientes, permitir el acceso
  RETURN QUERY SELECT 
    false as is_suspicious,
    COALESCE(recent_anomaly.anomaly_score, 0.0) as anomaly_score,
    'Comportamiento normal' as reason;
END;
$$;

-- Función mejorada para registrar intento de login y ejecutar ciclo ML automáticamente
CREATE OR REPLACE FUNCTION public.log_and_analyze_login(_ip_address inet, _email text, _success boolean, _user_agent text)
RETURNS TABLE(
  allowed boolean,
  reason text,
  anomaly_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicion_check RECORD;
BEGIN
  -- Primero verificar si la IP ya está marcada como sospechosa
  SELECT * INTO suspicion_check
  FROM public.is_ip_suspicious(_ip_address);

  -- Si es sospechosa y es un intento fallido, bloquear inmediatamente
  IF suspicion_check.is_suspicious = true AND _success = false THEN
    -- Registrar el intento
    INSERT INTO public.login_attempts (ip_address, email, success, user_agent)
    VALUES (_ip_address, _email, _success, _user_agent);
    
    RETURN QUERY SELECT 
      false as allowed,
      suspicion_check.reason,
      suspicion_check.anomaly_score;
    RETURN;
  END IF;

  -- Registrar el intento
  INSERT INTO public.login_attempts (ip_address, email, success, user_agent)
  VALUES (_ip_address, _email, _success, _user_agent);

  -- Si es exitoso, permitir
  IF _success = true THEN
    RETURN QUERY SELECT 
      true as allowed,
      'Inicio de sesión exitoso' as reason,
      0.0 as anomaly_score;
    RETURN;
  END IF;

  -- Para intentos fallidos de IPs no sospechosas, verificar nuevamente
  SELECT * INTO suspicion_check
  FROM public.is_ip_suspicious(_ip_address);

  RETURN QUERY SELECT 
    NOT suspicion_check.is_suspicious as allowed,
    CASE 
      WHEN suspicion_check.is_suspicious THEN suspicion_check.reason
      ELSE 'Credenciales incorrectas'
    END as reason,
    suspicion_check.anomaly_score;
END;
$$;

-- Crear índice para mejorar el rendimiento de consultas por IP y fecha
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_ip_date 
ON public.anomaly_detections(ip_address, detected_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_date 
ON public.login_attempts(ip_address, attempted_at DESC);

-- Función para limpiar detecciones antiguas (mantener limpia la BD)
CREATE OR REPLACE FUNCTION public.cleanup_old_detections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Marcar como resueltas las detecciones de más de 24 horas
  UPDATE public.anomaly_detections
  SET status = 'resolved'
  WHERE status = 'active'
    AND detected_at < NOW() - INTERVAL '24 hours';
    
  -- Eliminar métricas de más de 7 días
  DELETE FROM public.ip_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;