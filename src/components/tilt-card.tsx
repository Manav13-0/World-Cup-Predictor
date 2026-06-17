"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [transform, setTransform] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)");

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const rotateX = (-y * 10).toFixed(2);
    const rotateY = (x * 10).toFixed(2);
    setTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`);
  }

  function reset() {
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)");
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transform }}
      className={cn("transform-gpu transition-transform duration-200 ease-out", className)}
    >
      {children}
    </div>
  );
}
