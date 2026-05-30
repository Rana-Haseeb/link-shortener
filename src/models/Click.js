import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
  linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
  timestamp: { type: Date, default: Date.now },
  device: String,
  referrer: String,
});

export default mongoose.models.Click ?? mongoose.model('Click', ClickSchema);
