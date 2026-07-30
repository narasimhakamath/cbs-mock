import mongoose from 'mongoose';
import { COUNTRY_CODES, CURRENCY_CODES } from '../config/lookups.js';
import { uuidv7 } from '../utils/uuid.js';

const transactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv7,
    },
    accountNumber: {
      type: String,
      ref: 'Account',
      required: true,
    },
    direction: {
      type: String,
      enum: ['INWARD_CREDIT', 'OUTWARD_DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: CURRENCY_CODES,
    },
    counterpartyAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    counterpartyCountryCode: {
      type: String,
      uppercase: true,
      enum: COUNTRY_CODES,
    },
    status: {
      type: String,
      enum: ['COMPLETED'],
      default: 'COMPLETED',
    },
  },
  { timestamps: true }
);

transactionSchema.virtual('transactionId').get(function () {
  return this._id;
});

transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Transaction', transactionSchema);
