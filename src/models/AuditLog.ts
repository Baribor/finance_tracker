import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  performedBy: Types.ObjectId;
  targetType: string;
  targetId?: Types.ObjectId;
  group?: Types.ObjectId;
  details: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, trim: true },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    details: { type: String, required: true, trim: true },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ group: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
