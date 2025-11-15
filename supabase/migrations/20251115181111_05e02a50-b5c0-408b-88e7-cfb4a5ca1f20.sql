-- Add DELETE policy for complaints (admins only)
CREATE POLICY "Admins can delete complaints"
ON public.complaints
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure students table can be read by everyone (for recruiter view)
-- This policy should already exist but let's make sure it's correct
DROP POLICY IF EXISTS "Anyone can view student profiles" ON public.students;
CREATE POLICY "Anyone can view student profiles"
ON public.students
FOR SELECT
TO anon, authenticated
USING (true);