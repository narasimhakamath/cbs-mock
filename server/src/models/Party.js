import mongoose from 'mongoose';

const partySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['CORPORATE', 'RETAIL'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Party', partySchema);
