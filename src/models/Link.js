import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  securityStatus: {
    type: String,
    enum: ['safe', 'flagged', 'pending'],
    default: 'pending',
  },
  aiMetadata: {
    summary: String,
    category: String,
    tags: [String],
  },
  artisticQrUrl: String,
});

export default mongoose.models.Link ?? mongoose.model('Link', LinkSchema);
