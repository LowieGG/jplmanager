import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Competition from '@/models/Competition';
import User from '@/models/User';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  const code = Math.random().toString(36).substr(2, 6); // bv. abc123

  await connectDB();

  const comp = await Competition.create({
    name,
    code,
    owner: session.user.id,
    members: [session.user.id],
  });

  return NextResponse.json(comp);
}
