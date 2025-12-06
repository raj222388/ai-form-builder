-- Create form_submissions table to store individual submissions
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public form submissions (anyone can submit)
CREATE POLICY "Anyone can submit forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create policy for viewing submissions (anyone for now, can be restricted later)
CREATE POLICY "Anyone can view submissions" 
ON public.form_submissions 
FOR SELECT 
USING (true);

-- Create policy for deleting submissions
CREATE POLICY "Anyone can delete submissions" 
ON public.form_submissions 
FOR DELETE 
USING (true);

-- Add is_public and public_slug columns to forms table
ALTER TABLE public.forms 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN public_slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_forms_public_slug ON public.forms(public_slug);

-- Enable realtime for submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_submissions;