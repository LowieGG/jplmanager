// In je Prediction model - verander matchId type
import mongoose, { Schema, Document } from 'mongoose';

export interface IPrediction extends Document {
  userId: string;
  matchId: mongoose.Types.ObjectId; // ⬅️ Verander dit terug naar ObjectId!
  matchday: number;
  predictedHome: number;
  predictedAway: number;
}

const predictionSchema = new Schema({
  userId: { type: String, required: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ⬅️ ObjectId in plaats van String
  matchday: { type: Number, required: true },
  predictedHome: { type: Number, required: true },
  predictedAway: { type: Number, required: true },
}, {
  timestamps: true
});

// Index voor betere performance bij queries  
predictionSchema.index({ userId: 1, matchday: 1 });
predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export default mongoose.models.Prediction || mongoose.model('Prediction', predictionSchema);