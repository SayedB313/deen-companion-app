import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerChat, QUICK_MESSAGES } from "@/hooks/usePartnerChat";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";

interface Props {
  partnershipId: string | null;
  circleId?: string | null;
  partnerName?: string;
}

export default function PartnerChat({ partnershipId, circleId, partnerName }: Props) {
  const { user } = useAuth();
  const { messages, sendMessage } = usePartnerChat(partnershipId, circleId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    setSending(true);
    await sendMessage(content.trim());
    setText("");
    setSending(false);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <MessageCircle className="h-3 w-3" /> Chat
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">
            {partnerName ? `Chat with ${partnerName}` : "Circle Chat"}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 h-[40vh]">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Send some encouragement!
            </p>
          ) : (
            <div className="space-y-2 pb-2">
              {messages.map(m => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {format(new Date(m.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Quick messages */}
        <div className="px-4 py-2 flex gap-1.5 overflow-x-auto">
          {QUICK_MESSAGES.map(qm => (
            <Button
              key={qm}
              size="sm"
              variant="secondary"
              className="text-[10px] h-6 whitespace-nowrap shrink-0"
              onClick={() => handleSend(qm)}
              disabled={sending}
            >
              {qm}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 px-4 pb-4">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={280}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend(text)}
          />
          <Button size="icon" disabled={!text.trim() || sending} onClick={() => handleSend(text)}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
