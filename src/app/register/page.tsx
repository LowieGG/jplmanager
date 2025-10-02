'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const router = useRouter();

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/login');
    } else {
      alert('Registratie mislukt');
    }
  };

  return (
    <div className="mt-20 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Registreren</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Naam" onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="email" placeholder="E-mail" onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="password" name="password" placeholder="Wachtwoord" onChange={handleChange} className="w-full p-2 border rounded" />
        <button className="bg-blue-600 text-white w-full py-2 rounded">Registreer</button>
      </form>
    </div>
  );
}
