"use client";

import { useEffect, useRef } from "react";
import type { DailyCall } from "@daily-co/daily-js";

interface Props {
  roomUrl: string;
  token: string;
  userName: string;
  onLeave: () => void;
}

export function VideoCall({ roomUrl, token, userName, onLeave }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<DailyCall | null>(null);
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!containerRef.current || !roomUrl || !token) return;

    let cancelled = false;
    let localFrame: DailyCall | null = null;

    async function setupFrame() {
      const mod = await import("@daily-co/daily-js");
      if (cancelled) return;

      // Protection 1 — détruire toute instance singleton Daily existante
      try {
        const existing = mod.default.getCallInstance();
        if (existing) await existing.destroy();
      } catch (e) {
        console.warn("Daily: failed to destroy existing instance:", e);
      }

      // Protection 2 — laisser le microtask queue se vider
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled || !containerRef.current) return;

      // Protection 3 — vider le container DOM (iframe orpheline éventuelle)
      containerRef.current.innerHTML = "";

      // Protection 4 — try/catch sur createFrame avec retry si Duplicate
      try {
        localFrame = mod.default.createFrame(containerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: { width: "100%", height: "100%", border: "0" },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Duplicate")) {
          try {
            const stuck = mod.default.getCallInstance();
            if (stuck) await stuck.destroy();
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (cancelled || !containerRef.current) return;
            containerRef.current.innerHTML = "";
            localFrame = mod.default.createFrame(containerRef.current, {
              showLeaveButton: false,
              showFullscreenButton: true,
              iframeStyle: { width: "100%", height: "100%", border: "0" },
            });
          } catch (retryErr) {
            console.error("Daily: retry createFrame failed:", retryErr);
            return;
          }
        } else {
          console.error("Daily: createFrame failed:", err);
          return;
        }
      }

      if (cancelled || !localFrame) {
        localFrame?.destroy();
        return;
      }

      frameRef.current = localFrame;
      localFrame.on("left-meeting", () => onLeaveRef.current());

      try {
        await localFrame.join({ url: roomUrl, token, userName });
      } catch (err) {
        console.error("Daily: join failed:", err);
      }
    }

    setupFrame();

    return () => {
      cancelled = true;
      const f = frameRef.current;
      frameRef.current = null;
      if (f) {
        f.destroy().catch((e) => console.warn("Daily: destroy on unmount failed:", e));
      }
    };
  }, [roomUrl, token, userName]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-gray-900 rounded-xl overflow-hidden"
    />
  );
}
