'use client';
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Home() {
  const { data: session } = useSession();

  useEffect(() => {
    // Debug service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        console.log('Service Worker on home page:', reg);
      });
    }

    // Debug install prompt
    const handler = (e: Event) => {
      console.log('beforeinstallprompt fired on home page!', e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <>
      <Navbar />
      <div className="text-center mt-20">
        <h1 className="text-4xl font-bold mb-4">JPL Pronostiek</h1>

        {session ? (
          <>
            <p className="mb-4">Welkom, {session.user?.name}!</p>
          </>
        ) : (
          <p className="text-gray-700">Je bent niet ingelogd.</p>
        )}
      </div>
    </>
  );
}