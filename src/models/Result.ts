import mongoose, { Schema, models, model } from 'mongoose';

const resultSchema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, unique: true },
    homeScore: { type: Number, required: true },
    awayScore: { type: Number, required: true },
    matchday: { type: Number },
  },
  { timestamps: true }
);

const Result = models.Result || model('Result', resultSchema);

export default Result;
