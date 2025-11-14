import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentProfile {
  photo_url: string | null;
  course: string | null;
  skills: string[];
  bio: string | null;
  github_url: string | null;
  availability: string;
}

interface Profile {
  name: string;
  email: string;
}

interface Milestone {
  title: string;
  description: string | null;
  date_completed: string;
  verified_by_admin: boolean;
}

interface ResumeBuilderProps {
  profile: Profile;
  studentProfile: StudentProfile;
  milestones: Milestone[];
}

export const ResumeBuilder = ({ profile, studentProfile, milestones }: ResumeBuilderProps) => {
  const { toast } = useToast();

  const generateResume = () => {
    // Create resume HTML content
    const resumeHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${profile.name} - Resume</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
          }
          h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #000;
          }
          h2 {
            font-size: 20px;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 16px;
            color: #000;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
          }
          .contact {
            font-size: 14px;
            color: #666;
            margin-bottom: 24px;
          }
          .contact a {
            color: #0066cc;
            text-decoration: none;
          }
          .bio {
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 24px;
            color: #333;
          }
          .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 24px;
          }
          .skill-tag {
            background: #f5f5f5;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            color: #333;
            border: 1px solid #e0e0e0;
          }
          .milestone {
            margin-bottom: 20px;
            padding-left: 20px;
            border-left: 3px solid #000;
          }
          .milestone-title {
            font-weight: 600;
            font-size: 16px;
            color: #000;
          }
          .milestone-date {
            font-size: 13px;
            color: #666;
            margin-bottom: 4px;
          }
          .milestone-desc {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
          }
          .availability {
            display: inline-block;
            background: #e8f5e9;
            color: #2e7d32;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 24px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>${profile.name}</h1>
        <div class="contact">
          ${profile.email}
          ${studentProfile.github_url ? ` | <a href="${studentProfile.github_url}" target="_blank">GitHub</a>` : ''}
        </div>
        
        ${studentProfile.availability === 'available' ? '<div class="availability">Available for Opportunities</div>' : ''}
        
        ${studentProfile.bio ? `
          <h2>About</h2>
          <div class="bio">${studentProfile.bio}</div>
        ` : ''}
        
        ${studentProfile.course ? `
          <h2>Education</h2>
          <div class="milestone">
            <div class="milestone-title">${studentProfile.course}</div>
          </div>
        ` : ''}
        
        ${studentProfile.skills.length > 0 ? `
          <h2>Skills</h2>
          <div class="skills">
            ${studentProfile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        ` : ''}
        
        ${milestones.filter(m => m.verified_by_admin).length > 0 ? `
          <h2>Achievements & Milestones</h2>
          ${milestones
            .filter(m => m.verified_by_admin)
            .map(milestone => `
              <div class="milestone">
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-date">${new Date(milestone.date_completed).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                ${milestone.description ? `<div class="milestone-desc">${milestone.description}</div>` : ''}
              </div>
            `).join('')}
        ` : ''}
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([resumeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, '_')}_Resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Resume generated",
      description: "Your resume has been downloaded. Open it in a browser and print to PDF.",
    });
  };

  return (
    <Card className="shadow-depth-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Builder
        </CardTitle>
        <CardDescription>
          Generate a professional resume from your profile data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What's included:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Your profile information and bio</li>
            <li>Skills and expertise</li>
            <li>Verified milestones and achievements</li>
            <li>Contact information</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <Button onClick={generateResume} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Generate Resume
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Downloads as HTML. Open in browser and print to save as PDF.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
