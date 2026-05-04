import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import streetscoreLogo from "@/assets/streetscore-logo.png";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <img src={streetscoreLogo} alt="" aria-hidden className="h-10 w-auto object-contain" />
            <DialogTitle className="text-lg font-bold tracking-tight">À propos</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <section>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Application</p>
            <p className="text-sm font-semibold text-foreground">StreetScore</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Application simple de scoreboard basket, conçue pour une utilisation rapide sur terrain, sans connexion internet.
            </p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Créateur</p>
            <p className="text-sm font-semibold text-foreground">Ababacar Dieng</p>
            <p className="text-sm text-muted-foreground">Ingénieur en génie logiciel</p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
            <a
              href="mailto:diengbabacar666@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all"
            >
              <Mail className="h-4 w-4 shrink-0" />
              diengbabacar666@gmail.com
            </a>
          </section>

          <p className="text-xs italic text-muted-foreground text-center pt-2 border-t border-border">
            Made for street basketball 🏀
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
