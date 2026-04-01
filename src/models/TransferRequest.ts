import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITransferRequest extends Document {
  member: Types.ObjectId;
  fromGroup: Types.ObjectId;
  toGroup: Types.ObjectId;
  requestedBy: Types.ObjectId; // secretary of toGroup
  status: "pending" | "approved" | "rejected";
  resolvedBy?: Types.ObjectId; // secretary of fromGroup
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransferRequestSchema = new Schema<ITransferRequest>(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    fromGroup: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    toGroup: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const TransferRequest: Model<ITransferRequest> =
  mongoose.models.TransferRequest ||
  mongoose.model<ITransferRequest>("TransferRequest", TransferRequestSchema);

export default TransferRequest;
