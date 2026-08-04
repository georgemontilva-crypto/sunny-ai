import type { RefObject } from "react";
import { useInView } from "framer-motion";

// Unlike the once:true useInView calls used for entrance animations
// everywhere else, this tracks visibility continuously — used to pause
// a section's background CSS animations (radial-gradient drift, blur
// breathing) once it's scrolled well out of view. Those keep costing
// paint/layout time every frame even when nothing visible is moving —
// e.g. the hero's lights were still animating while the visitor was
// reading the footer. `margin: "200px"` starts/stops the animation
// slightly before/after the section actually crosses the viewport edge,
// so there's no visible pop when it resumes.
export function useAnimateWhileVisible(ref: RefObject<Element | null>): boolean {
  return useInView(ref, { margin: "200px" });
}
