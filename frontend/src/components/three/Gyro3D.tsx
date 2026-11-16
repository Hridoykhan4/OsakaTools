"use client";

import { useEffect, useRef } from "react";
import {
  NeutralToneMapping, BoxGeometry, Color, DirectionalLight, Group, HemisphereLight, InstancedMesh, Matrix4,
  Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PMREMGenerator, Scene,
  SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// The OSAKA TOOL gyroscope: a hinomaru sphere held in brushed-steel gimbal rings,
// one engraved with a measurement dial. It follows the pointer, spins with scroll
// velocity and only renders while visible.
export default function Gyro3D({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch { return; } // no WebGL: the CSS sun stays.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    const camera = new PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 12.6);

    scene.add(new HemisphereLight(0xffffff, 0xe8e2d6, 0.6));
    const key = new DirectionalLight(0xfff4e6, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);

    const rig = new Group();
    scene.add(rig);

    const seg = small ? 96 : 160;
    const sun = new Mesh(
      new SphereGeometry(1.32, small ? 48 : 72, small ? 48 : 72),
      new MeshPhysicalMaterial({ color: new Color("#a8001f"), roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.1 }),
    );
    rig.add(sun);

    const steel = new MeshStandardMaterial({ color: new Color("#ece9e2"), metalness: 1, roughness: 0.2 });
    const graphite = new MeshStandardMaterial({ color: new Color("#2a2c30"), metalness: 0.8, roughness: 0.35 });
    const gold = new MeshStandardMaterial({ color: new Color("#b8955a"), metalness: 1, roughness: 0.28 });

    const ring = (radius: number, tube: number, mat: MeshStandardMaterial) => new Mesh(new TorusGeometry(radius, tube, 20, seg), mat);
    const g1 = new Group(); const g2 = new Group(); const g3 = new Group(); const g4 = new Group();
    g1.add(ring(2.05, 0.05, steel));
    g2.add(ring(2.5, 0.035, graphite));
    g3.add(ring(2.95, 0.06, steel));
    g4.add(ring(3.45, 0.018, gold));

    // Dial ticks engraved around the graphite ring: every fifth is long, every tenth is red.
    const ticks = 120;
    const tickMesh = new InstancedMesh(new BoxGeometry(0.018, 0.14, 0.03), graphite, ticks);
    const red = new InstancedMesh(new BoxGeometry(0.03, 0.3, 0.04), sun.material, ticks / 10);
    const m = new Matrix4(); const o = new Object3D();
    let r = 0;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      o.position.set(Math.cos(a) * 2.72, Math.sin(a) * 2.72, 0);
      o.rotation.set(0, 0, a - Math.PI / 2);
      o.scale.set(1, i % 5 === 0 ? 1.8 : 1, 1);
      o.updateMatrix();
      if (i % 10 === 0) red.setMatrixAt(r++, o.matrix); else tickMesh.setMatrixAt(i, m.copy(o.matrix));
    }
    g2.add(tickMesh, red);

    g1.rotation.set(Math.PI / 2.4, 0, 0);
    g2.rotation.set(0, 0, 0.3);
    g3.rotation.set(0, Math.PI / 2.6, 0);
    g4.rotation.set(Math.PI / 2, 0.25, 0);
    rig.add(g1, g2, g3, g4);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const pointer = new Vector2();
    const onPointer = (e: PointerEvent) => { pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1); };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let lastY = window.scrollY, spin = 0;
    const onScroll = () => { spin += (window.scrollY - lastY) * 0.0009; lastY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true, raf = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(tick); });
    io.observe(el);

    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 4);
    function frame(now: number) {
      const t = (now - start) / 1000;
      const intro = reduce ? 1 : ease(t / 2.2);
      spin *= 0.92;
      g1.rotation.x += 0.0035 + spin; g1.rotation.y += 0.0012;
      g2.rotation.z -= 0.002 + spin * 0.6;
      g3.rotation.y += 0.0042 + spin * 0.8;
      g4.rotation.z += 0.0011;
      sun.rotation.y += 0.004;
      rig.scale.setScalar(0.72 + 0.28 * intro);
      rig.rotation.y += (pointer.x * 0.45 - rig.rotation.y) * 0.05;
      rig.rotation.x += (pointer.y * 0.3 - rig.rotation.x) * 0.05;
      rig.position.y = (1 - intro) * -0.6 + Math.sin(t * 0.8) * 0.06;
      renderer.render(scene, camera);
    }
    function tick(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      frame(now);
      raf = requestAnimationFrame(tick);
    }
    const onVis = () => { if (!document.hidden && visible && !raf && !reduce) raf = requestAnimationFrame(tick); };
    document.addEventListener("visibilitychange", onVis);

    frame(performance.now() + (reduce ? 1e6 : 0));
    onReady?.();
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((obj) => {
        const mesh = obj as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      [steel, graphite, gold, sun.material as MeshPhysicalMaterial].forEach((mat) => mat.dispose());
      env.dispose(); pmrem.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" aria-hidden />;
}
