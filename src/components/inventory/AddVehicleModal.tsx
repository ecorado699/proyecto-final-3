import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Car, Save, X } from 'lucide-react';

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: () => void;
}

export function AddVehicleModal({ open, onOpenChange, onVehicleAdded }: AddVehicleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: '',
    precio: '',
    estado: 'Disponible' as 'Disponible' | 'Vendido' | 'En mantenimiento',
    kilometraje: '',
    color: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      marca: '',
      modelo: '',
      anio: '',
      precio: '',
      estado: 'Disponible',
      kilometraje: '',
      color: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.marca || !formData.modelo || !formData.anio || !formData.precio || !formData.color) {
        toast({
          title: "Error de validación",
          description: "Todos los campos son obligatorios",
          variant: "destructive",
        });
        return;
      }

      // Validate numeric fields
      const anio = parseInt(formData.anio);
      const precio = parseFloat(formData.precio);
      const kilometraje = parseInt(formData.kilometraje) || 0;

      if (isNaN(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) {
        toast({
          title: "Error de validación",
          description: "El año debe ser válido",
          variant: "destructive",
        });
        return;
      }

      if (isNaN(precio) || precio <= 0) {
        toast({
          title: "Error de validación",
          description: "El precio debe ser mayor a 0",
          variant: "destructive",
        });
        return;
      }

      if (kilometraje < 0) {
        toast({
          title: "Error de validación",
          description: "El kilometraje no puede ser negativo",
          variant: "destructive",
        });
        return;
      }

      // Insert vehicle into database
      const { error } = await supabase
        .from('vehicles')
        .insert([
          {
            marca: formData.marca.trim(),
            modelo: formData.modelo.trim(),
            anio,
            precio,
            estado: formData.estado,
            kilometraje,
            color: formData.color.trim()
          }
        ]);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo agregar el vehículo: " + error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Vehículo agregado correctamente",
      });

      resetForm();
      onVehicleAdded();
      onOpenChange(false);

    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Agregar Nuevo Vehículo
          </DialogTitle>
          <DialogDescription>
            Completa la información del vehículo para agregarlo al inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => handleInputChange('marca', e.target.value)}
                placeholder="Toyota, Honda, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => handleInputChange('modelo', e.target.value)}
                placeholder="Corolla, Civic, etc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Año *</Label>
              <Input
                id="anio"
                type="number"
                value={formData.anio}
                onChange={(e) => handleInputChange('anio', e.target.value)}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (GTQ) *</Label>
              <Input
                id="precio"
                type="number"
                value={formData.precio}
                onChange={(e) => handleInputChange('precio', e.target.value)}
                placeholder="150000"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <Input
                id="kilometraje"
                type="number"
                value={formData.kilometraje}
                onChange={(e) => handleInputChange('kilometraje', e.target.value)}
                placeholder="50000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Blanco, Negro, etc."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select 
              value={formData.estado} 
              onValueChange={(value) => handleInputChange('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Vendido">Vendido</SelectItem>
                <SelectItem value="En mantenimiento">En mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Vehículo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}