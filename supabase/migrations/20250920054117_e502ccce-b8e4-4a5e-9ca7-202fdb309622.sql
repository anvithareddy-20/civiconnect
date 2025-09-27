-- Create user profiles table with emoji avatar selection
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  emoji_avatar TEXT DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create issues table that links to user profiles
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'reported',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for issues
CREATE POLICY "Users can view all issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues" 
ON public.issues 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own issues" 
ON public.issues 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create OTP table for password reset
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  code TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('email', 'sms')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on OTP codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP codes
CREATE POLICY "Users can view their own OTP codes" 
ON public.otp_codes 
FOR SELECT 
USING (auth.uid() = user_id OR email = auth.email() OR phone = (SELECT phone FROM public.profiles WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, is_anonymous, emoji_avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Anonymous User'),
    COALESCE((NEW.raw_user_meta_data ->> 'is_anonymous')::boolean, false),
    COALESCE(NEW.raw_user_meta_data ->> 'emoji_avatar', '👤')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();