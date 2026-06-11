import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;

if (!apiKey) {
  // We log a warning instead of throwing at import time to prevent build-time crashes 
  // if env variables are not yet loaded in some environments.
  console.warn("WARNING: PADDLE_API_KEY is not set. Paddle operations will fail.");
}

export const paddle = new Paddle(apiKey || "dummy_api_key", {
  environment:
    process.env.VITE_PADDLE_ENV === "production"
      ? Environment.production
      : Environment.sandbox,
});
