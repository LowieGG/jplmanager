'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from "@/components/Navbar";

interface Match {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  matchday: number;
}

interface Result {
  _id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  matchday: number;
}

interface Prediction {
  _id?: string;
  matchId: string;
  predictedHome: number;
  predictedAway: number;
  matchday?: number;
  points?: number;
}

export default function PredictPage() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingPredictions, setHasExistingPredictions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const matchday = params.get('matchday') || '1';

  // Check if deadline has passed
  const checkDeadline = (matches: Match[]): boolean => {
    if (matches.length === 0) return false;
    
    // Find the earliest match of the matchday
    const earliestMatch = matches.reduce((earliest, match) => 
      new Date(match.date) < new Date(earliest.date) ? match : earliest
    );
    
    const matchDate = new Date(earliestMatch.date);
    const deadlineDate = new Date(matchDate.getTime() - 12 * 60 * 60 * 1000); // 12 hours before
    const now = new Date();
    
    return now > deadlineDate;
  };

  // Calculate points for a prediction
  const calculatePoints = (prediction: Prediction, result: Result): number => {
    if (!prediction || !result) return 0;

    const predictedHome = prediction.predictedHome;
    const predictedAway = prediction.predictedAway;
    const actualHome = result.homeScore;
    const actualAway = result.awayScore;

    // Exact score: 5 points
    if (predictedHome === actualHome && predictedAway === actualAway) {
      return 5;
    }

    // Correct goal difference and winner: 4 points
    const predictedDiff = predictedHome - predictedAway;
    const actualDiff = actualHome - actualAway;
    const predictedWinner = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'draw';
    const actualWinner = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw';

    if (predictedDiff === actualDiff && predictedWinner === actualWinner) {
      return 4;
    }

    // Correct winner only: 3 points
    if (predictedWinner === actualWinner) {
      return 3;
    }

    // No points
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch matches
        const resMatches = await fetch(`/api/matches?matchday=${matchday}`);
        if (!resMatches.ok) throw new Error(`Fout bij ophalen matchdata: ${resMatches.status}`);
        const matchesData = await resMatches.json();
        setMatches(matchesData);

        if (matchesData.length === 0) {
          router.push('/predict-selector');
          return;
        }

        // Check deadline
        const deadlinePassed = checkDeadline(matchesData);
        setIsDeadlinePassed(deadlinePassed);

        // Fetch results first
        let resultsMap: Record<string, Result> = {};
        const resResults = await fetch(`/api/results?matchday=${matchday}`);
        if (resResults.ok) {
          const resultsData = await resResults.json();
          const resultsArray = resultsData?.results ?? [];
          
          if (Array.isArray(resultsArray) && resultsArray.length > 0) {
            resultsArray.forEach((r: Result) => {
              resultsMap[String(r.matchId)] = r;
            });
            setResults(resultsMap);
            setHasResults(true);
          }
        } else {
          console.log('No results found or error fetching results:', resResults.status);
        }

        // Fetch predictions
        const resPrediction = await fetch(`/api/predictions?matchday=${matchday}`);
        if (resPrediction.ok) {
          const predictionData = await resPrediction.json();
          const predictionArray = predictionData?.predictions ?? [];

          if (Array.isArray(predictionArray) && predictionArray.length > 0) {
            const predictionsMap: Record<string, Prediction> = {};
            predictionArray.forEach((p: Prediction) => {
              // Calculate points if result is available
              const result = resultsMap[String(p.matchId)];
              const points = result ? calculatePoints(p, result) : p.points;
              
              predictionsMap[String(p.matchId)] = {
                ...p,
                matchId: String(p.matchId),
                points: points
              };
            });
            setPredictions(predictionsMap);
            setHasExistingPredictions(true);
            setIsEditing(false);
          } else {
            setHasExistingPredictions(false);
            // Only allow editing if deadline hasn't passed
            setIsEditing(!deadlinePassed);
          }
        } else {
          console.log('No predictions found or error fetching predictions:', resPrediction.status);
          setHasExistingPredictions(false);
          setIsEditing(!deadlinePassed);
        }
      } catch (error) {
        console.error('💥 Fetch error:', error);
        setIsEditing(!isDeadlinePassed);
        setHasExistingPredictions(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchday, session?.user?.id, router]);

  // Update predictions with calculated points when results change
  useEffect(() => {
    if (Object.keys(results).length > 0 && Object.keys(predictions).length > 0) {
      const updatedPredictions = { ...predictions };
      let hasUpdates = false;

      Object.keys(predictions).forEach(matchId => {
        const result = results[matchId];
        if (result) {
          const newPoints = calculatePoints(predictions[matchId], result);
          if (predictions[matchId].points !== newPoints) {
            updatedPredictions[matchId] = {
              ...predictions[matchId],
              points: newPoints
            };
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        setPredictions(updatedPredictions);
      }
    }
  }, [results, predictions]);

  const handleChange = (mId: string, side: 'predictedHome' | 'predictedAway', val: string) => {
    setPredictions(prev => ({
      ...prev,
      [mId]: {
        ...prev[mId],
        matchId: mId,
        [side]: parseInt(val, 10) || 0,
      },
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (isDeadlinePassed && !hasExistingPredictions) {
      alert('De deadline voor deze speeldag is voorbij. Je kunt geen nieuwe voorspellingen meer maken.');
      return;
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: Object.values(predictions),
          matchday: parseInt(matchday),
        }),
      });

      if (response.ok) {
        alert('Voorspellingen opgeslagen');
        setIsEditing(false);
        setHasExistingPredictions(true);
      } else {
        const errorText = await response.text();
        alert('Fout bij opslaan: ' + errorText);
      }
    } catch (error) {
      console.error('💥 Save error:', error);
      alert('Fout bij opslaan');
    }
  };

  const goBackToSelector = () => {
    router.push('/predict-selector');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeadlineInfo = () => {
    if (matches.length === 0) return null;
    
    const earliestMatch = matches.reduce((earliest, match) => 
      new Date(match.date) < new Date(earliest.date) ? match : earliest
    );
    
    const matchDate = new Date(earliestMatch.date);
    const deadlineDate = new Date(matchDate.getTime() - 12 * 60 * 60 * 1000);
    
    return {
      deadline: deadlineDate,
      firstMatch: matchDate,
      isPassed: isDeadlinePassed
    };
  };

  const deadlineInfo = getDeadlineInfo();

  // Render result section that appears next to predictions or empty predictions
  const renderResultSection = (matchId: string) => {
    const result = results[matchId];
    if (!result) return null;

    return (
      <div className="flex items-center space-x-2 ml-4">
        <span className="text-sm text-gray-600">Uitslag:</span>
        <span className="w-8 text-center font-bold bg-blue-100 px-1 py-1 rounded border text-blue-800">
          {result.homeScore}
        </span>
        <span className="text-gray-500">-</span>
        <span className="w-8 text-center font-bold bg-blue-100 px-1 py-1 rounded border text-blue-800">
          {result.awayScore}
        </span>
      </div>
    );
  };

  if (!session) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto mt-8 p-6">
          <p className="text-center">Je moet inloggen om voorspellingen te maken.</p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto mt-8 p-6">
          <p className="text-center">Laden...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goBackToSelector}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug naar overzicht
          </button>
          <h2 className="text-2xl font-bold">Speeldag {matchday}</h2>
          <div className="w-24"></div>
        </div>

        {/* Deadline Info */}
        {deadlineInfo && (
          <div className={`mb-6 p-4 rounded-lg border ${isDeadlinePassed ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              {isDeadlinePassed ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Deadline voorbij</span>
                  <span className="text-red-600 text-sm">
                    (was {deadlineInfo.deadline.toLocaleDateString('nl-BE', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 font-medium">Deadline:</span>
                  <span className="text-blue-600">
                    {deadlineInfo.deadline.toLocaleDateString('nl-BE', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="mb-6 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            {hasExistingPredictions ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Voorspelling ingevuld</span>
              </>
            ) : isDeadlinePassed ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">Geen voorspelling (0 punten)</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-orange-700 font-medium">Nog in te vullen</span>
              </>
            )}
            <span className="text-gray-600 ml-2">({matches.length} wedstrijden)</span>
            {hasResults && (
              <span className="text-green-600 ml-2">(Uitslagen bekend)</span>
            )}
          </div>
        </div>

        {/* No predictions and deadline passed */}
        {!hasExistingPredictions && isDeadlinePassed && (
          <div className="space-y-4 mb-6">
            {matches.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span className="min-w-0 flex-1 text-right font-medium">{m.homeTeam}</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-10 text-center font-bold text-lg bg-gray-100 px-2 py-1 rounded border text-gray-400">
                      -
                    </span>
                    <span className="text-gray-500">-</span>
                    <span className="w-10 text-center font-bold text-lg bg-gray-100 px-2 py-1 rounded border text-gray-400">
                      -
                    </span>
                  </div>
                  <span className="min-w-0 flex-1 font-medium">{m.awayTeam}</span>
                  
                  {/* Always show result if available */}
                  {renderResultSection(m._id)}
                </div>

                <span className="ml-4 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-full px-3 py-1">
                  0 pt
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Existing predictions (not editing) */}
        {hasExistingPredictions && !isEditing && (
          <>
            <div className="space-y-4 mb-6">
              {matches.map((m) => {
                const prediction = predictions[m._id];
                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="min-w-0 flex-1 text-right font-medium">{m.homeTeam}</span>
                      <div className="flex items-center space-x-2">
                        <span className="w-10 text-center font-bold text-lg bg-white px-2 py-1 rounded border">
                          {prediction?.predictedHome ?? '?'}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="w-10 text-center font-bold text-lg bg-white px-2 py-1 rounded border">
                          {prediction?.predictedAway ?? '?'}
                        </span>
                      </div>
                      <span className="min-w-0 flex-1 font-medium">{m.awayTeam}</span>
                      
                      {/* Always show result if available */}
                      {renderResultSection(m._id)}
                    </div>

                    {prediction && (
                      <span
                        className={`ml-4 text-sm font-medium rounded-full px-3 py-1 ${
                          prediction.points === 5 
                            ? 'text-green-800 bg-green-200 border border-green-300' 
                            : prediction.points === 4
                            ? 'text-blue-800 bg-blue-200 border border-blue-300'
                            : prediction.points === 3
                            ? 'text-orange-800 bg-orange-200 border border-orange-300'
                            : prediction.points === 0
                            ? 'text-red-800 bg-red-200 border border-red-300'
                            : 'text-gray-800 bg-gray-200 border border-gray-300'
                        }`}
                        title={`Punten voor deze match${results[m._id] ? '' : ' (voorlopig)'}`}
                      >
                        {prediction.points ?? 0} pt
                      </span>
                    )}

                    {!prediction && (
                      <span className="ml-4 text-red-500 text-xs">(Geen voorspelling gevonden)</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Only show edit button if deadline hasn't passed and no results yet */}
            {!isDeadlinePassed && !hasResults && (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Wijzig voorspelling
                </button>
              </div>
            )}
          </>
        )}

        {/* Editing mode */}
        {isEditing && !isDeadlinePassed && (
          <>
            <h3 className="text-lg font-semibold mb-4">
              {hasExistingPredictions ? 'Wijzig je voorspelling' : 'Vul je voorspelling in'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {matches.map((m) => (
                <div key={m._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <span className="min-w-0 flex-1 text-right font-medium">{m.homeTeam}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    className="w-16 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={predictions[m._id]?.predictedHome ?? ''}
                    onChange={(e) => handleChange(m._id, 'predictedHome', e.target.value)}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    className="w-16 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={predictions[m._id]?.predictedAway ?? ''}
                    onChange={(e) => handleChange(m._id, 'predictedAway', e.target.value)}
                  />
                  <span className="min-w-0 flex-1 font-medium">{m.awayTeam}</span>
                  
                  {/* Show result in editing mode if available */}
                  {renderResultSection(m._id)}
                  
                  <span className="text-xs text-gray-500">{formatDate(m.date)}</span>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                >
                  {hasExistingPredictions ? 'Bijwerken' : 'Opslaan'}
                </button>
                {hasExistingPredictions && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    Annuleren
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {/* Show total points if there are any predictions with points */}
        {hasExistingPredictions && Object.values(predictions).some(p => p.points != null) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <span className="text-lg font-semibold text-blue-800">
                Totaal: {Object.values(predictions).reduce((sum, p) => sum + (p.points ?? 0), 0)} punten
              </span>
              <span className="text-blue-600 text-sm ml-2">
                ({Object.values(predictions).filter(p => p.points != null).length}/{matches.length} wedstrijden)
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}