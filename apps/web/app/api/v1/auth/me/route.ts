import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/tokens";


export async function GET(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    email: auth.user.email,
    user_id: auth.user._id,
    status: auth.user.status,
    timezone: auth.user.timezone,
    preferences: auth.user.preferences,
  });
}
