-- Drop the existing SELECT policy and create a more secure one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more explicit and secure SELECT policy
CREATE POLICY "Users can only view their own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Also ensure the UPDATE policy is equally secure
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can only update their own profile" ON public.profiles  
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- And the INSERT policy 
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can only insert their own profile" ON public.profiles
FOR INSERT  
WITH CHECK (auth.uid() = user_id);