import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Score from '@/models/Score';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();

  const scores = await Score.find({ competition: params.id })
    .populate('user', 'name email')
    .sort({ points: -1 });

  return NextResponse.json(scores);
}
