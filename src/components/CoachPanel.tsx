import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, Loader2, MessageCircle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCoach, PAGE_CONTEXT_MAP } from "@/hooks/useCoach";

function ChatBody({ compact }: { compact?: boolean }) {
  const location = useLocation();
  const pageContext = PAGE_CONTEXT_MAP[location.pathname];
  const { messages, input, setInput, loading, send, endRef } = useCoach(pageContext);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-3 p-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me anything about your deen journey.</p>
            {pageContext && (
              <p className="text-xs mt-1 opacity-70">Context: {pageContext}</p>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <Card className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="py-1.5 px-2.5">
                {msg.role === "assistant" ? (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-1.5 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        {loading && !messages[messages.length - 1]?.content && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <Card>
              <CardContent className="py-1.5 px-2.5">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 p-3 border-t">
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
          className="min-h-[40px] max-h-24 resize-none text-sm"
          rows={1}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CoachPanel() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isCoachPage = location.pathname === "/coach";

  // Don't show FAB on the dedicated coach page
  if (isCoachPage) return null;

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-20 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Open AI Coach"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="flex items-center justify-between py-2 px-4">
              <DrawerTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" /> AI Coach
              </DrawerTitle>
            </DrawerHeader>
            <ChatBody compact />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle AI Coach">
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> AI Coach
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ChatBody />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
