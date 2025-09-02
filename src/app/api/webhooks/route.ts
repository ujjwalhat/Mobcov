import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import OrderReceivedEmail from "@/components/emails/OrderReceivedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.customer_details?.email) {
        throw new Error("Missing user email");
      }

      const { userId, orderId } = session.metadata || {
        userId: null,
        orderId: null,
      };

      if (!userId || !orderId) {
        throw new Error("Invalid request metadata");
      }

      // Extract addresses safely
      const billingAddress = session.customer_details?.address || null;
      const shippingAddress = session.shipping_details?.address || null;

      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          ...(shippingAddress && {
            shippingAddress: {
              create: {
                name: session.customer_details?.name || "Unknown",
                city: shippingAddress.city || "",
                country: shippingAddress.country || "",
                postalCode: shippingAddress.postal_code || "",
                street: shippingAddress.line1 || "",
                state: shippingAddress.state || "",
              },
            },
          }),
          ...(billingAddress && {
            billingAddress: {
              create: {
                name: session.customer_details?.name || "Unknown",
                city: billingAddress.city || "",
                country: billingAddress.country || "",
                postalCode: billingAddress.postal_code || "",
                street: billingAddress.line1 || "",
                state: billingAddress.state || "",
              },
            },
          }),
        },
      });

      // Send confirmation email
      await resend.emails.send({
        from: "mobcov <ujjwalhat@gmail.com.com>",
        to: [session.customer_details.email],
        subject: "Thanks for your order!",
        react: OrderReceivedEmail({
          orderId,
          orderDate: updatedOrder.createdAt.toLocaleDateString(),
          shippingAddress: {
            id: orderId, // or a unique string
            name: session.customer_details?.name || "Unknown",
            street: shippingAddress?.line1 || "",
            city: shippingAddress?.city || "",
            postalCode: shippingAddress?.postal_code || "",
            country: shippingAddress?.country || "",
            state: shippingAddress?.state || null,
            phoneNumber: shippingAddress?.city || null,
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { message: "Something went wrong", ok: false },
      { status: 500 }
    );
  }
}
