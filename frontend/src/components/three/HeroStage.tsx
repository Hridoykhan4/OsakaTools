"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const Gyro3D = dynamic(() => import("./Gyro3D"), { ssr: false });

// Paints a CSS sun immediately (no JavaScript needed), then swaps in the WebGL
// gyroscope once the browser is idle, so 3D never delays the first paint.
export default function HeroStage() {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setLoad(true);
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 600);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <div className="relative h-full w-full">
      <div aria-hidden className={`absolute left-1/2 top-1/2 aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-beni transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
        style={{ boxShadow: "inset -24px -30px 60px rgba(0,0,0,.18), inset 20px 24px 50px rgba(255,255,255,.18)" }} />
      <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
        {load && <Gyro3D onReady={onReady} />}
      </div>
    </div>
  );
}
