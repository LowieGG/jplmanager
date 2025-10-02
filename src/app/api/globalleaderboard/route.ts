// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserPoints from '@/models/UserPoints';
import User from '@/models/User'; // Verondersteld dat je deze hebt
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const matchdayParam = url.searchParams.get('matchday');
    const matchday = matchdayParam ? Number(matchdayParam) : null;

    // Filter op matchday indien meegegeven
    const match = matchday !== null ? { matchday } : {};

    // Aggregate punten per userId
    const aggregation = await UserPoints.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$totalPoints' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          totalPoints: 1,
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    return NextResponse.json(aggregation);
  } catch (error) {
    console.error('💥 Leaderboard GET Error:', error);
    return NextResponse.json({ message: 'Serverfout' }, { status: 500 });
  }
}
