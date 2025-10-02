import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', default: null },
  points: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Score || mongoose.model('Score', scoreSchema);
