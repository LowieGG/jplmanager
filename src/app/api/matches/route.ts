import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Match from '@/models/Match';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Fix: Gebruik new URL() in plaats van req.nextUrl
    const url = new URL(req.url);
    const matchday = Number(url.searchParams.get('matchday')) || 1;
    
    console.log('🔍 Fetching matches for matchday:', matchday);
    
    const matches = await Match.find({ matchday }).sort({ date: 1 }); // Fix: object syntax voor sort
    
    console.log('📊 Found matches:', matches.length);
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fout in GET /api/matches:', error);
    return NextResponse.json([], { status: 500 });
  }
}