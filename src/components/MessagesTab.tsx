import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Building } from "lucide-react";
import { format } from "date-fns";

interface RecruiterMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface MessagesTabProps {
  messages: RecruiterMessage[];
  onUpdate: () => void;
}

export const MessagesTab = ({ messages, onUpdate }: MessagesTabProps) => {
  const handleMarkRead = async (messageId: string) => {
    try {
      await supabase
        .from("recruiter_messages")
        .update({ is_read: true })
        .eq("id", messageId);
      
      onUpdate();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  if (messages.length === 0) {
    return (
      <Card className="shadow-depth-md">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No messages yet</p>
          <p className="text-sm mt-2">Recruiters will be able to contact you once your profile is verified</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card 
          key={message.id} 
          className={`shadow-depth-md transition-smooth ${!message.is_read ? 'border-primary border-2' : ''}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  {message.sender_name}
                  {!message.is_read && <Badge variant="default">New</Badge>}
                </CardTitle>
                {message.sender_company && (
                  <CardDescription className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {message.sender_company}
                  </CardDescription>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(message.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Reply to: <a href={`mailto:${message.sender_email}`} className="text-primary hover:underline">{message.sender_email}</a>
              </p>
              {!message.is_read && (
                <Button size="sm" variant="outline" onClick={() => handleMarkRead(message.id)}>
                  Mark as Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
