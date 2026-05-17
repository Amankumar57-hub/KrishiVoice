-- Migration to update transporters schema to support user ownership and photos
ALTER TABLE public.transporters ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.transporters ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Drop existing write policies if they exist to avoid duplication
DROP POLICY IF EXISTS "Authenticated users can create transporters" ON public.transporters;
DROP POLICY IF EXISTS "Users can update own transporters" ON public.transporters;
DROP POLICY IF EXISTS "Users can delete own transporters" ON public.transporters;

-- Create policies to secure user-owned transporters
CREATE POLICY "Authenticated users can create transporters" 
  ON public.transporters 
  FOR INSERT 
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own transporters" 
  ON public.transporters 
  FOR UPDATE 
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can delete own transporters" 
  ON public.transporters 
  FOR DELETE 
  USING (((auth.uid())::text = user_id));
