-- Create user_usage table to track API usage
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'transcribe' or 'translate'
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- User usage RLS policies
CREATE POLICY "Users can view their own usage" 
ON public.user_usage FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can insert usage (from Edge Functions)
CREATE POLICY "Service role can insert usage" 
ON public.user_usage FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_user_usage_user_id_created_at ON public.user_usage(user_id, created_at);
