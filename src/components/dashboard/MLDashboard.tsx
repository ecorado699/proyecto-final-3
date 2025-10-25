import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Activity, Shield, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { LoginRealActivity } from './LoginRealActivity';
import { TestDataGenerator } from './TestDataGenerator';

interface AnomalyDetection {
  id: string;
  ip_address: string;
  detected_at: string;
  anomaly_score: number;
  is_anomaly: boolean;
  metrics: {
    requests_per_minute: number;
    error_ratio: number;
    avg_time_between_requests: number;
    unique_emails_tried: number;
  };
  status: string;
}

interface IPMetrics {
  id: string;
  ip_address: string;
  window_start: string;
  requests_per_minute: number;
  failed_attempts: number;
  success_attempts: number;
  error_ratio: number;
  avg_time_between_requests: number;
}

interface SuspiciousIP {
  ip_address: string;
  detection_count: number;
  max_anomaly_score: number;
  last_detected: string;
  status: string;
  anomaly_count: number;
}

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

interface LoginAttempt {
  id: string;
  attempted_at: string;
  success: boolean;
  email: string | null;
  user_agent: string | null;
}

export function MLDashboard() {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [metrics, setMetrics] = useState<IPMetrics[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [realActivity, setRealActivity] = useState<RealLoginActivity[]>([]);
  const [ipAttempts, setIpAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIP, setSelectedIP] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!selectedIP) {
        setIpAttempts([]);
        return;
      }
      const { data } = await supabase
        .from('login_attempts')
        .select('id, attempted_at, success, email, user_agent, ip_address, is_test_data')
        .eq('is_test_data', false)
        .eq('ip_address', selectedIP)
        .order('attempted_at', { ascending: false })
        .limit(50);
      setIpAttempts((data as any[])?.map(a => ({
        id: a.id,
        attempted_at: a.attempted_at,
        success: a.success,
        email: a.email,
        user_agent: a.user_agent,
      })) || []);
    };
    fetchAttempts();
  }, [selectedIP]);

  const fetchDashboardData = async () => {
    try {
      // Fetch anomaly detections (only real data)
      const { data: anomalyData } = await supabase
        .from('anomaly_detections')
        .select('*')
        .eq('is_test_data', false)
        .order('detected_at', { ascending: false })
        .limit(100);

      // Fetch IP metrics (only real data)
      const { data: metricsData } = await supabase
        .from('ip_metrics')
        .select('*')
        .eq('is_test_data', false)
        .order('window_start', { ascending: false })
        .limit(100);

      // Fetch suspicious IPs (only real data via view)
      const { data: suspiciousData } = await supabase
        .rpc('get_real_suspicious_ips', { limit_count: 10 });

      // Fetch aggregated real login activity (last 24h)
      const { data: realAct } = await supabase
        .rpc('get_real_login_activity', { hours_back: 24 });

      setAnomalies((anomalyData || []).map(a => ({
        ...a,
        ip_address: a.ip_address as string,
        metrics: a.metrics as AnomalyDetection['metrics']
      })));
      setMetrics((metricsData || []).map(m => ({
        ...m,
        ip_address: m.ip_address as string
      })));
      setSuspiciousIPs((suspiciousData || []).map(s => ({
        ...s,
        ip_address: s.ip_address as string
      })));
      setRealActivity((realAct || []).map(r => ({
        ...r,
        ip_address: r.ip_address as string
      })));
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMLCycle = async () => {
    try {
      toast({
        title: "Ejecutando ciclo ML",
        description: "Recolectando métricas y detectando anomalías...",
      });

      const { data, error } = await supabase.functions.invoke('ml-anomaly-detection', {
        body: { action: 'full_cycle' }
      });

      if (error) throw error;

      toast({
        title: "Ciclo ML completado",
        description: `Se detectaron ${data.anomalies_detected} anomalías`,
      });

      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error ejecutando el ciclo ML",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const trainModel = async () => {
    try {
      toast({
        title: "Entrenando modelo ML",
        description: "Esto puede tomar unos momentos...",
      });

      const { data, error } = await supabase.functions.invoke('ml-anomaly-detection', {
        body: { action: 'train_model' }
      });

      if (error) throw error;

      toast({
        title: "Modelo entrenado exitosamente",
        description: `Se usaron ${data.samples_used} muestras`,
      });
    } catch (error) {
      toast({
        title: "Error al entrenar el modelo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getChartData = () => {
    const last24Hours = metrics.slice(0, 60);
    return last24Hours.reverse().map(m => ({
      time: new Date(m.window_start).toLocaleTimeString('es-ES'),
      requests: m.requests_per_minute,
      failed: m.failed_attempts,
      success: m.success_attempts,
    }));
  };

  const getIPSpecificData = (ip: string) => {
    return metrics
      .filter(m => m.ip_address === ip)
      .slice(0, 20)
      .reverse()
      .map(m => ({
        time: new Date(m.window_start).toLocaleTimeString('es-ES'),
        requests: m.requests_per_minute,
        errorRatio: (m.error_ratio * 100).toFixed(1),
      }));
  };

  if (loading) {
    return <div className="p-8">Cargando dashboard ML...</div>;
  }

  const activeAnomalies = anomalies.filter(a => a.is_anomaly && a.status === 'active');
  const totalRequests = metrics.reduce((sum, m) => sum + m.requests_per_minute, 0);
  const avgErrorRatio = metrics.length > 0 
    ? (metrics.reduce((sum, m) => sum + m.error_ratio, 0) / metrics.length * 100).toFixed(2)
    : 0;

  // Verificar si el sistema está inicializado
  const hasData = metrics.length > 0 || anomalies.length > 0;

  return (
    <div className="space-y-6">
      {/* Mensaje de ayuda si no hay datos */}
      {!hasData && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Sistema ML no inicializado
            </CardTitle>
            <CardDescription>
              El sistema de detección ML requiere datos para funcionar. Sigue estos pasos:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">Pasos para inicializar el sistema:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Ve a la pestaña "Datos de Prueba" abajo</li>
                <li>Genera 200 intentos normales para establecer línea base</li>
                <li>Genera 20-50 ataques para entrenar el modelo</li>
                <li>Haz clic en "Entrenar Modelo" arriba</li>
                <li>Haz clic en "Ejecutar Detección" para analizar los datos</li>
              </ol>
              <p className="text-muted-foreground mt-4">
                Una vez inicializado, el sistema analizará automáticamente cada intento de login.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Detección de Anomalías ML</h2>
          <p className="text-muted-foreground">Detección en tiempo real de ataques de fuerza bruta usando Isolation Forest</p>
        </div>
        <div className="space-x-2">
          <Button onClick={trainModel} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Entrenar Modelo
          </Button>
          <Button onClick={runMLCycle}>
            <Shield className="w-4 h-4 mr-2" />
            Ejecutar Detección
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalías Activas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAnomalies.length}</div>
            <p className="text-xs text-muted-foreground">IPs sospechosas detectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitudes</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">En período monitoreado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio de Error Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgErrorRatio}%</div>
            <p className="text-xs text-muted-foreground">Tasa de fallos de inicio de sesión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Monitoreadas</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(metrics.map(m => m.ip_address)).size}</div>
            <p className="text-xs text-muted-foreground">Direcciones únicas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="login" className="space-y-4">
        <TabsList>
          <TabsTrigger value="login">Login Real</TabsTrigger>
          <TabsTrigger value="overview">Resumen ML</TabsTrigger>
          <TabsTrigger value="suspicious">IPs Sospechosas</TabsTrigger>
          <TabsTrigger value="details">Detalles por IP</TabsTrigger>
          <TabsTrigger value="testing">Datos de Prueba</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <LoginRealActivity />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Intentos de Inicio de Sesión a lo Largo del Tiempo</CardTitle>
              <CardDescription>Intentos exitosos vs fallidos por minuto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" fill="hsl(var(--success))" name="Exitosos" />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Fallidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detecciones de Anomalías Recientes</CardTitle>
              <CardDescription>IPs marcadas por el algoritmo Isolation Forest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAnomalies.length > 0 ? (
                  activeAnomalies.slice(0, 10).map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {anomaly.ip_address}
                          </code>
                          <Badge variant="destructive">Anomalía</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Puntuación: {(anomaly.anomaly_score * 100).toFixed(1)}% | 
                          {anomaly.metrics.requests_per_minute} sol/min | 
                          {(anomaly.metrics.error_ratio * 100).toFixed(1)}% tasa de error
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(anomaly.detected_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No se detectaron anomalías activas</p>
                    {!hasData && (
                      <p className="text-sm text-warning">
                        ⚠️ Genera datos de prueba en la pestaña "Datos de Prueba" para comenzar
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 IPs Sospechosas (basado en logins reales)</CardTitle>
              <CardDescription>Ordenadas por tasa de error y volumen de intentos (últimas 24h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const computed = realActivity
                    .filter(a => Number(a.total_attempts) >= 3)
                    .sort((a, b) => Number(b.error_rate) - Number(a.error_rate))
                    .slice(0, 10);
                  return computed.length > 0 ? (
                    computed.map((a, index) => (
                      <div 
                        key={a.ip_address} 
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedIP(a.ip_address)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                          <div className="space-y-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {a.ip_address}
                            </code>
                            <div className="text-sm text-muted-foreground">
                              {a.total_attempts} intentos | {a.failed_attempts} fallidos | Tasa error: {Number(a.error_rate).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Último: {new Date(a.last_attempt).toLocaleString('es-ES')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No hay IPs con intentos suficientes en las últimas 24h</p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Específico por IP</CardTitle>
              <CardDescription>
                {selectedIP ? `Métricas detalladas para ${selectedIP}` : 'Selecciona una IP de la pestaña IPs Sospechosas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIP ? (
                <div className="space-y-6">
                  {/* IP Metrics Chart */}
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={getIPSpecificData(selectedIP)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" name="Solicitudes/min" />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Anomaly History */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Historial de Detección de Anomalías</h4>
                    <div className="space-y-2">
                      {anomalies
                        .filter(a => a.ip_address === selectedIP)
                        .slice(0, 10)
                        .map((anomaly) => (
                          <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {anomaly.is_anomaly && <Badge variant="destructive">Anomalía</Badge>}
                                <span className="text-sm">
                                  Puntuación: {(anomaly.anomaly_score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {anomaly.metrics.requests_per_minute} sol/min | 
                                {(anomaly.metrics.error_ratio * 100).toFixed(1)}% errores | 
                                {anomaly.metrics.unique_emails_tried} emails únicos
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(anomaly.detected_at).toLocaleString('es-ES')}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Selecciona una dirección IP de la pestaña IPs Sospechosas para ver el análisis detallado
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Intentos recientes de login por IP</CardTitle>
              <CardDescription>{selectedIP ? `Últimos intentos para ${selectedIP}` : 'Selecciona una IP para ver los intentos'}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIP ? (
                ipAttempts.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Resultado</th>
                          <th className="p-2">Navegador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ipAttempts.map(a => (
                          <tr key={a.id} className="border-t">
                            <td className="p-2 font-mono">{new Date(a.attempted_at).toLocaleString('es-ES')}</td>
                            <td className="p-2">{a.email || 'N/A'}</td>
                            <td className="p-2">
                              <Badge variant={a.success ? 'secondary' : 'destructive'}>
                                {a.success ? 'Exitoso' : 'Fallido'}
                              </Badge>
                            </td>
                            <td className="p-2">{a.user_agent ? (a.user_agent.includes('Chrome') ? 'Chrome' : a.user_agent.includes('Firefox') ? 'Firefox' : a.user_agent.includes('Safari') ? 'Safari' : 'Otro') : 'Desconocido'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">Sin intentos recientes para esta IP</div>
                )
              ) : (
                <div className="text-center text-muted-foreground">Selecciona una IP para ver detalles</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <TestDataGenerator />
          
          <Card>
            <CardHeader>
              <CardTitle>Cómo Usar el Sistema ML</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">🚀 Inicio Rápido (Primera Vez)</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2 text-muted-foreground">
                    <li>Genera 200 intentos normales (arriba)</li>
                    <li>Genera 50 ataques (arriba)</li>
                    <li>Haz clic en "Entrenar Modelo" (botón superior)</li>
                    <li>Haz clic en "Ejecutar Detección" (botón superior)</li>
                    <li>Ve a la pestaña "Resumen" para ver resultados</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">1. Generar Datos de Entrenamiento</h4>
                  <p className="text-muted-foreground">
                    Comienza con 200 intentos normales para establecer la línea base del comportamiento para el modelo ML.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Agregar Patrones de Ataque</h4>
                  <p className="text-muted-foreground">
                    Genera 20-50 intentos de ataque para enseñar al modelo cómo se ve un ataque de fuerza bruta.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">3. Entrenar el Modelo</h4>
                  <p className="text-muted-foreground">
                    Haz clic en el botón "Entrenar Modelo" para procesar los datos con el algoritmo Isolation Forest.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">4. Ejecutar Detección</h4>
                  <p className="text-muted-foreground">
                    Haz clic en "Ejecutar Detección" para recolectar métricas e identificar anomalías en tiempo real.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">5. Monitoreo Automático</h4>
                  <p className="text-muted-foreground">
                    Una vez inicializado, el sistema analiza automáticamente cada intento de login real en la aplicación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
