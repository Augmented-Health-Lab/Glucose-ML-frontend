import { useEffect } from "react";

if (typeof window !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

export function useSaveScroll(key: string) {
  useEffect(() => {
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [key]);
}

export function restoreScroll(key: string) {
  const saved = sessionStorage.getItem(key);
  console.log("restoreScroll", key, saved); 
  if (saved !== null) {
    const y = parseInt(saved, 10);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "instant" });
      });
    });
  }
}

export function clearScroll(key: string) {
  sessionStorage.removeItem(key);
}