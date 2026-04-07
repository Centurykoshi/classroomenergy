import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";

interface AddClassroomFormProps {
  value: {
    name: string;
    description: string;
    arduinoPin: string;
  };
  onChange: (next: { name: string; description: string; arduinoPin: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AddClassroomForm({ value, onChange, onSubmit, onCancel }: AddClassroomFormProps) {
  return (
    <Card className="mb-6 border-primary/25 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle>Add New Classroom</CardTitle>
        <CardDescription>Create a new classroom to control</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Classroom Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g., Class - 63"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <Input
              type="text"
              placeholder="Main classroom with automated lighting"
              value={value.description}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Arduino Pin (GPIO)</label>
            <Input
              type="number"
              placeholder="5 (for D1)"
              value={value.arduinoPin}
              onChange={(e) => onChange({ ...value, arduinoPin: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              D1=5, D2=4, D3=0, D4=2, D5=14, D6=12, D7=13, D8=15
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Create Classroom</Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
