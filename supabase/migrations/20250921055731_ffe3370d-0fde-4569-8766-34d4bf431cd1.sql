-- Fix OTP codes security vulnerability
-- Create security definer function to safely check OTP ownership
CREATE OR REPLACE FUNCTION public.user_owns_otp(otp_user_id uuid, otp_email text, otp_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN otp_user_id IS NOT NULL THEN auth.uid() = otp_user_id
      WHEN otp_email IS NOT NULL THEN auth.email() = otp_email  
      WHEN otp_phone IS NOT NULL THEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND phone = otp_phone
      )
      ELSE false
    END;
$$;

-- Drop existing OTP policy and create secure one
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.otp_codes;

CREATE POLICY "Users can view their own OTP codes"
ON public.otp_codes
FOR SELECT
TO authenticated
USING (
  public.user_owns_otp(user_id, email, phone) AND 
  expires_at > now() AND 
  used = false
);

-- Add policies for OTP operations (INSERT/UPDATE for system use)
CREATE POLICY "System can insert OTP codes"
ON public.otp_codes
FOR INSERT
TO authenticated
WITH CHECK (public.user_owns_otp(user_id, email, phone));

CREATE POLICY "System can update OTP codes"
ON public.otp_codes  
FOR UPDATE
TO authenticated
USING (public.user_owns_otp(user_id, email, phone))
WITH CHECK (public.user_owns_otp(user_id, email, phone));

-- Add suggestions table for proper data relationships
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on suggestions
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suggestions
CREATE POLICY "Authenticated users can view all suggestions"
ON public.suggestions
FOR SELECT  
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own suggestions"
ON public.suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
ON public.suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestions"
ON public.suggestions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger for suggestions
CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON public.suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for issue images if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for issue images
CREATE POLICY "Authenticated users can view issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'issue-images');

CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own issue images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own issue images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);