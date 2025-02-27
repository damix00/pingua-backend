import Stripe from "stripe";
import config from "../../utils/config";

export let stripe: Stripe;

export function init() {
    stripe = new Stripe(config.get("STRIPE_SECRET_KEY"));
}
