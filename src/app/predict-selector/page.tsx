'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface MatchdayStatus {
  matchday: number;
  hasMatches: boolean;
  hasPredictions: boolean;
  resultsAvailable: boolean;
  matchCount: number;
  predictionCount: number;
}

export default function MatchdaySelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matchdayStatuses, setMatchdayStatuses] = useState<MatchdayStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchdayStatuses = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const statuses: MatchdayStatus[] = [];

      for (let matchday = 1; matchday <= 15; matchday++) {
        try {
          const matchesRes = await fetch(`/api/matches?matchday=${matchday}`);
          const matches = matchesRes.ok ? await matchesRes.json() : [];

          const predictionsRes = await fetch(`/api/predictions?matchday=${matchday}`);
          const predictionsData = predictionsRes.ok ? await predictionsRes.json() : {};

          statuses.push({
            matchday,
            hasMatches: matches.length > 0,
            hasPredictions: predictionsData.predictions?.length > 0,
            resultsAvailable: predictionsData.resultsAvailable || false,
            matchCount: matches.length,
            predictionCount: predictionsData.predictions?.length || 0,
          });
        } catch (error) {
          console.error(`Error fetching matchday ${matchday}:`, error);
          statuses.push({
            matchday,
            hasMatches: false,
            hasPredictions: false,
            resultsAvailable: false,
            matchCount: 0,
            predictionCount: 0,
          });
        }
      }

      setMatchdayStatuses(statuses);
      setLoading(false);
    };

    fetchMatchdayStatuses();
  }, [session?.user?.id]);

  const handleMatchdayClick = (matchday: number, isClickable: boolean) => {
    if (isClickable) router.push(`/predict?matchday=${matchday}`);
  };

  if (!session) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto mt-8 p-6 text-center">
          Je moet inloggen om je voorspellingen te bekijken.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto mt-8 p-6 text-center">
          Laden...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Kies een Speeldag</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {matchdayStatuses.map((status) => {
            let buttonClass = `
              p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer text-center
            `;

            if (!status.hasMatches) {
              buttonClass += ' bg-gray-100 border-gray-300 text-black cursor-not-allowed';
            } else if (status.resultsAvailable) {
              buttonClass += ' bg-emerald-200 border-emerald-600 text-emerald-900 hover:bg-emerald-300';
            } else if (status.hasPredictions) {
              buttonClass += ' bg-green-100 border-green-500 text-green-800 hover:bg-green-200';
            } else {
              buttonClass += ' bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200';
            }

            return (
              <div
                key={status.matchday}
                className={buttonClass}
                onClick={() => handleMatchdayClick(status.matchday, status.hasMatches)}
              >
                <div className="text-2xl font-bold mb-2">Speeldag {status.matchday}</div>
                <div className="text-sm">{status.matchCount} wedstrijden</div>

                {status.hasMatches && (
                  <>
                    {status.resultsAvailable ? (
                      <div className="mt-1 text-xs font-semibold text-emerald-800">Resultaat beschikbaar</div>
                    ) : status.hasPredictions ? (
                      <div className="mt-1 text-xs font-semibold text-green-700">Ingevuld</div>
                    ) : (
                      <div className="mt-1 text-xs font-medium text-blue-700">Nog in te vullen</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Legenda:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
              <span>Voorspelling ingevuld</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
              <span>Beschikbaar om in te vullen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-200 border border-emerald-600 rounded"></div>
              <span>Resultaat beschikbaar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Geen wedstrijden beschikbaar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
