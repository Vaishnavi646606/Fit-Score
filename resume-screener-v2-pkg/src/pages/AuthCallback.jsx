import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    console.log("TOKEN RECEIVED:", token);

    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "/upload";
    } else {
      window.location.href = "/login";
    }
  }, []);

  return <h2>Logging you in...</h2>;
}