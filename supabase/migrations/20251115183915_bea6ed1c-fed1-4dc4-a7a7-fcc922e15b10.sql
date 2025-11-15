-- Drop the incorrect foreign key constraint
ALTER TABLE public.students
DROP CONSTRAINT students_id_fkey;

-- Add correct foreign key constraint pointing to profiles
ALTER TABLE public.students
ADD CONSTRAINT students_id_fkey 
FOREIGN KEY (id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;