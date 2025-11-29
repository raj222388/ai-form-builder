import { useState, useEffect } from "react";
import { FileText, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Form {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface FormsListProps {
  onSelectForm: (formId: string) => void;
}

export const FormsList = ({ onSelectForm }: FormsListProps) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      console.error("Error loading forms:", error);
      toast({
        title: "Error",
        description: "Failed to load forms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteForm = async (formId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", formId);

      if (error) throw error;

      setForms(forms.filter(f => f.id !== formId));
      toast({
        title: "Form deleted",
        description: "Form and its fields have been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading forms...</p>
      </Card>
    );
  }

  if (forms.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Forms</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card
            key={form.id}
            className="p-6 hover:shadow-medium transition-all duration-300 cursor-pointer group"
            onClick={() => onSelectForm(form.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectForm(form.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={(e) => deleteForm(form.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">{form.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {form.description}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Created {new Date(form.created_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};