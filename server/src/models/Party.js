import mongoose from 'mongoose';
import { COUNTRY_CODES } from '../config/lookups.js';

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
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: COUNTRY_CODES,
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
