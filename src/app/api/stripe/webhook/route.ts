import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function setPlanByCustomer(customerId: string, plan: "PRO" | "FREE") {
  await prisma.business.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return new Response("Mangler webhook-signatur.", { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Ugyldig signatur.", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const businessId = s.metadata?.businessId;
      const customerId =
        typeof s.customer === "string" ? s.customer : s.customer?.id;
      if (businessId && customerId) {
        await prisma.business.update({
          where: { id: businessId },
          data: { stripeCustomerId: customerId, plan: "PRO" },
        });
      } else if (customerId) {
        await setPlanByCustomer(customerId, "PRO");
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const active = ["active", "trialing", "past_due"].includes(sub.status);
      await setPlanByCustomer(customerId, active ? "PRO" : "FREE");
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await setPlanByCustomer(customerId, "FREE");
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
