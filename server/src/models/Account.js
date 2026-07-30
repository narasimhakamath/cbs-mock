import mongoose from 'mongoose';
import { COUNTRY_CODES, CURRENCY_CODES } from '../config/lookups.js';
import { roundToCurrencyPrecision } from '../utils/currency.js';

const accountSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      match: /^\d{16}$/,
    },
    partyId: {
      type: String,
      ref: 'Party',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: COUNTRY_CODES,
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: CURRENCY_CODES,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

accountSchema.virtual('accountNumber').get(function () {
  return this._id;
});

accountSchema.pre('save', function () {
  if (this.isModified('balance') || this.isModified('currencyCode')) {
    this.balance = roundToCurrencyPrecision(this.balance, this.currencyCode);
  }
});

accountSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (update.balance === undefined) return;

  const currencyCode = update.currencyCode || (await this.model.findOne(this.getQuery()))?.currencyCode;
  if (currencyCode) {
    update.balance = roundToCurrencyPrecision(update.balance, currencyCode);
  }
});

export default mongoose.model('Account', accountSchema);
