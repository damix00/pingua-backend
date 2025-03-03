// POST /v1/subscriptions
// Creates a new subscription for the user and returns the checkout URL

import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { stripe } from "../../../apis/stripe/stripe";
import config from "../../../utils/config";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "paypal"],
            line_items: [
                {
                    price: config.get("PREMIUM_PRICE_ID"),
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: req.user.id,
            },
            mode: "subscription",
            success_url: "http://localhost/success",
            cancel_url: "http://localhost/cancel",
            customer_email: req.user.email,
        });

        res.status(200).json({
            url: session.url,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
