import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/tokens";
import { signWebToken } from "@/lib/auth";


/** Used by the TUI `w` keybind: mint a 24h signed URL for the public web view. */
export async function POST(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { brief_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.brief_date) {
    return NextResponse.json({ error: "brief_date_required" }, { status: 400 });
  }
  const token = await signWebToken({
    userId: auth.user._id,
    briefDate: body.brief_date,
  });
  return NextResponse.json({ token });
}
