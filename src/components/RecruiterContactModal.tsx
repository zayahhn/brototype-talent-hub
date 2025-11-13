import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RecruiterContactModalProps {
  studentId: string;
  studentName: string;
}

export const RecruiterContactModal = ({ studentId, studentName }: RecruiterContactModalProps) => {
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderCompany, setSenderCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert recruiter message
      const { error: messageError } = await supabase
        .from('recruiter_messages')
        .insert({
          student_id: studentId,
          sender_name: senderName,
          sender_email: senderEmail,
          sender_company: senderCompany,
          message: message,
        });

      if (messageError) throw messageError;

      // Create notification for student
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          message: `New message from ${senderName}${senderCompany ? ` at ${senderCompany}` : ''}`,
          type: 'recruiter_message',
        });

      if (notifError) throw notifError;

      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${studentName}`,
      });

      // Reset form
      setSenderName("");
      setSenderEmail("");
      setSenderCompany("");
      setMessage("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Mail className="h-4 w-4" />
          Contact Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {studentName}</DialogTitle>
          <DialogDescription>
            Send a message to this student. They will receive a notification.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Your Email *</Label>
            <Input
              id="email"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              required
              placeholder="john@company.com"
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={senderCompany}
              onChange={(e) => setSenderCompany(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="I'd like to discuss potential opportunities..."
              rows={5}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
