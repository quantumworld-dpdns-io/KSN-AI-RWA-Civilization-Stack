"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type MicrogridSceneProps = {
  blur: number;
};

type NodeSpec = {
  position: THREE.Vector3;
  pulse: number;
  role: "hub" | "energy" | "compute";
};

function buildTopology(): { nodes: NodeSpec[]; edges: [number, number][] } {
  const nodes: NodeSpec[] = [];
  const edges: [number, number][] = [];

  // Central sovereign hub
  nodes.push({
    position: new THREE.Vector3(0, 0, 0),
    pulse: 0,
    role: "hub",
  });

  // Inner ring — energy nodes
  const inner = 8;
  for (let i = 0; i < inner; i += 1) {
    const a = (i / inner) * Math.PI * 2;
    nodes.push({
      position: new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a * 1.3) * 0.35, Math.sin(a) * 2.2),
      pulse: i * 0.4,
      role: "energy",
    });
    edges.push([0, nodes.length - 1]);
  }

  // Outer ring — compute / grid nodes
  const outer = 16;
  for (let i = 0; i < outer; i += 1) {
    const a = (i / outer) * Math.PI * 2 + 0.18;
    const r = 4.1 + (i % 3) * 0.25;
    nodes.push({
      position: new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2.1) * 0.55, Math.sin(a) * r),
      pulse: i * 0.25,
      role: "compute",
    });
    const energyIdx = 1 + (i % inner);
    edges.push([energyIdx, nodes.length - 1]);
    if (i % 2 === 0) edges.push([0, nodes.length - 1]);
  }

  // Ring links for mesh feel
  for (let i = 0; i < inner; i += 1) {
    edges.push([1 + i, 1 + ((i + 1) % inner)]);
  }
  for (let i = 0; i < outer; i += 1) {
    edges.push([1 + inner + i, 1 + inner + ((i + 1) % outer)]);
  }

  return { nodes, edges };
}

function TopologyMesh() {
  const group = useRef<THREE.Group>(null);
  const { nodes, edges } = useMemo(() => buildTopology(), []);

  const linePositions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      const pa = nodes[a].position;
      const pb = nodes[b].position;
      const o = i * 6;
      arr[o] = pa.x;
      arr[o + 1] = pa.y;
      arr[o + 2] = pa.z;
      arr[o + 3] = pb.x;
      arr[o + 4] = pb.y;
      arr[o + 5] = pb.z;
    });
    return arr;
  }, [edges, nodes]);

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.08;
      group.current.rotation.x = Math.sin(t * 0.15) * 0.12;
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#3dffc8" transparent opacity={0.28} />
      </lineSegments>
      {nodes.map((node, i) => (
        <NodeMesh key={i} node={node} />
      ))}
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 6, 3]} intensity={1.4} color="#5cf0ff" />
      <pointLight position={[-5, -2, -4]} intensity={0.8} color="#2dff9a" />
    </group>
  );
}

function NodeMesh({ node }: { node: NodeSpec }) {
  const mesh = useRef<THREE.Mesh>(null);
  const scale =
    node.role === "hub" ? 0.18 : node.role === "energy" ? 0.09 : 0.055;
  const color =
    node.role === "hub" ? "#7cfff0" : node.role === "energy" ? "#3dffc8" : "#5cb8ff";

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!mesh.current) return;
    const pulse = 1 + Math.sin(t * 2.2 + node.pulse) * 0.18;
    mesh.current.scale.setScalar(scale * pulse);
    mesh.current.position.y = node.position.y + Math.sin(t * 1.4 + node.pulse) * 0.06;
  });

  return (
    <mesh ref={mesh} position={node.position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={node.role === "hub" ? 2.2 : 1.4}
        roughness={0.25}
        metalness={0.4}
      />
    </mesh>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 420;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#6ee7ff" size={0.028} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

export function MicrogridScene({ blur }: MicrogridSceneProps) {
  return (
    <div
      className="landing-canvas"
      style={{ filter: `blur(${blur}px)`, opacity: 1 - blur * 0.035 }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.8, 9.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#03070a"]} />
        <fog attach="fog" args={["#03070a", 8, 22]} />
        <TopologyMesh />
        <ParticleField />
      </Canvas>
    </div>
  );
}
