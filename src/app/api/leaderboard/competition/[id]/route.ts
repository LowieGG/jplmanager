import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Score from '@/models/Score';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  const { id } = await params; // await de params

  const scores = await Score.find({ competition: id })
    .populate('user', 'name email')
    .sort({ points: -1 });

  return NextResponse.json(scores);
}