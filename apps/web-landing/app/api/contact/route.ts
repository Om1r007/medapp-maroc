import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, name, email, phone, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  console.log("[contact-form]", { subject, name, email, phone, message });

  return NextResponse.json({ ok: true });
}
