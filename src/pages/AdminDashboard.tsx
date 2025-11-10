import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, AlertCircle, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }

    await Promise.all([
      fetchComplaints(),
      fetchStudentCount(),
    ]);
    setLoading(false);
  };

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles:student_id (name, email)
      `)
      .order("created_at", { ascending: false });
    
    if (data) setComplaints(data as any);
  };

  const fetchStudentCount = async () => {
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    
    setStudentCount(count || 0);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: selectedStatus,
          admin_notes: adminNotes,
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      // Create notification for student
      await supabase
        .from("notifications")
        .insert({
          user_id: selectedComplaint.student_id,
          message: `Your complaint "${selectedComplaint.title}" status has been updated to ${selectedStatus}`,
          complaint_id: selectedComplaint.id,
        });

      toast({
        title: "Complaint updated",
        description: "Student has been notified",
      });

      setDialogOpen(false);
      setSelectedComplaint(null);
      setAdminNotes("");
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openComplaintDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.admin_notes || "");
    setSelectedStatus(complaint.status);
    setDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "in_progress":
        return "bg-accent text-accent-foreground";
      case "resolved":
        return "bg-success text-success-foreground";
      default:
        return "bg-secondary";
    }
  };

  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in_progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-depth-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage complaints and students</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-depth-md">
            <CardHeader className="pb-3">
              <CardDescription>Total Students</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                {studentCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-depth-md">
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-warning" />
                {pendingCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-depth-md">
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-accent" />
                {inProgressCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-depth-md">
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-success" />
                {resolvedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Complaints Table */}
        <Card className="shadow-depth-lg">
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <CardDescription>View and manage student complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No complaints yet</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="border-border cursor-pointer hover:border-accent transition-smooth"
                    onClick={() => openComplaintDialog(complaint)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <CardDescription>
                            By {complaint.profiles.name} • {new Date(complaint.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {complaint.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Complaint Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedComplaint?.profiles.name} on{" "}
              {selectedComplaint && new Date(selectedComplaint.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedComplaint?.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add notes or response for the student..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateComplaint}>
                Update Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
