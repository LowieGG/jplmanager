"use client";
import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // toon native install prompt

    const { outcome } = await deferredPrompt.userChoice;
    console.log("User choice:", outcome);

    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <footer className="fixed bottom-0 w-full bg-gray-800 p-4 text-center">
      <button
        onClick={handleInstallClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        📲 Installeer deze app
      </button>
    </footer>
  );
}
