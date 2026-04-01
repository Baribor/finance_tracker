import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMember extends Document {
  stateCode: string;
  name: string;
  password: string;
  role: "member" | "secretary" | "admin";
  group?: Types.ObjectId;
  mustChangePassword: boolean;
  isActive: boolean;
  serviceStatus: "serving" | "completed";
  serviceCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    stateCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["member", "secretary", "admin"], default: "member" },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    mustChangePassword: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    serviceStatus: { type: String, enum: ["serving", "completed"], default: "serving" },
    serviceCompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);

export default Member;
