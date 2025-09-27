-- Fix security issues: Add search_path to functions to make them immutable

-- Drop and recreate update_updated_at_column function with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop and recreate handle_new_user function with proper search_path
DROP FUNCTION IF EXISTS public.handle_new_user();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;