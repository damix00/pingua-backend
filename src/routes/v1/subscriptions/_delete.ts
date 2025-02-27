import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { prisma } from "../../../db/prisma";
import { stripe } from "../../../apis/stripe/stripe";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        if (req.user.plan == "FREE" || !req.user.subscriptionId) {
            res.status(402).json({ error: "User is not subscribed" });
            return;
        }

        const stripeResult = await stripe.subscriptions.cancel(
            req.user.subscriptionId
        );

        if (!stripeResult) {
            res.status(500).json({ error: "Failed to cancel subscription" });
            return;
        }

        const result = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            data: {
                plan: "FREE",
                planExpiresAt: null,
                subscriptionId: null,
            },
        });

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
