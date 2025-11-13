-- Add verified status to students table
ALTER TABLE public.students
ADD COLUMN verified BOOLEAN DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;

-- Create recruiter_messages table
CREATE TABLE public.recruiter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_company TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on recruiter_messages
ALTER TABLE public.recruiter_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for recruiter_messages
CREATE POLICY "Anyone can create recruiter messages"
ON public.recruiter_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Students can view their own messages"
ON public.recruiter_messages
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own messages"
ON public.recruiter_messages
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all messages"
ON public.recruiter_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_completed DATE NOT NULL,
  verified_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for milestones
CREATE POLICY "Students can create their own milestones"
ON public.milestones
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own milestones"
ON public.milestones
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own milestones"
ON public.milestones
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Anyone can view verified milestones"
ON public.milestones
FOR SELECT
USING (verified_by_admin = true);

CREATE POLICY "Admins can view all milestones"
ON public.milestones
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all milestones"
ON public.milestones
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for milestones updated_at
CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update notifications table to support more types
ALTER TABLE public.notifications
ADD COLUMN type TEXT DEFAULT 'complaint';

-- Create index for better performance
CREATE INDEX idx_recruiter_messages_student_id ON public.recruiter_messages(student_id);
CREATE INDEX idx_milestones_student_id ON public.milestones(student_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiter_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;