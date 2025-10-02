'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';

type LeaderboardUser = {
  name: string;
  totalPoints: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [matchday, setMatchday] = useState<number | null>(null); // null = totaal

  useEffect(() => {
    const url = matchday !== null
      ? `/api/globalleaderboard?matchday=${matchday}`
      : `/api/globalleaderboard`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Fout bij laden van leaderboard:', err));
  }, [matchday]);

  return (
    <>
      <Navbar />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          {matchday !== null
            ? `Klassement – Speeldag ${matchday}`
            : 'Algemeen Klassement'}
        </h1>

        <div className="mb-6">
          <label className="mr-2 font-medium">Speeldag:</label>
          <select
            value={matchday ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setMatchday(val === '' ? null : Number(val));
            }}
            className="p-2 border rounded"
          >
            <option value="">Totaal</option>
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i + 1}>
                Speeldag {i + 1}
              </option>
            ))}
          </select>
        </div>

        <ul className="space-y-2">
          {users.map((user, index) => (
            <li key={index} className="p-4 bg-gray-100 rounded shadow-sm">
              <span className="font-semibold">
                {index + 1}. {user.name}
              </span>{' '}
              – {user.totalPoints} punten
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
