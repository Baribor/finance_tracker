import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";

export async function seedSecretary() {
  await dbConnect();
  
  const exists = await Member.findOne({ role: "secretary" });
  if (!exists) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await Member.create({
      stateCode: "ADMIN001",
      name: "Secretary Admin",
      password: hashedPassword,
      role: "secretary",
      isActive: true,
    });
    console.log("Secretary account created: ADMIN001 / admin123");
  }
}
