import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prediction from '@/models/Prediction';
import Match from '@/models/Match';
import Result from '@/models/Result';
import UserPoints from '@/models/UserPoints';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Hulpfunctie voor puntenberekening
function calculatePoints(pred: any, result: any): number {
  if (pred.predictedHome === result.homeScore && pred.predictedAway === result.awayScore) {
    return 3;
  }

  const predictedDiff = pred.predictedHome - pred.predictedAway;
  const actualDiff = result.homeScore - result.awayScore;

  const predictedWinner =
    pred.predictedHome > pred.predictedAway
      ? 'home'
      : pred.predictedAway > pred.predictedHome
      ? 'away'
      : 'draw';

  const actualWinner =
    result.homeScore > result.awayScore
      ? 'home'
      : result.awayScore > result.homeScore
      ? 'away'
      : 'draw';

  if (predictedDiff === actualDiff) {
    return 2;
  }

  if (predictedWinner === actualWinner) {
    return 1;
  }

  return 0;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Niet ingelogd' }, { status: 401 });
    }

    const { predictions, matchday } = await req.json();
    await connectDB();

    // 🛑 Check deadline voor voorspellingen
    const matches = await Match.find({ matchday });
    if (matches.length === 0) {
      return NextResponse.json({ message: 'Geen wedstrijden gevonden voor deze speeldag' }, { status: 400 });
    }

    const firstMatch = matches.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];

    const deadline = new Date(firstMatch.date);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(10, 0, 0, 0);

    if (new Date() > deadline) {
      return NextResponse.json({ message: 'Deadline voor deze speeldag is verstreken' }, { status: 403 });
    }

    // 🛑 Check of resultaten al beschikbaar zijn
    const results = await Result.find({ matchday });
    const allResultsAvailable =
      matches.length > 0 &&
      matches.every((m) =>
        results.some((r) => r.matchId.toString() === m._id.toString())
      );

    if (allResultsAvailable) {
      return NextResponse.json({ message: 'Resultaten voor deze speeldag zijn al beschikbaar' }, { status: 403 });
    }

    // ✅ Voorspellingen opslaan
    for (const p of predictions) {
      const matchObjectId = new mongoose.Types.ObjectId(p.matchId);

      await Prediction.updateOne(
        {
          userId: session.user.id,
          matchId: matchObjectId,
        },
        {
          $set: {
            predictedHome: p.predictedHome,
            predictedAway: p.predictedAway,
            matchday: Number(matchday),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ message: 'Voorspellingen opgeslagen' });
  } catch (error) {
    console.error('💥 POST Error:', error);
    return NextResponse.json({ message: 'Er is een interne serverfout opgetreden.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Niet ingelogd' }, { status: 401 });
    }

    const url = new URL(req.url);
    const matchday = Number(url.searchParams.get('matchday')) || 1;

    await connectDB();

    // Haal voorspellingen van de gebruiker voor deze speeldag
    const predictions = await Prediction.find({
      userId: session.user.id,
      matchday,
    }).lean();

    // Haal de matches en resultaten op
    const matches = await Match.find({ matchday });
    const results = await Result.find({ matchday });

    // Bereken punten per voorspelling
    const predictionsWithPoints = predictions.map((p) => {
      const matchIdStr = p.matchId.toString();
      const result = results.find((r) => r.matchId.toString() === matchIdStr);

      let points = null;
      if (result) {
        points = calculatePoints(p, result);
      }

      return {
        ...p,
        matchId: matchIdStr,
        points,
      };
    });

    // Bereken totaal punten voor deze gebruiker + speeldag
    const totalPoints = predictionsWithPoints.reduce(
      (sum, p) => sum + (p.points ?? 0),
      0
    );

    // Sla totalPoints op in UserPoints (upsert)
    await UserPoints.updateOne(
      { userId: session.user.id, matchday },
      { $set: { totalPoints, updatedAt: new Date() } },
      { upsert: true }
    );

    // Bepaal deadline (1 dag vóór eerste match, 10u)
    const firstMatch = matches.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
    let deadlinePassed = false;
    if (firstMatch) {
      const deadline = new Date(firstMatch.date);
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(10, 0, 0, 0);
      deadlinePassed = new Date() > deadline;
    }

    // Check of alle resultaten beschikbaar zijn
    const allResultsAvailable =
      matches.length > 0 &&
      matches.every((m) =>
        results.some((r) => r.matchId.toString() === m._id.toString())
      );

    return NextResponse.json({
      predictions: predictionsWithPoints,
      totalPoints,
      resultsAvailable: allResultsAvailable,
      deadlinePassed,
      debug: {
        userId: session.user.id,
        matchday,
        rawPredictionsCount: predictions.length,
        convertedPredictionsCount: predictionsWithPoints.length,
      },
    });
  } catch (error) {
    console.error('💥 GET Error:', error);
    return NextResponse.json(
      { message: 'Er is een interne serverfout opgetreden.' },
      { status: 500 }
    );
  }
}
