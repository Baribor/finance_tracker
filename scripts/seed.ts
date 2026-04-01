import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("Missing required environment variables:");
  console.error("  MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD");
  console.error("Set them in .env.local or as environment variables.");
  process.exit(1);
}

const MemberSchema = new mongoose.Schema(
  {
    stateCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["member", "secretary", "admin"],
      default: "member",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    mustChangePassword: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Member =
  mongoose.models.Member || mongoose.model("Member", MemberSchema);

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected.");

  const exists = await Member.findOne({ role: "admin" });
  if (exists) {
    console.log("Admin account already exists:", exists.stateCode);
    await mongoose.disconnect();
    return;
  }

  // Remove any existing member with the same stateCode (e.g. old secretary seed)
  await Member.deleteOne({ stateCode: ADMIN_USERNAME });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD as string, 12);
  const admin = await Member.create({
    stateCode: ADMIN_USERNAME,
    name: "Platform Admin",
    password: hashedPassword,
    role: "admin",
    group: null,
    mustChangePassword: false,
    isActive: true,
  });

  console.log("Admin account created!");
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log("  ID:", admin._id);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
