-- Add RLS policy for admins to update all students
CREATE POLICY "Admins can update all students"
ON public.students
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to delete students
CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));