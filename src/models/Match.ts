
// models/Match.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  homeTeam: string;
  awayTeam: string;
  matchday: number;
  date: Date;
}

const MatchSchema = new Schema<IMatch>({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  matchday: { type: Number, required: true },
  date: { type: Date, required: true },
}, {
  timestamps: true // Optioneel: voegt createdAt en updatedAt toe
});

// Index voor betere performance
MatchSchema.index({ matchday: 1 });

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);