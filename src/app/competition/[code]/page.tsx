'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CompetitionDetailPage() {
  const { code } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/competitions/${code}`)
      .then(res => res.json())
      .then(setData);
  }, [code]);

  if (!data) return <div className="p-8">Laden...</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">{data.name}</h1>
      <h2 className="text-lg mb-2">Deelnemers:</h2>
      <ul className="space-y-2">
        {data.members.map((m: any, i: number) => (
          <li key={i} className="bg-gray-100 p-2 rounded">{m.name}</li>
        ))}
      </ul>
    </main>
  );
}
