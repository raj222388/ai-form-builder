-- Create forms table
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_fields table
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

-- Public read access for forms (anyone can view)
CREATE POLICY "Anyone can view forms"
ON public.forms FOR SELECT
USING (true);

-- Public read access for form fields
CREATE POLICY "Anyone can view form fields"
ON public.form_fields FOR SELECT
USING (true);

-- Public can create forms
CREATE POLICY "Anyone can create forms"
ON public.forms FOR INSERT
WITH CHECK (true);

-- Public can create form fields
CREATE POLICY "Anyone can create form fields"
ON public.form_fields FOR INSERT
WITH CHECK (true);

-- Public can update forms
CREATE POLICY "Anyone can update forms"
ON public.forms FOR UPDATE
USING (true);

-- Public can update form fields
CREATE POLICY "Anyone can update form fields"
ON public.form_fields FOR UPDATE
USING (true);

-- Public can delete forms
CREATE POLICY "Anyone can delete forms"
ON public.forms FOR DELETE
USING (true);

-- Public can delete form fields
CREATE POLICY "Anyone can delete form fields"
ON public.form_fields FOR DELETE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_form_fields_form_id ON public.form_fields(form_id);
CREATE INDEX idx_form_fields_order ON public.form_fields(form_id, order_index);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forms_updated_at
BEFORE UPDATE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();