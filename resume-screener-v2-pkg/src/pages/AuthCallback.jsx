import { useEffect } from "react";
import { TOKEN_KEY } from "../auth";

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.location.href = "/upload";
    } else {
      window.location.href = "/login";
    }
  }, []);

  return <h2>Logging you in...</h2>;
}