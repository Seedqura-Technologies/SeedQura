"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Full-hero Fibonacci particle field.
 * - Idle: dense rotating sphere locked to a DOM anchor (right column),
 *   so it aligns with the navbar content width.
 * - Scroll: sphere stays intact until ~half has left the viewport, then
 *   particles scatter across the hero; scrolling back reforms it.
 * - Idle again: particles reform back into the sphere on the anchor.
 * - Mouse repulsion uses window-level pointer tracking mapped into the
 *   canvas, so the hole works over the whole sphere (center included).
 */

const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180);
const PARTICLE_COUNT = 3400;
const SPHERE_RADIUS = 1.05;

// Fallback world X when no DOM anchor is available yet.
const SPHERE_OFFSET_X = 2.6;

// Mouse repulsion (only meaningful while the sphere is mostly intact).
const REPEL_RADIUS = 0.55;
const REPEL_STRENGTH = 0.85;
const REPEL_EASE = 0.14;
const REPEL_MIN_DIST = 0.03;

// Destroy only begins after ~half the globe has scrolled out of the
// viewport top; it then ramps to full scatter as the rest exits.
const DESTROY_START_FRAC = 0.5;
const DESTROY_END_FRAC = 1.0;
const DESTROY_SMOOTH = 0.08;

type PointerState = {
  x: number;
  y: number;
  inside: boolean;
};

function buildFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;

    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }

  return positions;
}

function buildScatterField(count: number) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 43758.5453;
    const c = Math.sin(i * 39.346) * 43758.5453;
    const rx = a - Math.floor(a);
    const ry = b - Math.floor(b);
    const rz = c - Math.floor(c);

    positions[i * 3] = (rx - 0.5) * 12.5;
    positions[i * 3 + 1] = (ry - 0.5) * 7.2;
    positions[i * 3 + 2] = (rz - 0.5) * 4.5;
  }

  return positions;
}

function ParticleField({
  pointerRef,
  anchorRef,
}: {
  pointerRef: { current: PointerState };
  anchorRef?: RefObject<HTMLElement | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });
  const anchorWorld = useRef(new THREE.Vector3(SPHERE_OFFSET_X, 0, 0));
  const planeHit = useRef(new THREE.Vector3());
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    []
  );
  const anchorNdc = useRef(new THREE.Vector2());

  const spherePositions = useMemo(
    () => buildFibonacciSphere(PARTICLE_COUNT, SPHERE_RADIUS),
    []
  );
  const scatterPositions = useMemo(
    () => buildScatterField(PARTICLE_COUNT),
    []
  );
  const currentPositions = useMemo(
    () => spherePositions.slice(),
    [spherePositions]
  );

  const destroyAmount = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useRef(new THREE.Vector2());
  const invQuat = useRef(new THREE.Quaternion());
  const localOrigin = useRef(new THREE.Vector3());
  const localDir = useRef(new THREE.Vector3());

  const material = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.25, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.55, "rgba(108,229,255,0.55)");
      gradient.addColorStop(1, "rgba(108,229,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.PointsMaterial({
      size: 0.042,
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color("#ffffff"),
      sizeAttenuation: true,
    });
  }, []);

  useFrame((state, delta) => {
    const pointer = pointerRef.current;
    targetMouse.current.x = pointer.x * 0.15;
    targetMouse.current.y = pointer.y * 0.15;
    mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.03;
    mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.03;

    const group = groupRef.current;
    if (!group) return;

    // Project the right-column DOM anchor into world space so the idle
    // sphere lines up with the navbar/content column on every resize.
    // Also use its viewport rect to decide when destroy should begin.
    let targetDestroy = 0;
    const anchor = anchorRef?.current;
    const canvasEl = state.gl.domElement;
    if (anchor && canvasEl) {
      const a = anchor.getBoundingClientRect();
      const c = canvasEl.getBoundingClientRect();
      if (a.width > 0 && a.height > 0 && c.width > 0 && c.height > 0) {
        const nx = ((a.left + a.width / 2 - c.left) / c.width) * 2 - 1;
        const ny = -((a.top + a.height / 2 - c.top) / c.height) * 2 + 1;
        anchorNdc.current.set(nx, ny);
        raycaster.setFromCamera(anchorNdc.current, state.camera);
        if (raycaster.ray.intersectPlane(plane, planeHit.current)) {
          anchorWorld.current.copy(planeHit.current);
        }

        // How much of the globe has scrolled past the top of the viewport.
        // Stay intact until ~half is gone, then ramp destroy → 1 as the
        // remainder exits. Scrolling back up reforms the sphere.
        const scrolledOut = Math.max(0, -a.top);
        const start = a.height * DESTROY_START_FRAC;
        const end = a.height * DESTROY_END_FRAC;
        const span = Math.max(1, end - start);
        const raw = (scrolledOut - start) / span;
        targetDestroy = Math.min(1, Math.max(0, raw));
      }
    }

    destroyAmount.current +=
      (targetDestroy - destroyAmount.current) * DESTROY_SMOOTH;
    const destroy = destroyAmount.current;

    const rotFactor = 1 - destroy;
    group.rotation.y += (0.12 * delta + mouse.current.x * 0.01) * rotFactor;
    group.rotation.x += (0.05 * delta + mouse.current.y * 0.01) * rotFactor;
    group.rotation.z += 0.03 * delta * rotFactor;

    // Idle: sit on the navbar-aligned right column. Destroyed: ease to
    // the hero center so scatter can fill the whole section.
    const targetX = anchorWorld.current.x * (1 - destroy);
    const targetY = anchorWorld.current.y * (1 - destroy);
    group.position.x += (targetX - group.position.x) * 0.12;
    group.position.y += (targetY - group.position.y) * 0.12;

    const hovering = pointer.inside && destroy < 0.35;
    if (hovering) {
      ndc.current.set(pointer.x, pointer.y);
      raycaster.setFromCamera(ndc.current, state.camera);
      invQuat.current.copy(group.quaternion).invert();
      localOrigin.current
        .copy(raycaster.ray.origin)
        .sub(group.position)
        .applyQuaternion(invQuat.current);
      localDir.current
        .copy(raycaster.ray.direction)
        .applyQuaternion(invQuat.current)
        .normalize();
    }

    const ox = localOrigin.current.x;
    const oy = localOrigin.current.y;
    const oz = localOrigin.current.z;
    const dx = localDir.current.x;
    const dy = localDir.current.y;
    const dz = localDir.current.z;

    const ease = destroy > 0.08 ? 0.18 : REPEL_EASE;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      const sx = spherePositions[idx];
      const sy = spherePositions[idx + 1];
      const sz = spherePositions[idx + 2];
      const fx = scatterPositions[idx];
      const fy = scatterPositions[idx + 1];
      const fz = scatterPositions[idx + 2];

      const bx = sx + (fx - sx) * destroy;
      const by = sy + (fy - sy) * destroy;
      const bz = sz + (fz - sz) * destroy;

      let pushX = 0;
      let pushY = 0;
      let pushZ = 0;

      if (hovering) {
        const vx = bx - ox;
        const vy = by - oy;
        const vz = bz - oz;
        const t = Math.max(0, vx * dx + vy * dy + vz * dz);
        const cx = ox + dx * t;
        const cy = oy + dy * t;
        const cz = oz + dz * t;
        const ddx = bx - cx;
        const ddy = by - cy;
        const ddz = bz - cz;
        const distSq = ddx * ddx + ddy * ddy + ddz * ddz;

        if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
          const dist = Math.sqrt(distSq);
          const falloff = 1 - dist / REPEL_RADIUS;
          const magnitude = falloff * falloff * REPEL_STRENGTH;
          const safeDist = Math.max(dist, REPEL_MIN_DIST);
          const scale = magnitude / safeDist;
          pushX = ddx * scale;
          pushY = ddy * scale;
          pushZ = ddz * scale;
        }
      }

      currentPositions[idx] += (bx + pushX - currentPositions[idx]) * ease;
      currentPositions[idx + 1] +=
        (by + pushY - currentPositions[idx + 1]) * ease;
      currentPositions[idx + 2] +=
        (bz + pushZ - currentPositions[idx + 2]) * ease;
    }

    const attr = pointsRef.current?.geometry.attributes.position as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[SPHERE_OFFSET_X, 0, 0]}>
      <points ref={pointsRef} material={material} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[currentPositions, 3]}
          />
        </bufferGeometry>
      </points>
    </group>
  );
}

function SoftCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    camera.position.set(
      Math.sin(t.current * 0.1) * 0.1,
      Math.sin(t.current * 0.08) * 0.06,
      5.8
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function FibonacciSphere({
  className = "",
  anchorRef,
}: {
  className?: string;
  anchorRef?: RefObject<HTMLElement | null>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        pointerRef.current.inside = false;
        return;
      }

      pointerRef.current.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y =
        -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerRef.current.inside = true;
    };

    const onLeave = () => {
      pointerRef.current.inside = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        camera={{ fov: 40, near: 0.1, far: 30, position: [0, 0, 5.8] }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.15} />
          <ParticleField pointerRef={pointerRef} anchorRef={anchorRef} />
          <SoftCamera />
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              mipmapBlur
              radius={0.55}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
