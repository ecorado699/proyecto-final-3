import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car, Calendar, Gauge, Palette, DollarSign, MapPin } from 'lucide-react';

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

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsModal({ vehicle, open, onOpenChange }: VehicleDetailsModalProps) {
  if (!vehicle) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {vehicle.marca} {vehicle.modelo}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del vehículo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={`${getStatusColor(vehicle.estado)} px-4 py-2 text-sm font-medium`}>
              {vehicle.estado}
            </Badge>
          </div>

          {/* Price */}
          <div className="text-center">
            <div className="flex items-center justify-center text-3xl font-bold text-primary mb-2">
              <DollarSign className="w-6 h-6 mr-1" />
              {formatPrice(vehicle.precio)}
            </div>
            <p className="text-sm text-muted-foreground">Precio de venta</p>
          </div>

          <Separator />

          {/* Vehicle Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Marca</p>
                  <p className="text-sm text-muted-foreground">{vehicle.marca}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Año</p>
                  <p className="text-sm text-muted-foreground">{vehicle.anio}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Kilometraje</p>
                  <p className="text-sm text-muted-foreground">{formatKilometers(vehicle.kilometraje)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Modelo</p>
                  <p className="text-sm text-muted-foreground">{vehicle.modelo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Color</p>
                  <p className="text-sm text-muted-foreground">{vehicle.color}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ingreso</p>
                  <p className="text-sm text-muted-foreground">{formatDate(vehicle.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Información adicional</h4>
            <p className="text-sm text-muted-foreground">
              Vehículo {vehicle.marca} {vehicle.modelo} del año {vehicle.anio} en estado "{vehicle.estado}". 
              {vehicle.estado === 'Disponible' && ' Disponible para la venta inmediata.'}
              {vehicle.estado === 'Vendido' && ' Ya no está disponible para la venta.'}
              {vehicle.estado === 'En mantenimiento' && ' Actualmente en proceso de mantenimiento.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}