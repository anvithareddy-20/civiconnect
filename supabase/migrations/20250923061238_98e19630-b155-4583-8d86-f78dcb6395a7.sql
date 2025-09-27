-- Add completed_at column to issues table
ALTER TABLE public.issues 
ADD COLUMN completed_at timestamp with time zone;

-- Add index for better performance on completed issues
CREATE INDEX idx_issues_completed_at ON public.issues(completed_at);

-- Add index for status queries
CREATE INDEX idx_issues_status ON public.issues(status);

-- Add index for daily reminder queries
CREATE INDEX idx_issues_user_status_completed ON public.issues(user_id, status, completed_at);