# Manual de Usuario - Sistema de Inventario Automotriz

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Inicio de Sesión](#inicio-de-sesión)
3. [Panel Principal](#panel-principal)
4. [Gestión de Vehículos](#gestión-de-vehículos)
5. [Configuración de Perfil](#configuración-de-perfil)
6. [Solución de Problemas](#solución-de-problemas)

## Introducción

El Sistema de Inventario Automotriz es una aplicación web diseñada para gestionar eficientemente el inventario de vehículos de una empresa automotriz. Permite registrar, consultar, editar y eliminar información de vehículos, así como llevar un control de sesiones de usuario.

### Características Principales
- Gestión completa de inventario de vehículos
- Sistema de autenticación seguro
- Interfaz intuitiva y responsiva
- Registro de actividad de usuarios
- Búsqueda y filtrado de vehículos

## Inicio de Sesión

### Acceso al Sistema
1. Abra su navegador web
2. Ingrese a la URL del sistema
3. Será dirigido automáticamente a la página de inicio de sesión

### Registro de Nueva Cuenta
1. En la página de inicio de sesión, haga clic en la pestaña "Registro"
2. Complete los siguientes campos:
   - **Nombre Completo**: Su nombre y apellidos
   - **Correo Electrónico**: Una dirección de email válida
   - **Contraseña**: Una contraseña segura
3. Haga clic en "Registrarse"
4. Revise su correo electrónico para confirmar la cuenta (si está habilitado)

### Inicio de Sesión
1. En la página de inicio de sesión, complete:
   - **Correo Electrónico**: Su email registrado
   - **Contraseña**: Su contraseña
2. Haga clic en "Iniciar Sesión"

### Inicio de Sesión con Google
- Haga clic en el botón "Iniciar sesión con Google"
- Autorice el acceso con su cuenta de Google
- Será redirigido automáticamente al panel principal

## Panel Principal

Una vez autenticado, accederá al panel principal que incluye:

### Sección de Bienvenida
- Saludo personalizado con su nombre
- Fecha y hora actual
- Información de la sesión actual

### Estadísticas del Inventario
- **Total de Vehículos**: Cantidad total de vehículos registrados
- **Valor Total del Inventario**: Suma del valor de todos los vehículos
- **Vehículo Más Caro**: El vehículo con mayor precio
- **Año Promedio**: Promedio de años de los vehículos

### Registro de Sesiones
- Historial de inicios de sesión
- Método de autenticación utilizado
- Fecha y hora de cada sesión
- Información del navegador utilizado

## Gestión de Vehículos

### Ver Lista de Vehículos
La lista de vehículos muestra:
- **Imagen**: Foto del vehículo (si está disponible)
- **Marca y Modelo**: Información básica del vehículo
- **Año**: Año de fabricación
- **Precio**: Precio en Quetzales (GTQ)
- **Estado**: Condición del vehículo
- **Acciones**: Botones para ver detalles, editar o eliminar

### Agregar Nuevo Vehículo
1. Haga clic en el botón "Agregar Vehículo" en la parte superior de la lista
2. Complete el formulario con la siguiente información:
   - **Marca**: Marca del vehículo (ej: Toyota, Ford, Chevrolet)
   - **Modelo**: Modelo específico (ej: Corolla, Focus, Cruze)
   - **Año**: Año de fabricación (ej: 2020)
   - **Color**: Color del vehículo
   - **Kilometraje**: Kilómetros recorridos
   - **Precio**: Precio en Quetzales
   - **Estado**: Seleccione entre Nuevo, Usado, Seminuevo
3. Haga clic en "Agregar Vehículo"
4. El sistema confirmará que el vehículo se agregó correctamente

### Ver Detalles de Vehículo
1. En la lista de vehículos, haga clic en "Ver Detalles"
2. Se abrirá una ventana modal con toda la información del vehículo:
   - Información completa del vehículo
   - Fechas de creación y última actualización
   - Precio formateado en Quetzales

### Editar Vehículo
1. En la lista de vehículos, haga clic en el botón "Editar" (ícono de lápiz)
2. Modifique los campos necesarios en el formulario
3. Haga clic en "Guardar Cambios"
4. Los cambios se aplicarán inmediatamente

### Eliminar Vehículo
1. En la lista de vehículos, haga clic en el botón "Eliminar" (ícono de papelera)
2. Confirme la eliminación en el diálogo que aparece
3. El vehículo será eliminado permanentemente del sistema

## Configuración de Perfil

### Cerrar Sesión
1. Haga clic en el botón "Cerrar Sesión" en la parte superior derecha
2. Será redirigido a la página de inicio de sesión
3. Su sesión quedará registrada en el historial

## Solución de Problemas

### Problemas Comunes

**No puedo iniciar sesión**
- Verifique que su correo electrónico y contraseña sean correctos
- Asegúrese de haber confirmado su cuenta por email
- Intente restablecer su contraseña

**No puedo agregar vehículos**
- Verifique que todos los campos obligatorios estén completos
- Asegúrese de que el precio sea un número válido
- Verifique su conexión a internet

**La página no carga correctamente**
- Actualice la página (F5 o Ctrl+R)
- Limpie la caché de su navegador
- Verifique su conexión a internet

**Errores de autenticación con Google**
- Verifique que las URLs de redirección estén configuradas correctamente
- Contacte al administrador del sistema

### Contacto y Soporte

Para obtener ayuda adicional:
- Contacte al administrador del sistema
- Revise la documentación técnica
- Consulte los logs del sistema para errores específicos

### Navegadores Compatibles

El sistema es compatible con:
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Requisitos del Sistema

- Conexión a internet estable
- Navegador web actualizado
- JavaScript habilitado
- Cookies habilitadas