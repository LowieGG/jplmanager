import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Competition from '@/models/Competition';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();

  await connectDB();

  const comp = await Competition.findOne({ code });
  if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

  if (!comp.members.includes(session.user.id)) {
    comp.members.push(session.user.id);
    await comp.save();
  }

  return NextResponse.json(comp);
}
