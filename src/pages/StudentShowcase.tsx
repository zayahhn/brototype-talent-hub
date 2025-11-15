import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Github, FileText, LogIn, CheckCircle } from "lucide-react";
import { RecruiterContactModal } from "@/components/RecruiterContactModal";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Student {
  id: string;
  photo_url: string | null;
  course: string | null;
  skills: string[];
  bio: string | null;
  github_url: string | null;
  resume_url: string | null;
  availability: string;
  verified: boolean;
  profiles: {
    name: string;
    email: string;
  };
}

const StudentShowcase = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) =>
          student.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*, profiles(name, email)")
        .eq("verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setStudents(data as any);
        setFilteredStudents(data as any);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Brototype</h1>
            <p className="text-sm text-muted-foreground">Discover exceptional talent</p>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-5xl font-bold mb-4">Meet Our Students</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Browse profiles of talented students ready to make an impact
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, skills, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base shadow-depth-md"
            />
          </div>
        </div>
      </section>

      <section className="py-8 px-4 pb-20">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "No students match your search" : "No verified students found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="shadow-depth-lg hover:shadow-depth-xl transition-smooth">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold">
                        {student.profiles.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {student.profiles.name}
                          {student.verified && <CheckCircle className="h-5 w-5 text-success" />}
                        </CardTitle>
                        <CardDescription>{student.course || "Student"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {student.bio && <p className="text-sm text-muted-foreground line-clamp-2">{student.bio}</p>}
                    
                    {student.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {student.skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    )}

                    <Badge variant={student.availability === "available" ? "default" : "secondary"}>
                      {student.availability === "available" ? "Available" : "Not Available"}
                    </Badge>

                    <div className="flex gap-2 flex-wrap">
                      {student.github_url && (
                        <Button size="sm" variant="outline" onClick={() => window.open(student.github_url!, "_blank")}>
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </Button>
                      )}
                      {student.resume_url && (
                        <Button size="sm" variant="outline" onClick={() => window.open(student.resume_url!, "_blank")}>
                          <FileText className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}
                    </div>
                    
                    <RecruiterContactModal studentId={student.id} studentName={student.profiles.name} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2024 Brototype. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StudentShowcase;
