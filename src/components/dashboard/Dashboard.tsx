import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { VehicleList } from '@/components/inventory/VehicleList';
import { SessionLogs } from '@/components/dashboard/SessionLogs';
import { MLDashboard } from '@/components/dashboard/MLDashboard';
import { MLSecurityBanner } from '@/components/dashboard/MLSecurityBanner';
import { Car, LogOut, User, History, Shield, Activity } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-automotive-light">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-automotive-blue rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sistema de Inventario Automotriz</h1>
                <p className="text-sm text-muted-foreground">Gestión de vehículos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.email}</span>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Autenticado
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Banner de seguridad ML */}
        <div className="mb-6">
          <MLSecurityBanner />
        </div>
        
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="inventory" className="flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="ml" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Detección ML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventario de Vehículos</CardTitle>
                <CardDescription>
                  Lista completa de vehículos disponibles en el inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VehicleList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sesiones</CardTitle>
                <CardDescription>
                  Registro de todos los inicios de sesión realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SessionLogs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml" className="space-y-6">
            <MLDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}