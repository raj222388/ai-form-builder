import { useState, useEffect } from "react";
import { FileText, Trash2, Eye, BarChart3, Link as LinkIcon, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Form {
  id: string;
  name: string;
  description: string;
  created_at: string;
  public_slug: string | null;
  is_public: boolean;
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

  const generatePublicLink = async (formId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const slug = `form-${formId.slice(0, 8)}-${Date.now().toString(36)}`;
      
      const { error } = await supabase
        .from("forms")
        .update({ public_slug: slug, is_public: true })
        .eq("id", formId);

      if (error) throw error;

      setForms(forms.map(f => f.id === formId ? { ...f, public_slug: slug, is_public: true } : f));
      
      const publicUrl = `${window.location.origin}/form/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      
      toast({
        title: "Link generated!",
        description: "Public form link copied to clipboard",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate public link",
        variant: "destructive",
      });
    }
  };

  const copyPublicLink = (slug: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const publicUrl = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Copied!",
      description: "Public form link copied to clipboard",
    });
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
              <div className="flex gap-1">
                <Link to={`/analytics/${form.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </Link>
                {form.public_slug ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => copyPublicLink(form.public_slug!, e)}
                    title="Copy Public Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => generatePublicLink(form.id, e)}
                    title="Generate Public Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
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
            <div className="flex items-center gap-2 mt-3">
              <p className="text-xs text-muted-foreground">
                Created {new Date(form.created_at).toLocaleDateString()}
              </p>
              {form.public_slug && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Public
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};