import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface QuickFormField {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "email" | "tel" | "textarea";
  required?: boolean;
}

interface QuickFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: QuickFormField[];
  submitLabel?: string;
  successMessage?: (values: Record<string, string>) => string;
  onSubmit?: (values: Record<string, string>) => void;
}

/**
 * Reusable dialog used by the "Add / Schedule / New ..." actions across views.
 */
export function QuickFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  submitLabel = "Save",
  successMessage,
  onSubmit,
}: QuickFormDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && !values[f.name]?.trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setError("");
    onSubmit?.(values);
    toast.success(successMessage ? successMessage(values) : `${title} saved`);
    setValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}
              >
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
