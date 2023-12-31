import * as React from "react";
import LoginButton from "../components/LoginButton";
import useBlocksAuth from "../hooks/useBlocksAuth";
import { useEffect, useState } from "react";
import { BlocksClient } from "@lookingglass/blocks.js";

export default function BlockTest() {
  const { isLoggedIn, token } = useBlocksAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && token) {
      const blocksClient = new BlocksClient({ token });

      // Fetch info about the logged-in user
      blocksClient.me().then((resp) => {
        console.log(resp.me);
        setName(resp.me?.displayName ?? null);
      });
    }
  }, [isLoggedIn]);

  return (
  <>
      {name && <h1>Hello, {name}!</h1>}
      <LoginButton />
  </>
  );
}