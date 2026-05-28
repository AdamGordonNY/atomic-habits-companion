import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Clerk webhook event types (subset) ──────────────────────────────────────

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserPayload | { id: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractUserFields(data: ClerkUserPayload) {
  const email =
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses[0]?.email_address ??
    "";

  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

  return { id: data.id, email, name, image: data.image_url };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  // Verify signature using svix
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  switch (event.type) {
    case "user.created": {
      const fields = extractUserFields(event.data as ClerkUserPayload);
      await prisma.user.upsert({
        where: { id: fields.id },
        create: {
          id: fields.id,
          email: fields.email,
          name: fields.name,
          image: fields.image,
          emailVerified: null,
        },
        update: {}, // already exists — nothing to overwrite on create
      });
      break;
    }

    case "user.updated": {
      const fields = extractUserFields(event.data as ClerkUserPayload);
      await prisma.user.upsert({
        where: { id: fields.id },
        create: {
          id: fields.id,
          email: fields.email,
          name: fields.name,
          image: fields.image,
          emailVerified: null,
        },
        update: {
          email: fields.email,
          name: fields.name,
          image: fields.image,
        },
      });
      break;
    }

    // user.deleted — Clerk sends a stripped payload with only `id`
    // Cascade deletes on the schema handle all child records automatically.
    case "user.deleted": {
      const { id } = event.data as { id: string };
      await prisma.user.deleteMany({ where: { id } });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
