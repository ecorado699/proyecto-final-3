import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';

export function MLSecurityBanner() {
  const [securityStatus, setSecurityStatus] = useState<{
    isProtected: boolean;
    activeThreats: number;
    lastCheck: Date;
    hasData: boolean;
  } | null>(null);

  useEffect(() => {
    checkSecurityStatus();
    const interval = setInterval(checkSecurityStatus, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const { data: anomalies } = await supabase
        .from('anomaly_detections')
        .select('id')
        .eq('is_anomaly', true)
        .eq('status', 'active');

      const { data: metrics } = await supabase
        .from('ip_metrics')
        .select('id')
        .limit(1);

      const hasData = (metrics && metrics.length > 0) || (anomalies && anomalies.length > 0);

      setSecurityStatus({
        isProtected: hasData,
        activeThreats: anomalies?.length || 0,
        lastCheck: new Date(),
        hasData
      });
    } catch (error) {
      console.error('Error checking security status:', error);
    }
  };

  if (!securityStatus) return null;

  // Si no hay datos, mostrar mensaje de inicialización
  if (!securityStatus.hasData) {
    return (
      <Alert className="border-warning">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle>
            Sistema de Protección ML: Pendiente de Inicialización
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          El sistema requiere datos iniciales para comenzar a proteger tu aplicación. 
          Ve a la pestaña "Detección ML" y sigue las instrucciones para inicializar.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={securityStatus.activeThreats > 0 ? 'border-destructive' : 'border-success'}>
      <div className="flex items-center gap-2">
        {securityStatus.activeThreats > 0 ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Shield className="h-4 w-4 text-success" />
        )}
        <AlertTitle>
          Sistema de Protección ML: {securityStatus.isProtected ? 'Activo' : 'Inactivo'}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-2 flex items-center gap-2">
        <span>
          {securityStatus.activeThreats === 0 
            ? 'No se detectaron amenazas. Sistema operando normalmente.'
            : `${securityStatus.activeThreats} amenaza${securityStatus.activeThreats !== 1 ? 's' : ''} activa${securityStatus.activeThreats !== 1 ? 's' : ''} bloqueada${securityStatus.activeThreats !== 1 ? 's' : ''} por Isolation Forest`
          }
        </span>
        <Badge variant={securityStatus.activeThreats > 0 ? 'destructive' : 'secondary'} className="ml-auto">
          {securityStatus.activeThreats > 0 ? 'ALERTA' : 'SEGURO'}
        </Badge>
      </AlertDescription>
    </Alert>
  );
}
