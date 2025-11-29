import { useState } from "react";
import { Sparkles, FormInput, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormBuilder } from "@/components/FormBuilder";
import { FormsList } from "@/components/FormsList";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [formName, setFormName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!formName.trim()) {
      toast({
        title: "Form name required",
        description: "Please enter a name for your form",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Call edge function to generate fields using AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "generate-form-fields",
        {
          body: { formName: formName.trim() },
        }
      );

      if (aiError) throw aiError;
      if (!aiData?.fields) throw new Error("No fields generated");

      // Create the form in database
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .insert({
          name: formName.trim(),
          description: `AI-generated ${formName} form`,
        })
        .select()
        .single();

      if (formError) throw formError;

      // Insert generated fields
      const fieldsToInsert = aiData.fields.map((field: any, index: number) => ({
        form_id: formData.id,
        field_name: field.field_name,
        field_type: field.field_type,
        field_label: field.field_label,
        placeholder: field.placeholder || "",
        required: field.required,
        options: field.options || null,
        order_index: index,
      }));

      const { error: fieldsError } = await supabase
        .from("form_fields")
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      toast({
        title: "Form generated!",
        description: `Created ${aiData.fields.length} fields for your ${formName} form`,
      });

      setCurrentFormId(formData.id);
      setFormName("");
    } catch (error: any) {
      console.error("Error generating form:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate form",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      {/* Hero Section */}
      <header 
        className="container mx-auto px-4 py-16 text-center relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/70" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-primary font-medium animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Form Builder</span>
          </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Generate Forms Instantly
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
          Simply describe your form, and our AI will create all the fields you need. 
          Then customize it to perfection.
        </p>

        {/* Generation Input */}
        <Card className="max-w-2xl mx-auto p-6 shadow-medium backdrop-blur-sm bg-card/95 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Job Application, Contact Form, Survey..."
                className="text-lg h-12"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Form
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <Card className="p-6 hover:shadow-medium transition-shadow duration-300 backdrop-blur-sm bg-card/95 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-400">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Our AI understands context and generates relevant fields automatically
            </p>
          </Card>

          <Card className="p-6 hover:shadow-medium transition-shadow duration-300 backdrop-blur-sm bg-card/95 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <FormInput className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Fully Customizable</h3>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove fields with our intuitive editor
            </p>
          </Card>

          <Card className="p-6 hover:shadow-medium transition-shadow duration-300 backdrop-blur-sm bg-card/95 animate-in fade-in slide-in-from-bottom-9 duration-700 delay-600">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Layout className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Instant Preview</h3>
            <p className="text-sm text-muted-foreground">
              See your form come to life in real-time as you build
            </p>
          </Card>
        </div>
        </div>
      </header>

      {/* Form Builder Section */}
      {currentFormId && (
        <section className="container mx-auto px-4 pb-16">
          <FormBuilder formId={currentFormId} onClose={() => setCurrentFormId(null)} />
        </section>
      )}

      {/* Forms List */}
      <section className="container mx-auto px-4 pb-16">
        <FormsList onSelectForm={setCurrentFormId} />
      </section>
    </div>
  );
};

export default Index;