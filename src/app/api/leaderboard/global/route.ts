import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Score from '@/models/Score';
import User from '@/models/User';

export async function GET() {
  await connectDB();

  const scores = await Score.find({ competition: null })
    .populate('user', 'name email')
    .sort({ points: -1 });

  return NextResponse.json(scores);
}
