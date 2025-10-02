import mongoose from 'mongoose';

const competitionSchema = new mongoose.Schema({
  name: String,
  code: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.Competition || mongoose.model('Competition', competitionSchema);
