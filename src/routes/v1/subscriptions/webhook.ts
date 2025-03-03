// POST /v1/subscriptions/webhook
// Handles Stripe webhook events

import { Request, Response } from "express";
import { stripe } from "../../../apis/stripe/stripe";
import config from "../../../utils/config";
import Stripe from "stripe";
import { prisma } from "../../../db/prisma";

export default async (req: Request, res: Response) => {
    let event = req.body;

    const endpointSecret = config.get("STRIPE_WEBHOOK_KEY");

    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = req.headers["stripe-signature"];
        try {
            event = stripe.webhooks.constructEvent(
                event,
                signature as string,
                endpointSecret
            );
        } catch (err) {
            console.log(`Webhook signature verification failed.`, err);
            return res.sendStatus(400);
        }
    }
    let subscription;
    let status;
    let uid;
    let user;

    // Handle the event
    switch ((event as Stripe.Event).type) {
        case "customer.subscription.deleted":
            subscription = event.data.object;
            status = subscription.status;
            uid = subscription.metadata.user_id;

            await prisma.user.update({
                where: {
                    id: uid,
                },
                data: {
                    plan: "FREE",
                    planExpiresAt: null,
                    subscriptionId: null,
                },
            });

            break;
        case "checkout.session.completed":
            uid = event.data.object.metadata.user_id;

            if (!uid) {
                console.log("No id found in the event object.");
                return res.sendStatus(400);
            }

            user = await prisma.user.findFirst({
                where: {
                    id: uid,
                },
            });

            if (!user) {
                console.log("No user found with the provided id.");
                return res.sendStatus(400);
            }

            subscription = await stripe.subscriptions.retrieve(
                event.data.object.subscription
            );

            status = subscription.status;

            if (status === "active") {
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        plan: "PREMIUM",
                        planExpiresAt: new Date(
                            (subscription.current_period_end + 1000) * 1000
                        ),
                        subscriptionId: subscription.id,
                    },
                });
            }

            break;
        case "customer.subscription.updated":
            uid = event.data.object.metadata.user_id;

            subscription = event.data.object;
            status = subscription.status;

            user = await prisma.user.findFirst({
                where: {
                    id: uid,
                },
            });

            if (!user) {
                console.log("No user found with the provided id.");
                return res.sendStatus(400);
            }

            if (status === "active") {
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        plan: "PREMIUM",
                        planExpiresAt: new Date(
                            (subscription.current_period_end + 1000) * 1000
                        ),
                        subscriptionId: subscription.id,
                    },
                });
            } else {
                await prisma.user.update({
                    where: {
                        id: uid,
                    },
                    data: {
                        plan: "FREE",
                        planExpiresAt: null,
                    },
                });
            }

            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    // Return a response to acknowledge receipt of the event
    res.send();
};
