import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Activity, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface RealLoginActivity {
  ip_address: string;
  total_attempts: number;
  failed_attempts: number;
  success_attempts: number;
  unique_emails: number;
  first_attempt: string;
  last_attempt: string;
  error_rate: number;
}

interface RecentAttempt {
  id: string;
  attempted_at: string;
  ip_address: string;
  email: string | null;
  success: boolean;
  user_agent: string | null;
}

export function LoginRealActivity() {
  const [activities, setActivities] = useState<RealLoginActivity[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    total_ips: 0,
    total_attempts: 0,
    total_failed: 0,
    avg_error_rate: 0
  });

  useEffect(() => {
    fetchRealLoginActivity();
    const interval = setInterval(fetchRealLoginActivity, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchRealLoginActivity = async () => {
    try {
      setLoading(true);
      
      // Get real login activity from last 24 hours
      const { data, error } = await supabase.rpc('get_real_login_activity', {
        hours_back: 24
      });

      if (error) {
        console.error('Error fetching real login activity:', error);
        return;
      }

      setActivities((data as RealLoginActivity[]) || []);

      // Fetch recent real login attempts (raw)
      const { data: attempts, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('id, attempted_at, ip_address, email, success, user_agent, is_test_data')
        .eq('is_test_data', false)
        .order('attempted_at', { ascending: false })
        .limit(100);

      if (!attemptsError) {
        setRecentAttempts((attempts as any[] || []).map((a) => ({
          id: a.id,
          attempted_at: a.attempted_at,
          ip_address: a.ip_address as string,
          email: a.email,
          success: a.success,
          user_agent: a.user_agent,
        })));
      }
      
      // Calculate total stats
      const total_ips = (data || []).length;
      const total_attempts = (data || []).reduce((sum, a) => sum + Number(a.total_attempts), 0);
      const total_failed = (data || []).reduce((sum, a) => sum + Number(a.failed_attempts), 0);
      const avg_error_rate = total_attempts > 0 ? (total_failed / total_attempts * 100) : 0;

      setTotalStats({
        total_ips,
        total_attempts,
        total_failed,
        avg_error_rate
      });
    } catch (error) {
      console.error('Error in fetchRealLoginActivity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad de Login Real</CardTitle>
          <CardDescription>No hay intentos de login reales registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Los intentos de login real aparecerán aquí cuando los usuarios intenten iniciar sesión.</p>
            <p className="text-sm mt-2">Los datos de prueba generados no se muestran en esta vista.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IPs Únicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total_ips}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Intentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total_attempts}</div>
            <p className="text-xs text-muted-foreground">Exitosos y fallidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Intentos Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalStats.total_failed}</div>
            <p className="text-xs text-muted-foreground">Credenciales incorrectas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avg_error_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad por IP (Últimas 24h)</CardTitle>
          <CardDescription>
            Intentos de login registrados desde direcciones IP reales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dirección IP</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Exitosos</TableHead>
                  <TableHead className="text-center">Fallidos</TableHead>
                  <TableHead className="text-center">Emails</TableHead>
                  <TableHead className="text-center">Tasa Error</TableHead>
                  <TableHead>Primer Intento</TableHead>
                  <TableHead>Último Intento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">
                      {activity.ip_address}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {activity.total_attempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{activity.success_attempts}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span>{activity.failed_attempts}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{activity.unique_emails}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          Number(activity.error_rate) > 80 
                            ? 'destructive' 
                            : Number(activity.error_rate) > 50 
                            ? 'default' 
                            : 'secondary'
                        }
                      >
                        {Number(activity.error_rate).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(activity.first_attempt), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(activity.last_attempt), 'HH:mm:ss')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos intentos de login (reales)</CardTitle>
          <CardDescription>Incluye éxitos y fallos en orden descendente</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttempts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Resultado</TableHead>
                    <TableHead>Navegador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttempts.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(att.attempted_at).toLocaleString('es-ES')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{att.ip_address}</TableCell>
                      <TableCell className="text-sm">{att.email || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={att.success ? 'secondary' : 'destructive'}>
                          {att.success ? 'Exitoso' : 'Fallido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {att.user_agent
                          ? att.user_agent.includes('Chrome')
                            ? 'Chrome'
                            : att.user_agent.includes('Firefox')
                            ? 'Firefox'
                            : att.user_agent.includes('Safari')
                            ? 'Safari'
                            : 'Otro'
                          : 'Desconocido'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No hay intentos recientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}