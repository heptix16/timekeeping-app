-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Add RLS policies for admins to view all time logs
CREATE POLICY "Admins can view all time logs" ON public.time_logs
  FOR SELECT USING (public.is_admin());

-- Add RLS policies for admins to view all leave requests
CREATE POLICY "Admins can view all leave requests" ON public.leave_requests
  FOR SELECT USING (public.is_admin());

-- Add RLS policies for admins to update leave requests (Approve/Reject)
CREATE POLICY "Admins can update leave requests" ON public.leave_requests
  FOR UPDATE USING (public.is_admin());
