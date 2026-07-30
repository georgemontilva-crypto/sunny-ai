import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

const CONNECTION_DISTANCE = 110;

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particleCount = window.innerWidth < 768 ? 14 : 28;

    // Sized to the container (Hero's <section>), not the viewport — and
    // scaled for devicePixelRatio so it isn't blurry on retina screens.
    let rect = container.getBoundingClientRect();
    const resize = () => {
      rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.15 + 0.05,
    }));

    const drawFrame = () => {
      // Real clear — a translucent white fillRect on an arena background
      // accumulates into a visible haze over time instead of clearing.
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach((p, i) => {
        ctx.fillStyle = `rgba(180, 160, 130, ${p.opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECTION_DISTANCE) {
            ctx.strokeStyle = `rgba(180, 160, 130, ${(1 - distance / CONNECTION_DISTANCE) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
    };

    if (prefersReducedMotion) {
      drawFrame();
      return () => resizeObserver.disconnect();
    }

    let frameId: number | null = null;

    const animate = () => {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > rect.width) p.vx *= -1;
        if (p.y < 0 || p.y > rect.height) p.vy *= -1;

        p.x = Math.max(0, Math.min(rect.width, p.x));
        p.y = Math.max(0, Math.min(rect.height, p.y));
      });

      drawFrame();
      frameId = requestAnimationFrame(animate);
    };

    // Pause the loop entirely while the section is scrolled out of view.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && frameId === null) {
          frameId = requestAnimationFrame(animate);
        } else if (!entry.isIntersecting && frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  // No z-index here — the parent in Hero.tsx owns stacking (z-[2], between
  // the background photo/gradient and the copy).
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
