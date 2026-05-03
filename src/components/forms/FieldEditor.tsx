"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp, ChevronDown, Trash2, GripVertical,
  ChevronRight, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IFormField } from "@/types";

interface FieldEditorProps {
  field: IFormField;
  index: number;
  totalFields: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<IFormField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FIELD_TYPE_BADGE: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  textarea: "bg-indigo-100 text-indigo-700",
  number: "bg-purple-100 text-purple-700",
  email: "bg-cyan-100 text-cyan-700",
  phone: "bg-teal-100 text-teal-700",
  dropdown: "bg-orange-100 text-orange-700",
  checkbox: "bg-green-100 text-green-700",
  date: "bg-rose-100 text-rose-700",
  file: "bg-slate-100 text-slate-700",
};

export default function FieldEditor({
  field,
  index,
  totalFields,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: FieldEditorProps) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (!newOption.trim()) return;
    onUpdate({ options: [...(field.options ?? []), newOption.trim()] });
    setNewOption("");
  };

  const removeOption = (opt: string) => {
    onUpdate({ options: (field.options ?? []).filter((o) => o !== opt) });
  };

  const hasOptions = field.type === "dropdown" || field.type === "checkbox";

  return (
    <div
      className={cn(
        "border rounded-lg transition-all",
        isEditing ? "border-primary/50 shadow-sm" : "border-border"
      )}
    >
      {/* Header Row */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 rounded-t-lg"
        onClick={onEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onEdit()}
        aria-expanded={isEditing}
        aria-label={`Edit field: ${field.label}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide capitalize",
            FIELD_TYPE_BADGE[field.type] ?? "bg-muted text-muted-foreground"
          )}
        >
          {field.type}
        </span>

        <span className="text-sm font-medium flex-1 truncate">{field.label}</span>

        {field.required && (
          <span className="text-[10px] text-destructive font-medium">Required</span>
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move field up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={index === totalFields - 1}
            aria-label="Move field down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove field"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0",
            isEditing && "rotate-90"
          )}
        />
      </div>

      {/* Expanded Editor */}
      {isEditing && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Field Label *</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Field label"
              />
            </div>
            <div>
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Optional placeholder"
              />
            </div>
          </div>

          {field.type === "number" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Min Value</Label>
                <Input
                  type="number"
                  value={field.validation?.min ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Max Value</Label>
                <Input
                  type="number"
                  value={field.validation?.max ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Help Text</Label>
            <Input
              value={field.helpText ?? ""}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              className="mt-1 h-8 text-sm"
              placeholder="Optional guidance for users"
            />
          </div>

          {hasOptions && (
            <div>
              <Label className="text-xs">Options</Label>
              <div className="mt-1 space-y-1.5">
                {(field.options ?? []).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Input value={opt} readOnly className="h-7 text-xs flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => removeOption(opt)}
                      aria-label={`Remove option: ${opt}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                    className="h-7 text-xs"
                    placeholder="Add option..."
                  />
                  <Button size="sm" variant="outline" onClick={addOption} className="h-7 text-xs px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Switch
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(val) => onUpdate({ required: val })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
              This field is required
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
