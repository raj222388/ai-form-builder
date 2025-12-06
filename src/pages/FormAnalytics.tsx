import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Eye, Users, Calendar, Clock, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface Form {
  id: string;
  name: string;
  description: string | null;
  public_slug: string | null;
  created_at: string;
  is_public: boolean;
}

interface Field {
  id: string;
  field_name: string;
  required: boolean;
  field_label: string;
  field_type: string;
}

interface Submission {
  id: string;
  submission_data: Record<string, unknown>;
  submitted_at: string;
  ip_address: string | null;
}

const FormAnalytics = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'form_submissions',
          filter: `form_id=eq.${formId}`
        },
        (payload) => {
          setSubmissions(prev => [payload.new as Submission, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formId]);

  const loadData = async () => {
    if (!formId) return;

    try {
      const [formRes, fieldsRes, submissionsRes] = await Promise.all([
        supabase.from("forms").select("*").eq("id", formId).single(),
        supabase.from("form_fields").select("*").eq("form_id", formId).order("order_index"),
        supabase.from("form_submissions").select("*").eq("form_id", formId).order("submitted_at", { ascending: false }),
      ]);

      if (formRes.error) throw formRes.error;
      if (fieldsRes.error) throw fieldsRes.error;
      if (submissionsRes.error) throw submissionsRes.error;

      setForm(formRes.data);
      setFields(fieldsRes.data || []);
      setSubmissions((submissionsRes.data || []).map(s => ({
        ...s,
        submission_data: s.submission_data as Record<string, unknown>
      })));
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      setSubmissions(submissions.filter(s => s.id !== submissionId));
      toast({
        title: "Deleted",
        description: "Submission removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = ["Submitted At", ...fields.map(f => f.field_label)];
    const rows = submissions.map(sub => [
      new Date(sub.submitted_at).toLocaleString(),
      ...fields.map(f => String(sub.submission_data[f.field_name] || ""))
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.name || "form"}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFormPDF = () => {
    if (!form || fields.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(form.name, pageWidth / 2, 30, { align: "center" });

    // Description
    if (form.description) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(form.description, pageWidth / 2, 42, { align: "center" });
    }

    // Line separator
    pdf.setLineWidth(0.5);
    pdf.line(20, 50, pageWidth - 20, 50);

    // Fields
    let yPosition = 65;
    pdf.setFontSize(11);

    fields.forEach((field, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }

      // Field label
      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${field.field_label}${field.required ? " *" : ""}`, 20, yPosition);
      
      yPosition += 8;
      
      // Field input area (dotted line or box)
      pdf.setFont("helvetica", "normal");
      if (field.field_type === "textarea") {
        pdf.rect(20, yPosition, pageWidth - 40, 25);
        yPosition += 35;
      } else {
        pdf.line(20, yPosition + 5, pageWidth - 20, yPosition + 5);
        yPosition += 20;
      }
    });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(128);
    pdf.text("Generated by AI Form Builder", pageWidth / 2, 285, { align: "center" });

    pdf.save(`${form.name}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your printable form has been downloaded",
    });
  };

  const getPublicFormUrl = () => {
    if (!form?.public_slug) return null;
    return `${window.location.origin}/form/${form.public_slug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-8">
        <div className="container mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-8">
        <div className="container mx-auto">
          <p className="text-muted-foreground">Form not found</p>
        </div>
      </div>
    );
  }

  const publicUrl = getPublicFormUrl();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{form.name}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submissions.length}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fields.length}</p>
                <p className="text-sm text-muted-foreground">Form Fields</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {submissions.length > 0 
                    ? new Date(submissions[0].submitted_at).toLocaleDateString() 
                    : "No responses"}
                </p>
                <p className="text-sm text-muted-foreground">Latest Response</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium truncate">
                  {form.is_public ? "Public" : "Private"}
                </p>
                <p className="text-sm text-muted-foreground">Form Status</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Public Link & Actions */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Public Form Link</h3>
              {publicUrl ? (
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded text-sm flex-1 truncate">
                    {publicUrl}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      toast({ title: "Copied!", description: "Link copied to clipboard" });
                    }}
                  >
                    Copy
                  </Button>
                  <Link to={`/form/${form.public_slug}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No public link generated yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadFormPDF} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={exportToCSV} disabled={submissions.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Submissions Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Form Responses</h3>
          </div>
          
          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No responses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your form link to start collecting responses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    {fields.slice(0, 4).map(field => (
                      <TableHead key={field.id}>{field.field_label}</TableHead>
                    ))}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </TableCell>
                      {fields.slice(0, 4).map(field => (
                        <TableCell key={field.id} className="max-w-[200px] truncate">
                          {String(submission.submission_data[field.field_name] || "-")}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSubmission(submission.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FormAnalytics;