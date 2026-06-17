"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";

type PointsAwardedPayload = {
  matchId?: string;
  updated?: number;
  awards?: Array<{
    userId: string;
    points: number;
  }>;
};

type Celebration = {
  id: number;
  points: number;
};

const confettiPieces = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: ((index % 6) - 2.5) * 22,
  rotate: index * 23,
  delay: index * 0.012
}));

function isPointsAwardedPayload(value: unknown): value is PointsAwardedPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as PointsAwardedPayload;
  return !payload.awards || Array.isArray(payload.awards);
}

export function PointsCelebration() {
  const [userId, setUserId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationId = useRef(0);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!active) return;
        const currentUserId = typeof session?.user?.id === "string" ? session.user.id : null;
        setUserId(currentUserId);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    const handlePointsAwarded = (payload: unknown) => {
      if (!isPointsAwardedPayload(payload)) return;

      const points = (payload.awards ?? [])
        .filter((award) => award.userId === userId && award.points > 0)
        .reduce((total, award) => total + award.points, 0);

      if (points <= 0) return;

      celebrationId.current += 1;
      setCelebration({ id: celebrationId.current, points });
      window.setTimeout(() => {
        setCelebration((current) => (current?.id === celebrationId.current ? null : current));
      }, 4200);
    };

    socket.on("points_awarded", handlePointsAwarded);

    return () => {
      socket.off("points_awarded", handlePointsAwarded);
    };
  }, [userId]);

  return (
    <AnimatePresence>
      {celebration ? (
        <motion.div
          key={celebration.id}
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="pointer-events-none fixed inset-x-4 bottom-5 z-50 mx-auto max-w-sm overflow-hidden rounded-3xl border border-amber-200/20 bg-background/92 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-8"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),transparent_45%,rgba(251,191,36,0.16))]" />
          <div className="relative">
            <div className="absolute left-1/2 top-6 -translate-x-1/2">
              {confettiPieces.map((piece) => (
                <motion.span
                  key={piece.id}
                  initial={{ opacity: 0, x: 0, y: 0, rotate: piece.rotate }}
                  animate={{ opacity: [0, 1, 0], x: piece.x, y: -78 - (piece.id % 4) * 12, rotate: piece.rotate + 180 }}
                  transition={{ duration: 1.25, delay: piece.delay, ease: "easeOut" }}
                  className="absolute h-2 w-1 rounded-full bg-amber-200"
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <motion.span
                initial={{ rotate: -12, scale: 0.85 }}
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 0.8 }}
                className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/15 text-amber-100"
              >
                <Trophy size={25} />
              </motion.span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/80">Points awarded</p>
                <p className="mt-1 text-2xl font-semibold">+{celebration.points} pts</p>
                <p className="mt-1 text-sm text-muted-foreground">Your prediction hit. Leaderboard updated.</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
