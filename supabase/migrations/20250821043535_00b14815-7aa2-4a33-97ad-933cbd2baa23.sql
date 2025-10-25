-- Add RLS policy to allow authenticated users to insert vehicles
CREATE POLICY "Authenticated users can insert vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Add RLS policy to allow authenticated users to update vehicles
CREATE POLICY "Authenticated users can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Add RLS policy to allow authenticated users to delete vehicles
CREATE POLICY "Authenticated users can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (auth.role() = 'authenticated');