import { useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bball_install_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function InstallBanner() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInIframe() || isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS()) {
      setShow(true);
      setIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // noop
    }
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold">Installer StreetScore</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {iosHint
              ? "Sur iOS : appuyez sur Partager puis « Sur l'écran d'accueil »."
              : "Ajoutez l'app à votre écran d'accueil pour un accès rapide hors-ligne."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {!iosHint && (
            <button
              onClick={install}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Installer
            </button>
          )}
          <button onClick={dismiss} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
