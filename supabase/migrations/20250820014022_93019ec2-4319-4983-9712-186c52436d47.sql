-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table for automotive inventory
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('Disponible', 'Vendido', 'En mantenimiento')),
  kilometraje INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_logs table to track user logins
CREATE TABLE public.session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_method TEXT NOT NULL CHECK (login_method IN ('basic', 'encrypted', 'google')),
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for vehicles (public read access for inventory)
CREATE POLICY "Anyone can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (true);

-- Create policies for session_logs (users can only see their own logs)
CREATE POLICY "Users can view their own session logs" 
ON public.session_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert session logs" 
ON public.session_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample vehicle data
INSERT INTO public.vehicles (marca, modelo, anio, precio, estado, kilometraje, color) VALUES
('Toyota', 'Camry', 2023, 28500.00, 'Disponible', 15000, 'Blanco'),
('Ford', 'F-150', 2022, 35000.00, 'Disponible', 25000, 'Negro'),
('Chevrolet', 'Silverado', 2023, 42000.00, 'Vendido', 8000, 'Rojo'),
('Honda', 'Civic', 2021, 22000.00, 'Disponible', 30000, 'Azul'),
('Nissan', 'Altima', 2022, 26000.00, 'En mantenimiento', 18000, 'Gris'),
('BMW', 'X3', 2023, 55000.00, 'Disponible', 5000, 'Negro'),
('Mercedes-Benz', 'C-Class', 2022, 48000.00, 'Disponible', 12000, 'Plata'),
('Audi', 'A4', 2021, 41000.00, 'Vendido', 22000, 'Blanco');