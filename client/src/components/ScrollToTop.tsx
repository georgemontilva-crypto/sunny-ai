import { useEffect } from "react";
import { useLocation } from "wouter";

// wouter never reloads the document on navigation, so it never resets
// scroll position either — landing on a new route otherwise keeps whatever
// scroll offset the previous page had. Resets to the top on every route
// change, except when the URL carries a hash (e.g. /partner#pricing) —
// then it scrolls to that section instead, same as a normal anchor link.
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
