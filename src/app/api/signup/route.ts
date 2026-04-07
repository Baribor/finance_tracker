import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SignupRequest from "@/models/SignupRequest";
import Member from "@/models/Member";
import Group from "@/models/Group";
import { sendRegistrationConfirmationEmail } from "@/lib/email";

// Public — no auth required
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const {
    groupName,
    groupDescription,
    secretaryName,
    secretaryStateCode,
    secretaryEmail,
    lga,
    state,
  } = body;

  if (!groupName || !secretaryName || !secretaryStateCode || !secretaryEmail) {
    return NextResponse.json(
      {
        error:
          "Group name, secretary name, state code, and email address are required",
      },
      { status: 400 }
    );
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(secretaryEmail.trim())) {
    return NextResponse.json(
      { error: "Please provide a valid email address" },
      { status: 400 }
    );
  }

  const code = secretaryStateCode.trim().toUpperCase();

  // Reject if group name already taken
  const existingGroup = await Group.findOne({
    name: { $regex: new RegExp(`^${groupName.trim()}$`, "i") },
  });
  if (existingGroup) {
    return NextResponse.json(
      { error: "A CDS group with this name already exists" },
      { status: 400 }
    );
  }

  // Reject if state code already in use
  const existingMember = await Member.findOne({ stateCode: code });
  if (existingMember) {
    return NextResponse.json(
      { error: "This state code is already registered" },
      { status: 400 }
    );
  }

  // Reject if a pending request already exists for this state code
  const existingRequest = await SignupRequest.findOne({
    secretaryStateCode: code,
    status: "pending",
  });
  if (existingRequest) {
    return NextResponse.json(
      {
        error:
          "A signup request with this state code is already pending review",
      },
      { status: 400 }
    );
  }

  const request = await SignupRequest.create({
    groupName: groupName.trim(),
    groupDescription: groupDescription?.trim() || "",
    secretaryName: secretaryName.trim(),
    secretaryStateCode: code,
    secretaryEmail: secretaryEmail.trim().toLowerCase(),
    lga: lga?.trim() || "",
    state: state?.trim() || "",
  });

  // Send confirmation email (non-blocking — don't fail the request if email fails)
  try {
    await sendRegistrationConfirmationEmail({
      to: secretaryEmail.trim().toLowerCase(),
      secretaryName: secretaryName.trim(),
      groupName: groupName.trim(),
    });
  } catch {
    console.error("Failed to send registration confirmation email");
  }

  return NextResponse.json(
    {
      message:
        "Signup request submitted. You will receive access once an admin approves your request.",
      id: request._id,
    },
    { status: 201 }
  );
}
