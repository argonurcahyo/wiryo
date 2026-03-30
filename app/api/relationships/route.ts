import { NextRequest } from "next/server";
import { createRelationship, getAllRelationships } from "@/lib/relationships";

export async function GET() {
  try {
    const relationships = await getAllRelationships();
    return Response.json({ relationships });
  } catch (err) {
    console.error("[GET /api/relationships]", err);
    return Response.json({ error: "Failed to fetch relationships." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const relationship = await createRelationship({
      memberAId: body.memberAId,
      memberBId: body.memberBId,
      status: body.status === "former" ? "former" : "current",
    });
    return Response.json({ relationship }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}
