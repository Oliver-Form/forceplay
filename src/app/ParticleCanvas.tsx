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

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    const particles = particleSet.getAllParticles();
    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.closePath();
    });
  }, [particleSet]);

  return (
    <div className="relative w-[1900px] h-[800px] border border-gray-300">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
