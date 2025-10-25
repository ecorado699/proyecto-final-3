import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database, Zap, AlertTriangle } from 'lucide-react';

export function TestDataGenerator() {
  const [loading, setLoading] = useState(false);

  const generateData = async (count: number, mode: 'normal' | 'attack' | 'mixed') => {
    setLoading(true);
    try {
      toast({
        title: "Generando datos de prueba",
        description: `Creando ${count} intentos de inicio de sesión en modo ${mode === 'normal' ? 'normal' : mode === 'attack' ? 'ataque' : 'mixto'}...`,
      });

      const { data, error } = await supabase.functions.invoke('generate-test-data', {
        body: { count, mode }
      });

      if (error) throw error;

      toast({
        title: "Datos de prueba generados",
        description: `Se crearon ${data.attempts_generated} intentos de inicio de sesión`,
      });
    } catch (error) {
      toast({
        title: "Error al generar datos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Generador de Datos de Prueba
        </CardTitle>
        <CardDescription>
          Genera datos sintéticos de intentos de inicio de sesión para entrenamiento y pruebas del modelo ML
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Comportamiento Normal (1-9 solicitudes/min)</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => generateData(50, 'normal')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                50 intentos
              </Button>
              <Button 
                onClick={() => generateData(100, 'normal')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                100 intentos
              </Button>
              <Button 
                onClick={() => generateData(200, 'normal')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                200 intentos
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Comportamiento de Ataque (10-150 solicitudes/min)
            </h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => generateData(20, 'attack')} 
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <Zap className="w-3 h-3 mr-1" />
                20 ataques
              </Button>
              <Button 
                onClick={() => generateData(50, 'attack')} 
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <Zap className="w-3 h-3 mr-1" />
                50 ataques
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              Tráfico Mixto (70% normal, 30% ataques)
            </h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => generateData(100, 'mixed')} 
                disabled={loading}
                size="sm"
              >
                100 mixtos
              </Button>
              <Button 
                onClick={() => generateData(200, 'mixed')} 
                disabled={loading}
                size="sm"
              >
                200 mixtos
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Patrones de Comportamiento:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>• <Badge variant="outline" className="mr-1">Normal</Badge> 1-9 solicitudes/min, 80-95% tasa de éxito</p>
              <p>• <Badge variant="destructive" className="mr-1">Ataque</Badge> 10-150 solicitudes/min, 5% tasa de éxito, patrones de diccionario</p>
              <p>• <Badge variant="secondary" className="mr-1">Mixto</Badge> Tráfico realista con ambos patrones</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
