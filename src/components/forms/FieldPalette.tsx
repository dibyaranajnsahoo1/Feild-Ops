"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Type, Hash, List, CheckSquare, Calendar, Upload,
  AlignLeft, Mail, Phone,
} from "lucide-react";
import type { FieldType } from "@/types";

interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: "text", label: "Text", icon: Type, description: "Single line text" },
  { type: "textarea", label: "Text Area", icon: AlignLeft, description: "Multi-line text" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric value" },
  { type: "email", label: "Email", icon: Mail, description: "Email address" },
  { type: "phone", label: "Phone", icon: Phone, description: "Phone number" },
  { type: "dropdown", label: "Dropdown", icon: List, description: "Select from list" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Multiple choice" },
  { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
  { type: "file", label: "File Upload", icon: Upload, description: "Attach files" },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Field Types
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {FIELD_TYPES.map(({ type, label, icon: Icon, description }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => onAddField(type)}
            className="w-full justify-start gap-3 h-auto py-2.5 px-3 hover:bg-primary/5 group"
          >
            <div className="p-1.5 rounded bg-muted group-hover:bg-primary/10 transition-colors">
              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium">{label}</div>
              <div className="text-[10px] text-muted-foreground">{description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
