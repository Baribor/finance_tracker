import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

export interface ISupportMessage {
  sender: string;
  senderRole: "user" | "admin";
  content: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  name: string;
  email: string;
  userId?: Types.ObjectId;
  status: "open" | "closed";
  subject: string;
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    sender: { type: String, required: true, trim: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    subject: { type: String, required: true, trim: true },
    messages: [SupportMessageSchema],
  },
  { timestamps: true }
);

const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;
