/**
 * app/api/members/[id]/route.ts
 * GET    /api/members/[id]  – fetch a single member
 * PUT    /api/members/[id]  – update a member
 * DELETE /api/members/[id]  – delete a member
 */

import { NextRequest } from "next/server";
import { getMemberById, updateMember, deleteMember } from "@/lib/members";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const member = await getMemberById(id);
    if (!member) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }
    return Response.json({ member });
  } catch (err) {
    console.error(`[GET /api/members/${id}]`, err);
    return Response.json({ error: "Failed to fetch member." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();
    const member = await updateMember(id, {
      name: body.name,
      fatherId: body.fatherId,
      motherId: body.motherId,
      birthDate: body.birthDate,
    });
    return Response.json({ member });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const deleted = await deleteMember(id);
    if (!deleted) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/members/${id}]`, err);
    return Response.json({ error: "Failed to delete member." }, { status: 500 });
  }
}
