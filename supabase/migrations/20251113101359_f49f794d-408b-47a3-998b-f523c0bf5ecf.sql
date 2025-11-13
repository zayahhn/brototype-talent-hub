-- Drop the existing foreign key to auth.users
ALTER TABLE public.complaints
DROP CONSTRAINT complaints_student_id_fkey;

-- Add new foreign key to profiles
ALTER TABLE public.complaints
ADD CONSTRAINT complaints_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;