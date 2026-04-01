import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IShortCode extends Document {
  code: string;
  member: Types.ObjectId;
  category: Types.ObjectId;
  amount: number;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShortCodeSchema = new Schema<IShortCode>(
  {
    code: { type: String, required: true, unique: true },
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true, min: 0 },
    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ShortCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ShortCode: Model<IShortCode> =
  mongoose.models.ShortCode ||
  mongoose.model<IShortCode>("ShortCode", ShortCodeSchema);

export default ShortCode;
