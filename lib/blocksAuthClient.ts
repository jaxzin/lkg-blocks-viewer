// lib/blocksAuthClient.ts
import { createAuthClient } from "@lookingglass/blocks.js";

export const blocksAuthClient = createAuthClient({
  // Be sure to set BLOCKS_CLIENT_ID in your .env file
  clientId: process.env.BLOCKS_CLIENT_ID ?? "",
})