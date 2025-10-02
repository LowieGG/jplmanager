'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Competition = {
  name: string;
  code: string;
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    fetch('/api/competitions/my')
      .then(res => res.json())
      .then(data => setCompetitions(data));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mijn Competities</h1>
      <ul className="space-y-3 mb-8">
        {competitions.map((c, i) => (
          <li key={i} className="p-4 bg-gray-100 rounded">
            <Link href={`/competition/${c.code}`} className="text-blue-600 hover:underline">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
        <Link href="/competitions/create" className="bg-blue-600 text-white px-4 py-2 rounded">
          Nieuwe competitie aanmaken
        </Link>
        <JoinCompetitionForm />
      </div>
    </main>
  );
}

function JoinCompetitionForm() {
  const [code, setCode] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/competitions/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('Kon competitie niet joinen.');
    }
  };

  return (
    <form onSubmit={handleJoin} className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Competitiecode"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Joinen
      </button>
    </form>
  );
}
