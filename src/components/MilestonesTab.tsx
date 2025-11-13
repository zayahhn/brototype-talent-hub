import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  date_completed: string;
  verified_by_admin: boolean;
  created_at: string;
}

interface MilestonesTabProps {
  milestones: Milestone[];
  studentId: string;
  onUpdate: () => void;
}

export const MilestonesTab = ({ milestones, studentId, onUpdate }: MilestonesTabProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !date) {
      toast({
        title: "Missing information",
        description: "Please fill in title and date",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("milestones")
        .insert({
          student_id: studentId,
          title,
          description,
          date_completed: date,
        });

      if (error) throw error;

      toast({
        title: "Milestone added",
        description: "Your milestone has been recorded",
      });

      setTitle("");
      setDescription("");
      setDate("");
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to add milestone",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-depth-md">
        <CardHeader>
          <CardTitle>Add New Milestone</CardTitle>
          <CardDescription>Track your learning achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="milestone-title">Title *</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Completed React Course"
            />
          </div>
          <div>
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="milestone-date">Date Completed *</Label>
            <Input
              id="milestone-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add Milestone
          </Button>
        </CardContent>
      </Card>

      {milestones.length === 0 ? (
        <Card className="shadow-depth-md">
          <CardContent className="py-8 text-center text-muted-foreground">
            No milestones yet. Add your first achievement!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="shadow-depth-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${milestone.verified_by_admin ? 'bg-success/20' : 'bg-muted'}`}>
                    {milestone.verified_by_admin ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                        {milestone.title}
                        {milestone.verified_by_admin && (
                          <Badge variant="outline" className="text-success border-success">
                            Verified
                          </Badge>
                        )}
                      </h3>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(milestone.date_completed), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
