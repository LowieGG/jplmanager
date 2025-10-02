import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserPoints extends Document {
  userId: Types.ObjectId;
  matchday: number;
  totalPoints: number;
  updatedAt?: Date;
}

const UserPointsSchema = new Schema<IUserPoints>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchday: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// Uniek per user + matchday
UserPointsSchema.index({ userId: 1, matchday: 1 }, { unique: true });

export default mongoose.models.UserPoints ||
  mongoose.model<IUserPoints>('UserPoints', UserPointsSchema);
