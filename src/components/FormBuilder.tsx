import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormPreview } from "./FormPreview";

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

interface FormBuilderProps {
  formId: string;
  onClose: () => void;
}

export const FormBuilder = ({ formId, onClose }: FormBuilderProps) => {
  const [form, setForm] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    setIsLoading(true);
    try {
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (formError) throw formError;
      setForm(formData);

      const { data: fieldsData, error: fieldsError } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", formId)
        .order("order_index");

      if (fieldsError) throw fieldsError;
      setFields((fieldsData || []).map(f => ({
        ...f,
        options: f.options as string[] | null
      })));
    } catch (error: any) {
      console.error("Error loading form:", error);
      toast({
        title: "Error",
        description: "Failed to load form",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addField = async () => {
    try {
      const newField = {
        form_id: formId,
        field_name: `field_${Date.now()}`,
        field_type: "text",
        field_label: "New Field",
        placeholder: "",
        required: false,
        options: null,
        order_index: fields.length,
      };

      const { data, error } = await supabase
        .from("form_fields")
        .insert(newField)
        .select()
        .single();

      if (error) throw error;
      setFields([...fields, { ...data, options: data.options as string[] | null }]);
      
      toast({
        title: "Field added",
        description: "New field added to the form",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add field",
        variant: "destructive",
      });
    }
  };

  const updateField = async (fieldId: string, updates: Partial<Field>) => {
    try {
      const { error } = await supabase
        .from("form_fields")
        .update(updates)
        .eq("id", fieldId);

      if (error) throw error;

      setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from("form_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;

      setFields(fields.filter(f => f.id !== fieldId));
      
      toast({
        title: "Field deleted",
        description: "Field removed from the form",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading form...</p>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{form?.name}</h2>
            <p className="text-sm text-muted-foreground">{form?.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4 border-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Field Label</Label>
                        <Input
                          value={field.field_label}
                          onChange={(e) => updateField(field.id, { field_label: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Field Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(value) => updateField(field.id, { field_type: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => 
                          updateField(field.id, { required: checked as boolean })
                        }
                      />
                      <Label className="text-sm">Required field</Label>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteField(field.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={addField} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </Card>

      {/* Preview */}
      <div className="lg:sticky lg:top-8 h-fit">
        <FormPreview formId={formId} fields={fields} />
      </div>
    </div>
  );
};