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

  useEffect(() => {
    if (!containerRef.current || frameRef.current) return;

    let frame: any;

    import("@daily-co/daily-js").then((mod) => {
      if (!containerRef.current) return;

      frame = mod.default.createFrame(containerRef.current, {
        showLeaveButton: true,
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
      frame.on("left-meeting", onLeave);
    });

    return () => {
      frame?.destroy();
      frameRef.current = null;
    };
  // roomUrl/token/userName won't change for a given call — intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-gray-900 rounded-xl overflow-hidden"
    />
  );
}
