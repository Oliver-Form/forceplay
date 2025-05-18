"use client";

import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  length: number;
  speed: number;
  color: string;
  dx: number; // horizontal drift for diagonal streaks
}

const colorStops = [
  '#001C3F', // Deep Navy
  '#003366', // Dark Blue
  '#004C99', // Medium Blue
  '#007ACC', // Vivid Blue
  '#00BFFF', // Electric Blue
];

export default function ParticleStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = canvas.parentElement!.clientWidth;
    let height = canvas.parentElement!.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let particles: Particle[] = [];
    // constant rightward slant angle for all streaks (in radians)
    const angleDeg = 2;  // degrees
    const angleRad = angleDeg * (Math.PI / 180);

    const count = 2500;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = Math.random() * 150 + 50;
        const speed = Math.random() * 5 + 5;
        // constant diagonal drift
        const dx = Math.sin(angleRad) * speed;
        const color = colorStops[Math.floor(Math.random() * colorStops.length)];
        particles.push({ x, y, length, speed, color, dx });
      }
    };

    initParticles();

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;

      particles.forEach(p => {
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.dx * (p.length / p.speed), p.y + p.length); // slight diagonal line
        ctx.stroke();

        p.y += p.speed;
        p.x += p.dx;
        if (p.y - p.length > height) {
          p.y = -p.length;
          p.x = Math.random() * width;
        }
      });
    };

    let animationId: number;
    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    const handleResize = () => {
      width = canvas.parentElement!.clientWidth;
      height = canvas.parentElement!.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
}
