-- Allow anyone to view all profiles (needed for public student showcase)
CREATE POLICY "Anyone can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);