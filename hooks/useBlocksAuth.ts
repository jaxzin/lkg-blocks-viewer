import { useEffect, useState } from "react";
import { validateSession } from "@lookingglass/blocks.js";
import { blocksAuthClient } from "../lib/blocksAuthClient";

export default function useBlocksAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    validateSession(blocksAuthClient).then(setToken);
  }, []);

  return {
    token,
    isLoggedIn: token !== null,
  };
}