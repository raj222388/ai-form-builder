import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

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

interface FormPreviewProps {
  formId: string;
  fields: Field[];
}

export const FormPreview = ({ fields }: FormPreviewProps) => {
  const renderField = (field: Field) => {
    const commonProps = {
      id: field.field_name,
      placeholder: field.placeholder,
      required: field.required,
    };

    switch (field.field_type) {
      case "textarea":
        return <Textarea {...commonProps} className="resize-none" />;
      
      case "select":
        return (
          <Select>
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
            <Checkbox id={field.field_name} />
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
        return <Input {...commonProps} type={field.field_type} />;
    }
  };

  return (
    <Card className="p-6 bg-muted/30">
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <Eye className="w-5 h-5" />
        <h3 className="font-semibold">Live Preview</h3>
      </div>

      <Card className="p-6 bg-background">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.field_name}>
                {field.field_label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
          
          {fields.length > 0 && (
            <Button className="w-full bg-gradient-to-r from-primary to-accent">
              Submit Form
            </Button>
          )}
          
          {fields.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No fields yet. Add fields to see the preview.
            </p>
          )}
        </form>
      </Card>
    </Card>
  );
};