-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Insert missing roles for existing users
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('52fc4229-fba6-4d9b-934c-49bef6ccfb6c', 'student'),
  ('a77b3188-3465-4087-b640-cd2fa11a73fd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;