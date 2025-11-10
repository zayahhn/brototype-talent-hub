import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, MessageSquare, Bell } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface StudentProfile {
  id: string;
  photo_url: string | null;
  course: string | null;
  skills: string[];
  bio: string | null;
  github_url: string | null;
  resume_url: string | null;
  availability: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Form states
  const [course, setCourse] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [availability, setAvailability] = useState("not_available");
  const [skills, setSkills] = useState<string[]>([]);

  // Complaint form
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    await Promise.all([
      fetchProfile(user.id),
      fetchStudentProfile(user.id),
      fetchComplaints(user.id),
    ]);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  };

  const fetchStudentProfile = async (userId: string) => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setStudentProfile(data);
      setCourse(data.course || "");
      setBio(data.bio || "");
      setGithubUrl(data.github_url || "");
      setAvailability(data.availability || "not_available");
      setSkills(data.skills || []);
    }
  };

  const fetchComplaints = async (userId: string) => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) setComplaints(data);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("students")
        .upsert({
          id: profile.id,
          course,
          bio,
          github_url: githubUrl,
          availability,
          skills,
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      fetchStudentProfile(profile.id);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmitComplaint = async () => {
    if (!profile || !complaintTitle.trim() || !complaintDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("complaints")
        .insert({
          student_id: profile.id,
          title: complaintTitle,
          description: complaintDescription,
        });

      if (error) throw error;

      toast({
        title: "Complaint submitted",
        description: "Your complaint has been sent to admin",
      });

      setComplaintTitle("");
      setComplaintDescription("");
      fetchComplaints(profile.id);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
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
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.name}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Complaints
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="shadow-depth-lg">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Update your information to be visible to recruiters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={profile?.name || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile?.email || ""} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    placeholder="e.g., Full Stack Development"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/yourusername"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      placeholder="Add a skill"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    />
                    <Button type="button" onClick={handleAddSkill}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <select
                    id="availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="available">Available</option>
                    <option value="not_available">Not Available</option>
                  </select>
                </div>

                <Button onClick={handleUpdateProfile} className="w-full md:w-auto">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints" className="mt-6 space-y-6">
            {/* Submit New Complaint */}
            <Card className="shadow-depth-lg">
              <CardHeader>
                <CardTitle>Submit a Complaint</CardTitle>
                <CardDescription>
                  Let us know about any concerns or issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complaint-title">Title</Label>
                  <Input
                    id="complaint-title"
                    placeholder="Brief summary of your concern"
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complaint-description">Description</Label>
                  <Textarea
                    id="complaint-description"
                    placeholder="Provide details about your complaint..."
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitComplaint}>Submit Complaint</Button>
              </CardContent>
            </Card>

            {/* Complaints List */}
            <Card className="shadow-depth-lg">
              <CardHeader>
                <CardTitle>Your Complaints</CardTitle>
                <CardDescription>Track the status of your submitted complaints</CardDescription>
              </CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No complaints submitted yet</p>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <Card key={complaint.id} className="border-border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{complaint.title}</CardTitle>
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            Submitted {new Date(complaint.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{complaint.description}</p>
                          {complaint.admin_notes && (
                            <div className="mt-3 p-3 bg-secondary rounded-md">
                              <p className="text-sm font-medium mb-1">Admin Response:</p>
                              <p className="text-sm text-muted-foreground">{complaint.admin_notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
