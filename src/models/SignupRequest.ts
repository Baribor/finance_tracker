import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISignupRequest extends Document {
  // CDS group details
  groupName: string;
  groupDescription: string;
  // Secretary personal details
  secretaryName: string;
  secretaryStateCode: string;
  secretaryEmail: string;
  // Location / LGA info (optional useful context for admin)
  lga: string;
  state: string;
  // Workflow
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SignupRequestSchema = new Schema<ISignupRequest>(
  {
    groupName: { type: String, required: true, trim: true },
    groupDescription: { type: String, default: "", trim: true },
    secretaryName: { type: String, required: true, trim: true },
    secretaryStateCode: { type: String, required: true, trim: true, uppercase: true },
    secretaryEmail: { type: String, required: true, trim: true, lowercase: true },
    lga: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const SignupRequest: Model<ISignupRequest> =
  mongoose.models.SignupRequest ||
  mongoose.model<ISignupRequest>("SignupRequest", SignupRequestSchema);

export default SignupRequest;
