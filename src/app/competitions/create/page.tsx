'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCompetitionPage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/competitions/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok) {
      router.push(`/competition/${data.code}`);
    } else {
      alert('Fout bij aanmaken competitie.');
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nieuwe Competitie Aanmaken</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <input
          type="text"
          placeholder="Naam competitie"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Aanmaken
        </button>
      </form>
    </main>
  );
}
