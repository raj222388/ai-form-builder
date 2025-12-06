import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Field {
  id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  required: boolean;
  options: string[] | null;
  order_index: number;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
}

const PublicForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    if (!slug) {
      setError("Form not found");
      setIsLoading(false);
      return;
    }

    try {
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("public_slug", slug)
        .maybeSingle();

      if (formError) throw formError;
      if (!formData) {
        setError("Form not found");
        setIsLoading(false);
        return;
      }

      if (!formData.is_public) {
        setError("This form is not publicly available");
        setIsLoading(false);
        return;
      }

      setForm(formData);

      const { data: fieldsData, error: fieldsError } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", formData.id)
        .order("order_index");

      if (fieldsError) throw fieldsError;
      setFields((fieldsData || []).map(f => ({
        ...f,
        options: f.options as string[] | null
      })));
    } catch (err: any) {
      console.error("Error loading form:", err);
      setError("Failed to load form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.field_name]) {
        toast({
          title: "Validation Error",
          description: `${field.field_label} is required`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { error: submitError } = await supabase
        .from("form_submissions")
        .insert({
          form_id: form.id,
          submission_data: formData,
          user_agent: navigator.userAgent,
        });

      if (submitError) throw submitError;

      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "Your response has been submitted",
      });
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast({
        title: "Submission Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: Field) => {
    const value = formData[field.field_name] || "";

    switch (field.field_type) {
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => updateFormData(field.field_name, e.target.value)}
            className="resize-none"
          />
        );
      
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => updateFormData(field.field_name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, i) => (
                <SelectItem key={i} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.field_name}
              checked={value === true}
              onCheckedChange={(checked) => updateFormData(field.field_name, checked)}
            />
            <label htmlFor={field.field_name} className="text-sm">
              {field.placeholder || field.field_label}
            </label>
          </div>
        );
      
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.field_name}
                  id={`${field.field_name}_${i}`}
                  value={option}
                  checked={value === option}
                  onChange={() => updateFormData(field.field_name, option)}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor={`${field.field_name}_${i}`} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            type={field.field_type}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => updateFormData(field.field_name, e.target.value)}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground">Your response has been recorded successfully.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background py-12 px-4">
      <Card className="max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{form?.name}</h1>
          {form?.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.field_type !== "checkbox" && (
                <Label htmlFor={field.field_name}>
                  {field.field_label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              )}
              {renderField(field)}
            </div>
          ))}
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PublicForm;