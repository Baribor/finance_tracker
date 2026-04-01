import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExpense extends Document {
  description: string;
  amount: number;
  date: Date;
  category: string;
  group: Types.ObjectId;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    category: { type: String, required: true, trim: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "Member", required: true },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
