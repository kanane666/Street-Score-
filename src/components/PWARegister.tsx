import { useEffect } from "react";

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isPreview =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host.includes("lovable.app") === false && host === "localhost";

    if (isInIframe() || isPreview) {
      // Unregister any leftover service workers in preview
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
      }
      return;
    }

    // Lazy import the virtual module so it only runs in production builds
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({ immediate: true });
      })
      .catch(() => {
        // module not available in dev — fine
      });
  }, []);

  return null;
}
