import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Car, Search, Filter, DollarSign, Calendar, Gauge, Palette, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { VehicleDetailsModal } from './VehicleDetailsModal';
import { AddVehicleModal } from './AddVehicleModal';

interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  estado: 'Disponible' | 'Vendido' | 'En mantenimiento';
  kilometraje: number;
  color: string;
  created_at: string;
}

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los vehículos",
          variant: "destructive",
        });
        return;
      }

      setVehicles(data as Vehicle[] || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.estado === statusFilter);
    }

    setFilteredVehicles(filtered);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Vendido':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'En mantenimiento':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatKilometers = (km: number) => {
    return new Intl.NumberFormat('es-GT').format(km) + ' km';
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
  };

  const handleVehicleAdded = () => {
    fetchVehicles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por marca, modelo o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Disponible">Disponible</SelectItem>
              <SelectItem value="Vendido">Vendido</SelectItem>
              <SelectItem value="En mantenimiento">En mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Vehículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{vehicle.marca} {vehicle.modelo}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {vehicle.anio}
                  </CardDescription>
                </div>
                <Badge className={`text-xs ${getStatusColor(vehicle.estado)}`}>
                  {vehicle.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-lg font-semibold text-automotive-blue">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatPrice(vehicle.precio)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Gauge className="w-4 h-4 mr-2" />
                  {formatKilometers(vehicle.kilometraje)}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Palette className="w-4 h-4 mr-2" />
                  {vehicle.color}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleViewDetails(vehicle)}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron vehículos</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay vehículos registrados en el inventario'}
          </p>
        </div>
      )}

      <VehicleDetailsModal
        vehicle={selectedVehicle}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      <AddVehicleModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onVehicleAdded={handleVehicleAdded}
      />
    </div>
  );
}