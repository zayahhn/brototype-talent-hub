import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, AlertCircle, Users, CheckCircle, Target, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  profiles: { name: string; email: string };
}

interface Student {
  id: string;
  verified: boolean;
  verified_at: string | null;
  course: string | null;
  skills: string[];
  profiles: { name: string; email: string };
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  date_completed: string;
  verified_by_admin: boolean;
  student_id: string;
  profiles: { name: string };
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
  const [students, setStudents] = useState<Student[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) { navigate("/dashboard"); return; }
    await Promise.all([fetchComplaints(), fetchStudentCount(), fetchStudents(), fetchMilestones()]);
    setLoading(false);
  };

  const fetchComplaints = async () => { const { data } = await supabase.from("complaints").select(`*, profiles:student_id (name, email)`).order("created_at", { ascending: false }); if (data) setComplaints(data as any); };
  const fetchStudentCount = async () => { const { count } = await supabase.from("students").select("*", { count: "exact", head: true }); setStudentCount(count || 0); };
  const fetchStudents = async () => { 
    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .order("verified", { ascending: true });
    
    if (error) {
      console.error("Error fetching students:", error);
      toast({ title: "Error loading students", description: error.message, variant: "destructive" });
    }
    if (data) setStudents(data as any); 
  };
  const fetchMilestones = async () => { const { data } = await supabase.from("milestones").select(`*, profiles:student_id (name)`).eq("verified_by_admin", false).order("created_at", { ascending: false }); if (data) setMilestones(data as any); };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      const { error } = await supabase.from("complaints").update({ status: selectedStatus, admin_notes: adminNotes }).eq("id", selectedComplaint.id);
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id: selectedComplaint.student_id, message: `Your complaint "${selectedComplaint.title}" status has been updated to ${selectedStatus}`, complaint_id: selectedComplaint.id });
      toast({ title: "Complaint updated", description: "Student has been notified" });
      setDialogOpen(false); setSelectedComplaint(null); setAdminNotes(""); fetchComplaints();
    } catch (error: any) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      const { error } = await supabase.from("complaints").delete().eq("id", complaintId);
      if (error) throw error;
      toast({ title: "Complaint deleted", description: "The complaint has been removed" });
      fetchComplaints();
    } catch (error: any) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); }
  };

  const handleVerifyStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from("students").update({ verified: true, verified_at: new Date().toISOString() }).eq("id", studentId);
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id: studentId, message: "Your profile has been verified by admin", type: "system" });
      toast({ title: "Student verified", description: "Student has been notified" });
      fetchStudents();
    } catch (error: any) { toast({ title: "Verification failed", description: error.message, variant: "destructive" }); }
  };

  const handleUnverifyStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from("students").update({ verified: false, verified_at: null }).eq("id", studentId);
      if (error) throw error;
      toast({ title: "Student unverified", description: "Verification status removed" });
      fetchStudents();
    } catch (error: any) { toast({ title: "Unverification failed", description: error.message, variant: "destructive" }); }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId);
      if (error) throw error;
      toast({ title: "Student deleted", description: "Student profile has been removed" });
      fetchStudents();
    } catch (error: any) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); }
  };

  const handleVerifyMilestone = async (milestoneId: string, studentId: string) => {
    try {
      const { error } = await supabase.from("milestones").update({ verified_by_admin: true }).eq("id", milestoneId);
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id: studentId, message: "Your milestone has been verified by admin", type: "milestone" });
      toast({ title: "Milestone verified", description: "Student has been notified" });
      fetchMilestones();
    } catch (error: any) { toast({ title: "Verification failed", description: error.message, variant: "destructive" }); }
  };

  const openComplaintDialog = (complaint: Complaint) => { setSelectedComplaint(complaint); setAdminNotes(complaint.admin_notes || ""); setSelectedStatus(complaint.status); setDialogOpen(true); };
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };
  const getStatusColor = (status: string) => { switch (status) { case "pending": return "bg-warning text-warning-foreground"; case "in_progress": return "bg-accent text-accent-foreground"; case "resolved": return "bg-success text-success-foreground"; default: return "bg-secondary"; } };

  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in_progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-depth-sm"><div className="container mx-auto px-4 py-4 flex items-center justify-between"><div><h1 className="text-2xl font-bold">Admin Dashboard</h1><p className="text-sm text-muted-foreground">Manage complaints and students</p></div><Button onClick={handleSignOut} variant="outline" className="gap-2"><LogOut className="h-4 w-4" />Sign Out</Button></div></header>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="complaints" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8"><TabsTrigger value="complaints">Complaints</TabsTrigger><TabsTrigger value="students">Students</TabsTrigger><TabsTrigger value="milestones">Milestones</TabsTrigger></TabsList>
          <TabsContent value="complaints">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="shadow-depth-md"><CardHeader className="pb-3"><CardDescription>Total Students</CardDescription><CardTitle className="text-3xl flex items-center gap-2"><Users className="h-6 w-6 text-accent" />{studentCount}</CardTitle></CardHeader></Card>
              <Card className="shadow-depth-md"><CardHeader className="pb-3"><CardDescription>Pending</CardDescription><CardTitle className="text-3xl flex items-center gap-2"><AlertCircle className="h-6 w-6 text-warning" />{pendingCount}</CardTitle></CardHeader></Card>
              <Card className="shadow-depth-md"><CardHeader className="pb-3"><CardDescription>In Progress</CardDescription><CardTitle className="text-3xl flex items-center gap-2"><AlertCircle className="h-6 w-6 text-accent" />{inProgressCount}</CardTitle></CardHeader></Card>
              <Card className="shadow-depth-md"><CardHeader className="pb-3"><CardDescription>Resolved</CardDescription><CardTitle className="text-3xl flex items-center gap-2"><AlertCircle className="h-6 w-6 text-success" />{resolvedCount}</CardTitle></CardHeader></Card>
            </div>
            <Card className="shadow-depth-lg"><CardHeader><CardTitle>All Complaints</CardTitle><CardDescription>View and manage student complaints</CardDescription></CardHeader><CardContent>{complaints.length === 0 ? <p className="text-center text-muted-foreground py-8">No complaints yet</p> : <div className="space-y-4">{complaints.map((complaint) => (<Card key={complaint.id} className="border-border"><CardContent className="pt-6"><div className="flex items-start justify-between gap-4"><div className="space-y-1 flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold">{complaint.title}</h3><Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge></div><p className="text-sm text-muted-foreground">By {complaint.profiles.name} • {complaint.profiles.email}</p><p className="text-sm text-muted-foreground">{new Date(complaint.created_at).toLocaleDateString()}</p></div><div className="flex gap-2"><Button size="sm" onClick={() => openComplaintDialog(complaint)}>Update</Button>{complaint.status === "resolved" && <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(complaint.id); }}><Trash2 className="h-4 w-4" /></Button>}</div></div></CardContent></Card>))}</div>}</CardContent></Card>
          </TabsContent>
          <TabsContent value="students"><Card className="shadow-depth-lg"><CardHeader><CardTitle>Student Verification</CardTitle><CardDescription>Manage student profiles and verification status</CardDescription></CardHeader><CardContent>{students.length === 0 ? <p className="text-center text-muted-foreground py-8">No students yet</p> : <div className="space-y-4">{students.map((student) => (<Card key={student.id} className="border-border"><CardContent className="pt-6"><div className="flex items-start justify-between gap-4"><div className="space-y-2 flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold">{student.profiles.name}</h3>{student.verified ? <Badge variant="outline" className="text-success border-success"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="outline" className="text-warning border-warning">Unverified</Badge>}</div><p className="text-sm text-muted-foreground">{student.profiles.email}</p>{student.course && <p className="text-sm">Course: {student.course}</p>}{student.skills && student.skills.length > 0 && <div className="flex flex-wrap gap-1">{student.skills.map((skill) => (<Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>))}</div>}</div><div className="flex gap-2">{!student.verified ? <Button size="sm" onClick={() => handleVerifyStudent(student.id)} className="gap-2"><CheckCircle className="h-4 w-4" />Verify</Button> : <Button size="sm" variant="outline" onClick={() => handleUnverifyStudent(student.id)}>Unverify</Button>}<Button size="sm" variant="destructive" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="h-4 w-4" /></Button></div></div></CardContent></Card>))}</div>}</CardContent></Card></TabsContent>
          <TabsContent value="milestones"><Card className="shadow-depth-lg"><CardHeader><CardTitle>Milestone Verification</CardTitle><CardDescription>Verify student milestones to display them publicly</CardDescription></CardHeader><CardContent>{milestones.length === 0 ? <p className="text-center text-muted-foreground py-8">No unverified milestones</p> : <div className="space-y-4">{milestones.map((milestone) => (<Card key={milestone.id} className="border-border"><CardContent className="pt-6"><div className="flex items-start justify-between gap-4"><div className="space-y-2 flex-1"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-accent" /><h3 className="font-semibold">{milestone.title}</h3></div><p className="text-sm text-muted-foreground">by {milestone.profiles.name}</p>{milestone.description && <p className="text-sm">{milestone.description}</p>}<p className="text-xs text-muted-foreground">Completed: {new Date(milestone.date_completed).toLocaleDateString()}</p></div><Button size="sm" onClick={() => handleVerifyMilestone(milestone.id, milestone.student_id)} className="gap-2"><CheckCircle className="h-4 w-4" />Verify</Button></div></CardContent></Card>))}</div>}</CardContent></Card></TabsContent>
        </Tabs>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Update Complaint</DialogTitle><DialogDescription>{selectedComplaint?.title}</DialogDescription></DialogHeader><div className="space-y-4"><div><p className="text-sm font-semibold mb-2">Description:</p><p className="text-sm text-muted-foreground">{selectedComplaint?.description}</p></div><div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={selectedStatus} onValueChange={setSelectedStatus}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="admin-notes">Admin Notes</Label><Textarea id="admin-notes" placeholder="Add notes or comments..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} /></div><Button onClick={handleUpdateComplaint} className="w-full">Update Complaint</Button></div></DialogContent></Dialog>
    </div>
  );
};

export default AdminDashboard;
