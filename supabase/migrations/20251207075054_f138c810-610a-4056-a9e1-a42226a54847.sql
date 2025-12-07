-- Add conditional logic column to form_fields table
ALTER TABLE public.form_fields 
ADD COLUMN conditional_logic jsonb DEFAULT NULL;

-- The conditional_logic structure will be:
-- {
--   "enabled": boolean,
--   "action": "show" | "hide",
--   "sourceFieldId": string,
--   "operator": "equals" | "not_equals" | "contains" | "not_empty",
--   "value": string
-- }

COMMENT ON COLUMN public.form_fields.conditional_logic IS 'JSON object defining when this field should be shown/hidden based on another field value';