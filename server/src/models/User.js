import mongoose from 'mongoose';

const entitlementSchema = new mongoose.Schema(
  {
    partyId: { type: String, ref: 'Party', required: true },
    access: { type: String, enum: ['ALL_ACCOUNTS', 'SELECTED_ACCOUNTS'], required: true },
    accountIds: { type: [String], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phoneDialCode: {
      type: String,
      required: true,
      trim: true,
      match: /^\+\d{1,4}$/,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    // One entry per party. ALL_ACCOUNTS covers every account of the party, including
    // ones opened later. SELECTED_ACCOUNTS covers only the listed accounts.
    entitlements: {
      type: [entitlementSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

userSchema.index({ 'entitlements.partyId': 1 });

export default mongoose.model('User', userSchema);
