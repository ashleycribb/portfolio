/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Environment, Stars, Box } from '@react-three/drei';
import * as THREE from 'three';
import { TemplateType } from './Editor';

// Augment JSX.IntrinsicElements to include R3F primitives to fix type errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
    }
  }
}

const FloatingShape = memo(({ position, color, scale = 1, speed = 1, distort = 0.4, variant }: { position: [number, number, number]; color: string; scale?: number; speed?: number; distort?: number; variant: TemplateType }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(t * 0.5 * speed + position[0]) * 0.2;
      ref.current.rotation.x = t * 0.2 * speed;
      ref.current.rotation.z = t * 0.1 * speed;
    }
  });

  if (variant === 'brutal') {
      return (
          <Box ref={ref} args={[1.5, 1.5, 1.5]} position={position} scale={scale}>
               {/* @ts-ignore */}
               <meshBasicMaterial color={color} wireframe />
          </Box>
      );
  }

  return (
    <Sphere ref={ref} args={[1, 64, 64]} position={position} scale={scale}>
      <MeshDistortMaterial
        color={color}
        envMapIntensity={variant === 'cyber' ? 2 : 1}
        clearcoat={variant === 'classic' ? 0.8 : 0.1}
        clearcoatRoughness={0.2}
        metalness={variant === 'cyber' ? 0.9 : 0.1}
        roughness={variant === 'cyber' ? 0.2 : 0.4}
        distort={distort || 0}
        speed={speed || 0}
        emissive={variant === 'cyber' ? color : "#000000"}
        emissiveIntensity={variant === 'cyber' ? 0.5 : 0}
      />
    </Sphere>
  );
});

const GeometricRing = memo(({ variant }: { variant: TemplateType }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
       const t = state.clock.getElapsedTime();
       ref.current.rotation.x = Math.sin(t * 0.1) * 0.1 + Math.PI / 2;
       ref.current.rotation.y = t * 0.05;
    }
  });

  const color = variant === 'cyber' ? '#00FFFF' : (variant === 'brutal' ? '#000000' : '#444');
  const opacity = variant === 'brutal' ? 1 : 0.3;

  return (
    <Torus ref={ref} args={[3.5, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
      {/* @ts-ignore */}
      <meshStandardMaterial 
        color={color} 
        emissive={variant === 'cyber' ? "#00FFFF" : "#000000"} 
        emissiveIntensity={variant === 'cyber' ? 1 : 0}
        transparent 
        opacity={opacity} 
        wireframe={variant === 'brutal'} 
      />
    </Torus>
  );
});

export const AbstractScene = memo(({ variant = 'classic' }: { variant?: TemplateType }) => {
  const isCyber = variant === 'cyber';
  const isBrutal = variant === 'brutal';

  const mainColor = isCyber ? "#22d3ee" : (isBrutal ? "#000000" : "#e5e5e0");
  const accent1 = isCyber ? "#a855f7" : (isBrutal ? "#ef4444" : "#C5A059");
  const accent2 = isCyber ? "#3b82f6" : (isBrutal ? "#3b82f6" : "#2a2a2a");

  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${isCyber ? 'opacity-60' : 'opacity-40'}`}>
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        {/* @ts-ignore */}
        <ambientLight intensity={isCyber ? 1.5 : 0.8} />
        {/* @ts-ignore */}
        <pointLight position={[10, 10, 10]} intensity={isCyber ? 2 : 1} color={isCyber ? "#00ffff" : "#fff"} />
        {/* @ts-ignore */}
        <pointLight position={[-10, -5, -5]} intensity={0.5} color={accent1} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Main Hero Object */}
          <FloatingShape position={[0, 0, 0]} color={mainColor} scale={1.4} speed={1.5} distort={0.5} variant={variant} />
          
          <GeometricRing variant={variant} />
        </Float>
        
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
          <FloatingShape position={[-3.5, 1.5, -2]} color={accent1} scale={0.4} speed={2} distort={0.3} variant={variant} />
          <FloatingShape position={[3.5, -1.5, -3]} color={accent2} scale={0.6} speed={1} distort={0.3} variant={variant} />
        </Float>

        <Environment preset={isCyber ? "city" : "studio"} />
        {/* Subtle background particles */}
        <Stars radius={50} depth={50} count={isCyber ? 2000 : 400} factor={4} saturation={isCyber ? 1 : 0} fade speed={0.5} />
      </Canvas>
    </div>
  );
});
