-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_source_language TEXT DEFAULT 'en',
  preferred_target_language TEXT DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create flashcards table with spaced repetition fields
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  -- Spaced repetition fields (SM-2 algorithm)
  ease_factor NUMERIC DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Flashcards RLS policies
CREATE POLICY "Users can view their own flashcards" 
ON public.flashcards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" 
ON public.flashcards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
ON public.flashcards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
ON public.flashcards FOR DELETE 
USING (auth.uid() = user_id);

-- Create translation history table
CREATE TABLE public.translation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on translation_history
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;

-- Translation history RLS policies
CREATE POLICY "Users can view their own translation history" 
ON public.translation_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own translation history" 
ON public.translation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own translation history" 
ON public.translation_history FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON public.flashcards(user_id, next_review_date);
CREATE INDEX idx_translation_history_user_id ON public.translation_history(user_id);
CREATE INDEX idx_translation_history_created_at ON public.translation_history(created_at DESC);