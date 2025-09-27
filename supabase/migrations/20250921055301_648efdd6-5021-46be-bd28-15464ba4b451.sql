-- Fix security issue: Restrict issue viewing to authenticated users only
-- This prevents anonymous users from accessing sensitive location data and personal details

DROP POLICY IF EXISTS "Users can view all issues" ON public.issues;

CREATE POLICY "Authenticated users can view all issues" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (true);