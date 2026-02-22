import { Bot, Send, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCoach } from "@/hooks/useCoach";

const Coach = () => {
  const { messages, input, setInput, loading, send, endRef } = useCoach("AI Coach (dedicated page)");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] max-md:h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground">Your personal deen companion</p>
      </div>

      <div className="flex-1 overflow-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Assalamu Alaikum! Ask me about your progress, goals, or anything about your deen journey.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <Card className={`max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="py-2 px-3">
                {msg.role === "assistant" ? (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </CardContent>
            </Card>
            {msg.role === "user" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && !messages[messages.length - 1]?.content && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <Card>
              <CardContent className="py-2 px-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Textarea
          placeholder="Ask your AI coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Coach;
