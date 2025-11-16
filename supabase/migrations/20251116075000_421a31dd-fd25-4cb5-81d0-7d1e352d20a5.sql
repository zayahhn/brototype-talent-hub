-- Allow anyone to create recruiter message notifications
CREATE POLICY "Anyone can create recruiter message notifications"
ON public.notifications
FOR INSERT
WITH CHECK (type = 'recruiter_message');