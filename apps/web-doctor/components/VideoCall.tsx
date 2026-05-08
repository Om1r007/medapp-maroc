"use client";

import { useEffect, useRef } from "react";

interface Props {
  roomUrl: string;
  token: string;
  userName: string;
  onLeave: () => void;
}

export function VideoCall({ roomUrl, token, userName, onLeave }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frameRef = useRef<any>(null);
  const onLeaveRef = useRef(onLeave);
  useEffect(() => { onLeaveRef.current = onLeave; });

  useEffect(() => {
    if (!containerRef.current || !roomUrl || !token) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let frame: any = null;
    let cancelled = false;

    import("@daily-co/daily-js").then((mod) => {
      if (cancelled || !containerRef.current) return;

      // Détruire toute frame existante (sécurité React StrictMode double-mount)
      try { mod.default.getCallInstance()?.destroy(); } catch {}

      frame = mod.default.createFrame(containerRef.current, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          border: "0",
        },
      });

      frameRef.current = frame;
      frame.join({ url: roomUrl, token, userName });
      frame.on("left-meeting", () => onLeaveRef.current());
    });

    return () => {
      cancelled = true;
      frame?.destroy();
      frameRef.current = null;
    };
  }, [roomUrl, token, userName]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-gray-900 rounded-xl overflow-hidden"
    />
  );
}
