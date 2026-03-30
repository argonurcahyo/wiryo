/**
 * app/api/members/route.ts
 * GET  /api/members  – list all members
 * POST /api/members  – create a new member
 */

import { NextRequest } from "next/server";
import { getAllMembers, createMember } from "@/lib/members";

export async function GET() {
  try {
    const members = await getAllMembers();
    return Response.json({ members });
  } catch (err) {
    console.error("[GET /api/members]", err);
    return Response.json(
      { error: "Failed to fetch members." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const member = await createMember({
      name: body.name,
      fatherId: body.fatherId ?? null,
      motherId: body.motherId ?? null,
      birthDate: body.birthDate ?? null,
    });
    return Response.json({ member }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}
