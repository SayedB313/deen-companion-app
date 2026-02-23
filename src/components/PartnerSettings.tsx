import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Copy, UserMinus } from "lucide-react";
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PartnerSettings() {
  const { isActive, isPending, inviteCode, partnerName, dissolve, loading } = useAccountabilityPartner();
  const { toast } = useToast();

  if (loading) return null;
  if (!isActive && !isPending) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> Accountability Partner
        </CardTitle>
        <CardDescription>
          {isActive ? `Partnered with ${partnerName}` : "Waiting for partner to join"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {inviteCode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Invite code:</span>
            <code className="bg-muted px-2 py-1 rounded font-mono text-sm tracking-widest">{inviteCode}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              toast({ title: "Copied!" });
            }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserMinus className="h-4 w-4 mr-2" /> Dissolve Partnership
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dissolve partnership?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end the accountability link. Both partners will need to create a new invite to re-link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={dissolve}>Dissolve</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
