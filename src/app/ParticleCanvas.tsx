'use client';

import React, { useEffect, useRef } from 'react';
import { ParticleSet } from './ParticleSet';

interface ParticleCanvasProps {
  particleSet: ParticleSet;
}

export default function ParticleCanvas({ particleSet }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions explicitly
    canvas.width = 1900;
    canvas.height = 800;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    const particles = particleSet.getAllParticles();
    particles.forEach((particle, index) => {
      const flippedY = canvas.height - particle.y; // Flip y-coordinate

      // Draw hollow circle
      ctx.beginPath();
      ctx.arc(particle.x, flippedY, particle.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();

      // Draw label
      ctx.font = '16px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = String.fromCharCode(65 + index); // Convert index to A-Z
      ctx.fillText(label, particle.x, flippedY);
    });
  }, [particleSet]);

  return (
    <div className="relative" style={{ width: '1900px', height: '800px', border: '1px solid gray' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ backgroundColor: 'white' }}
      ></canvas>
    </div>
  );
}
