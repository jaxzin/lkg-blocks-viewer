import { loginWithRedirect } from "@lookingglass/blocks.js";
import useBlocksAuth from "../hooks/useBlocksAuth";
import { blocksAuthClient } from "../lib/blocksAuthClient";

const projectDomain = import.meta.env.VITE_PROJECT_DOMAIN;


export default function LoginButton() {
  const { isLoggedIn, token } = useBlocksAuth();

  if (isLoggedIn) {
    return <>Logged in!</>;
  }

  async function onLoginClick() {
    // This will automatically redirect the user to sign in.
    // The BASE_URL is what Auth0 will redirect to 
    await loginWithRedirect(blocksAuthClient, `https://${projectDomain}.glitch.me`);
  }

  return <button onClick={onLoginClick}>Login</button>;
}