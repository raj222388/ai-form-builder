import { ChevronDown, ChevronUp, GitBranch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface ConditionalLogic {
  enabled: boolean;
  action: "show" | "hide";
  sourceFieldId: string;
  operator: "equals" | "not_equals" | "contains" | "not_empty";
  value: string;
}

interface Field {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
}

interface ConditionalLogicEditorProps {
  fieldId: string;
  conditionalLogic: ConditionalLogic | null;
  otherFields: Field[];
  onUpdate: (logic: ConditionalLogic | null) => void;
}

export const ConditionalLogicEditor = ({
  fieldId,
  conditionalLogic,
  otherFields,
  onUpdate,
}: ConditionalLogicEditorProps) => {
  const [isOpen, setIsOpen] = useState(!!conditionalLogic?.enabled);
  
  const availableFields = otherFields.filter(f => f.id !== fieldId);
  
  const defaultLogic: ConditionalLogic = {
    enabled: false,
    action: "show",
    sourceFieldId: "",
    operator: "equals",
    value: "",
  };

  const logic = conditionalLogic || defaultLogic;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onUpdate({ ...logic, enabled: true });
    } else {
      onUpdate({ ...logic, enabled: false });
    }
  };

  const handleUpdate = (updates: Partial<ConditionalLogic>) => {
    onUpdate({ ...logic, ...updates });
  };

  if (availableFields.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            Conditional Logic
            {logic.enabled && <span className="text-primary">(Active)</span>}
          </span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Enable conditional logic</Label>
          <Switch
            checked={logic.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {logic.enabled && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Action</Label>
                <Select
                  value={logic.action}
                  onValueChange={(val) => handleUpdate({ action: val as "show" | "hide" })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show this field</SelectItem>
                    <SelectItem value="hide">Hide this field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">When</Label>
                <Select
                  value={logic.sourceFieldId}
                  onValueChange={(val) => handleUpdate({ sourceFieldId: val })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.field_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Operator</Label>
                <Select
                  value={logic.operator}
                  onValueChange={(val) => handleUpdate({ operator: val as ConditionalLogic["operator"] })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="not_empty">Is not empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {logic.operator !== "not_empty" && (
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={logic.value}
                    onChange={(e) => handleUpdate({ value: e.target.value })}
                    placeholder="Enter value"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Helper function to evaluate conditional logic
export const evaluateConditionalLogic = (
  logic: ConditionalLogic | null,
  formData: Record<string, any>,
  fields: { id: string; field_name: string }[]
): boolean => {
  if (!logic || !logic.enabled) {
    return true; // No logic = always visible
  }

  const sourceField = fields.find(f => f.id === logic.sourceFieldId);
  if (!sourceField) {
    return true; // Source field not found = show field
  }

  const sourceValue = formData[sourceField.field_name];
  const targetValue = logic.value;

  let conditionMet = false;

  switch (logic.operator) {
    case "equals":
      conditionMet = String(sourceValue || "").toLowerCase() === targetValue.toLowerCase();
      break;
    case "not_equals":
      conditionMet = String(sourceValue || "").toLowerCase() !== targetValue.toLowerCase();
      break;
    case "contains":
      conditionMet = String(sourceValue || "").toLowerCase().includes(targetValue.toLowerCase());
      break;
    case "not_empty":
      conditionMet = sourceValue !== undefined && sourceValue !== "" && sourceValue !== null && sourceValue !== false;
      break;
  }

  // If action is "show", return conditionMet (show when condition is true)
  // If action is "hide", return !conditionMet (hide when condition is true)
  return logic.action === "show" ? conditionMet : !conditionMet;
};