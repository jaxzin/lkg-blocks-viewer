// lib/blocksAuthClient.ts
import { createAuthClient } from "@lookingglass/blocks.js";

const clientID = import.meta.env.VITE_BLOCKS_CLIENT_ID;


export const blocksAuthClient = createAuthClient({
  // Be sure to set BLOCKS_CLIENT_ID in your .env file
  clientId: clientID ?? "",
})