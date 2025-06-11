'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { Color, Vector3, BufferAttribute } from 'three';

function FlowingParticles() {
  const pointsRef = useRef<any>(null);
  
  const particleCount = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8; // y - keep particles closer to center line
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1; // z
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const color = new Color('#60A5FA'); // Just use blue for cleaner look
    
    for (let i = 0; i < particleCount; i++) {
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return cols;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const time = clock.getElapsedTime();
      const positions = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Slower, more subtle flowing movement
        positions[i3] += 0.015;
        
        // Gentle wave motion
        positions[i3 + 1] += Math.sin(time * 1.5 + positions[i3] * 0.3) * 0.0005;
        
        // Reset particles that flow off screen
        if (positions[i3] > 5) {
          positions[i3] = -5;
          positions[i3 + 1] = (Math.random() - 0.5) * 0.8;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation={true}
        blending={2}
      />
    </Points>
  );
}

function EnergyLine() {
  const lineRef = useRef<any>(null);
  
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 10 - 5; // -5 to 5
      const y = Math.sin(i * 0.1) * 0.2;
      const z = 0;
      pts.push(new Vector3(x, y, z));
    }
    return pts;
  }, []);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const time = clock.getElapsedTime();
      const positions = lineRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i <= 100; i++) {
        const i3 = i * 3;
        const x = (i / 100) * 10 - 5;
        positions[i3] = x;
        positions[i3 + 1] = Math.sin(i * 0.1 + time * 2) * 0.3 + Math.sin(i * 0.05 + time) * 0.1;
        positions[i3 + 2] = Math.cos(i * 0.08 + time * 1.5) * 0.1;
      }
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(101 * 3), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#60A5FA" transparent opacity={0.6} linewidth={2} />
    </line>
  );
}

export function AnimatedDivider() {
  return (
    <div className="relative w-full h-16 my-8 overflow-hidden">
      {/* Three.js animated content */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <FlowingParticles />
      </Canvas>
      
      {/* Main gradient line */}
      <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 via-purple-400/20 to-transparent"></div>
      </div>
      
      {/* Center accent */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-blue-400/60 rounded-full blur-sm animate-pulse"></div>
      </div>
    </div>
  );
} 