import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPayment extends Document {
  member?: Types.ObjectId;
  category?: Types.ObjectId;
  amount: number;
  date: Date;
  method: "direct" | "shortcode";
  shortCode?: string;
  recordedBy: Types.ObjectId;
  note: string;
  isAnonymous: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ["direct", "shortcode"], default: "direct" },
    shortCode: { type: String, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    note: { type: String, default: "", trim: true },
    isAnonymous: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
