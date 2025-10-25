# Manual Técnico - Sistema de Inventario Automotriz

## Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Autenticación](#autenticación)
6. [API y Servicios](#api-y-servicios)
7. [Componentes Frontend](#componentes-frontend)
8. [Configuración y Despliegue](#configuración-y-despliegue)
9. [Seguridad](#seguridad)
10. [Mantenimiento](#mantenimiento)

## Arquitectura del Sistema

### Arquitectura General
El sistema utiliza una arquitectura moderna de aplicación web de página única (SPA) con los siguientes componentes:

```
Frontend (React/TypeScript) ↔ Supabase Backend
    ├── Autenticación
    ├── Base de Datos PostgreSQL
    └── API REST automática
```

### Diagrama de Componentes
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Supabase      │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ - Componentes   │◄──►│ - Auth          │◄──►│ - vehicles      │
│ - Hooks         │    │ - API           │    │ - profiles      │
│ - Estado        │    │ - RLS           │    │ - session_logs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tecnologías Utilizadas

### Frontend
- **React 18.3.1**: Biblioteca principal para la interfaz de usuario
- **TypeScript**: Tipado estático para mayor robustez
- **Vite**: Herramienta de build y desarrollo
- **Tailwind CSS**: Framework de estilos utilitarios
- **React Router DOM**: Enrutamiento del lado del cliente
- **React Query**: Gestión de estado del servidor y cache
- **React Hook Form**: Gestión de formularios
- **Zod**: Validación de esquemas

### Backend
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Base de datos relacional
- **Row Level Security (RLS)**: Seguridad a nivel de fila

### UI Components
- **Radix UI**: Componentes primitivos accesibles
- **Lucide React**: Iconografía
- **Shadcn/ui**: Sistema de componentes basado en Radix

## Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Componentes de autenticación
│   │   └── AuthForm.tsx
│   ├── dashboard/       # Componentes del panel principal
│   │   ├── Dashboard.tsx
│   │   └── SessionLogs.tsx
│   ├── inventory/       # Componentes de inventario
│   │   ├── VehicleList.tsx
│   │   ├── AddVehicleModal.tsx
│   │   └── VehicleDetailsModal.tsx
│   └── ui/             # Componentes UI base (shadcn)
├── hooks/              # Hooks personalizados
│   ├── useAuth.tsx     # Hook de autenticación
│   └── use-toast.ts    # Hook para notificaciones
├── integrations/       # Integraciones externas
│   └── supabase/       # Configuración de Supabase
├── lib/               # Utilidades
│   └── utils.ts       # Funciones de utilidad
├── pages/             # Páginas principales
│   ├── Index.tsx      # Página principal
│   └── NotFound.tsx   # Página 404
└── main.tsx           # Punto de entrada de la aplicación
```

## Base de Datos

### Esquema de la Base de Datos

#### Tabla: vehicles
```sql
CREATE TABLE public.vehicles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    color TEXT NOT NULL,
    kilometraje INTEGER NOT NULL DEFAULT 0,
    precio NUMERIC NOT NULL,
    estado TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### Tabla: profiles
```sql
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### Tabla: session_logs
```sql
CREATE TABLE public.session_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    login_method TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Políticas RLS (Row Level Security)

#### Vehicles
```sql
-- Cualquiera puede ver vehículos
CREATE POLICY "Anyone can view vehicles" ON public.vehicles
FOR SELECT USING (true);

-- Solo usuarios autenticados pueden insertar
CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles
FOR UPDATE USING (auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles
FOR DELETE USING (auth.role() = 'authenticated');
```

#### Profiles
```sql
-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);
```

#### Session Logs
```sql
-- El sistema puede insertar logs de sesión
CREATE POLICY "System can insert session logs" ON public.session_logs
FOR INSERT WITH CHECK (true);

-- Los usuarios pueden ver sus propios logs
CREATE POLICY "Users can view their own session logs" ON public.session_logs
FOR SELECT USING (auth.uid() = user_id);
```

### Funciones de Base de Datos

#### Actualización automática de timestamps
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para vehicles
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

#### Creación automática de perfiles
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- Trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Autenticación

### Configuración de Supabase Auth
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Hook de Autenticación
```typescript
// src/hooks/useAuth.tsx
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Configuración del listener de auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log de sesiones
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            logSession(session.user.id, 'basic');
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
```

### Métodos de Autenticación Soportados
1. **Email/Password**: Autenticación tradicional con email y contraseña
2. **Google OAuth**: Autenticación con cuenta de Google
3. **Registro de usuarios**: Creación de nuevas cuentas

## API y Servicios

### Cliente Supabase
El sistema utiliza el cliente JavaScript de Supabase para todas las operaciones de datos:

```typescript
// Operaciones CRUD ejemplo
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .order('created_at', { ascending: false });
```

### Operaciones Principales

#### Vehículos
```typescript
// Obtener todos los vehículos
const fetchVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });
};

// Agregar vehículo
const addVehicle = async (vehicle: VehicleData) => {
  const { error } = await supabase
    .from('vehicles')
    .insert(vehicle);
};

// Actualizar vehículo
const updateVehicle = async (id: string, updates: Partial<VehicleData>) => {
  const { error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id);
};

// Eliminar vehículo
const deleteVehicle = async (id: string) => {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
};
```

## Componentes Frontend

### Componente Principal: Dashboard
```typescript
// src/components/dashboard/Dashboard.tsx
export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Lógica para obtener y mostrar datos
  // Estadísticas del inventario
  // Lista de vehículos
  // Logs de sesión
};
```

### Sistema de Formularios
```typescript
// Uso de React Hook Form con Zod
const form = useForm<VehicleFormData>({
  resolver: zodResolver(vehicleSchema),
  defaultValues: {
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    color: "",
    kilometraje: 0,
    precio: 0,
    estado: "nuevo",
  },
});
```

### Gestión de Estado
- **useState**: Estado local de componentes
- **useContext**: Estado global de autenticación
- **React Query**: Cache y sincronización con el servidor

## Configuración y Despliegue

### Variables de Entorno
```typescript
// Configuración en src/integrations/supabase/client.ts
const SUPABASE_URL = "https://ckcalonfcuazyhuulxoj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Configuración de Supabase
1. **URL del sitio**: Configurar en Authentication > Settings
2. **URLs de redirección**: Configurar para OAuth
3. **Proveedores**: Habilitar Google OAuth si es necesario

### Scripts de Desarrollo
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Despliegue
1. **Desarrollo**: `npm run dev`
2. **Construcción**: `npm run build`
3. **Preview**: `npm run preview`

## Seguridad

### Row Level Security (RLS)
- **Habilitado en todas las tablas públicas**
- **Políticas específicas por operación**
- **Filtrado automático basado en usuario**

### Autenticación
- **Tokens JWT con renovación automática**
- **Almacenamiento seguro en localStorage**
- **Logout automático en caso de token inválido**

### Validación de Datos
- **Validación en el frontend con Zod**
- **Constraintes de base de datos**
- **Sanitización de inputs**

### Mejores Prácticas Implementadas
1. **Principio de menor privilegio**: Usuarios solo acceden a sus datos
2. **Validación doble**: Frontend y backend
3. **Logging de seguridad**: Registro de inicios de sesión
4. **Manejo seguro de errores**: No exposición de información sensible

## Mantenimiento

### Logging y Monitoreo
```typescript
// Registro de sesiones automático
const logSession = async (userId: string, method: string) => {
  await supabase.from('session_logs').insert({
    user_id: userId,
    login_method: method,
    ip_address: null,
    user_agent: navigator.userAgent
  });
};
```

### Actualizaciones de Base de Datos
```sql
-- Script de migración ejemplo
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nueva_columna TEXT;
UPDATE vehicles SET nueva_columna = 'valor_default' WHERE nueva_columna IS NULL;
```

### Backup y Recuperación
- **Backups automáticos de Supabase**
- **Exportación manual de datos**
- **Procedimientos de restauración**

### Performance
- **Índices en columnas frecuentemente consultadas**
- **Paginación en listas grandes**
- **Cache de consultas con React Query**
- **Lazy loading de componentes**

### Troubleshooting
1. **Logs de Supabase**: Revisar en el dashboard
2. **Console del navegador**: Errores de JavaScript
3. **Network tab**: Problemas de conectividad
4. **Auth logs**: Problemas de autenticación

### Versionado
- **Git para control de versiones**
- **Migraciones de base de datos versionadas**
- **Changelog detallado**

## APIs Externas y Integraciones

### Supabase APIs Utilizadas
- **Auth API**: Autenticación y gestión de usuarios
- **Database API**: Operaciones CRUD
- **Realtime API**: Actualizaciones en tiempo real (opcional)

### Configuración de CORS
Las políticas CORS están manejadas automáticamente por Supabase para dominios autorizados.

---

## Contacto y Soporte

Para soporte técnico adicional:
- Documentación de Supabase: https://supabase.com/docs
- Documentación de React: https://react.dev
- Documentación de Tailwind: https://tailwindcss.com