import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ShieldAlert, Chrome, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SessionLog {
  id: string;
  login_method: 'basic' | 'encrypted' | 'google';
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export function SessionLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessionLogs();
    }
  }, [user]);

  const fetchSessionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('session_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('login_at', { ascending: false })
        .limit(20);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros de sesión",
          variant: "destructive",
        });
        return;
      }

      setLogs(data as SessionLog[] || []);
    } catch (error) {
      console.error('Error fetching session logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'basic':
        return <ShieldAlert className="w-4 h-4" />;
      case 'encrypted':
        return <Shield className="w-4 h-4" />;
      case 'google':
        return <Chrome className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'basic':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'encrypted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'google':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'basic':
        return 'Básico';
      case 'encrypted':
        return 'Cifrado';
      case 'google':
        return 'Google';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Desconocido';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Otro';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Sin registros de sesión</h3>
        <p className="text-muted-foreground">
          No hay registros de inicio de sesión disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Navegador</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge className={`text-xs ${getMethodColor(log.login_method)}`}>
                    <span className="flex items-center">
                      {getMethodIcon(log.login_method)}
                      <span className="ml-1">{getMethodLabel(log.login_method)}</span>
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatDate(log.login_at)}
                </TableCell>
                <TableCell className="text-sm">
                  {getBrowserInfo(log.user_agent)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {log.ip_address || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando los últimos 20 registros de inicio de sesión
      </div>
    </div>
  );
}