'use client';

// imports for the project
import Link from 'next/link';
import React, { useRef, useEffect, useState } from 'react';
import { WorldNoGravity } from '../lib/physics/WorldNoGravity';
import { Particle } from '../lib/physics/Particle';
import { Vector2D } from '../lib/physics/Vector2D';
import TypewriterText from '../components/TypewriterText';

import { saveAs } from 'file-saver'; // Import file-saver for downloading JSON
import homeData from '../components/home.json'; // Import the default JSON file
import { World } from '@/lib/physics/World';

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  className?: string;
}

// declare constants
const canvasWidth = 1920;
const canvasHeight = 1030;
const particleRadius = 10;

// declare instance of World object
const world = new WorldNoGravity();

export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameTick, setFrameTick] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [slopeMode, setSlopeMode] = useState(false);
  const [slopePoints, setSlopePoints] = useState<Vector2D[]>([]);
  const [showSlopeModal, setShowSlopeModal] = useState(false);
  const [highlightedSlope, setHighlightedSlope] = useState<number | null>(null);
  const [ropeMode, setRopeMode] = useState(false);
  const [ropePoints, setRopePoints] = useState<Particle[]>([]);
  const [showCoordinateModal, setShowCoordinateModal] = useState(false);
  const [coordinateInputs, setCoordinateInputs] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = canvasHeight - (e.clientY - rect.top); // Flip y-coordinate

    let foundIndex: number | null = null;
    world.slopes.forEach((slope, index) => {
      const dx = slope.end.x - slope.start.x;
      const dy = slope.end.y - slope.start.y;
      const lengthSquared = dx * dx + dy * dy;

      if (lengthSquared === 0) return; // Skip degenerate slopes

      const t = ((clickX - slope.start.x) * dx + (clickY - slope.start.y) * dy) / lengthSquared;
      const clampedT = Math.max(0, Math.min(1, t));

      const closestX = slope.start.x + clampedT * dx;
      const closestY = slope.start.y + clampedT * dy;

      const distanceSquared = (clickX - closestX) ** 2 + (clickY - closestY) ** 2;
      const thresholdSquared = 10 ** 2; // Highlight threshold

      if (distanceSquared < thresholdSquared) {
        foundIndex = index;
      }
    });

    setHighlightedSlope(foundIndex);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && highlightedSlope !== null) {
      world.slopes.splice(highlightedSlope, 1);
      setHighlightedSlope(null);
      draw();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [highlightedSlope]);

  // Initial setup
  useEffect(() => {
    const particle = new Particle(canvasWidth / 2, 50, 0, 0, 1);
    world.addParticle(particle);
    draw();
  }, []);

  // Load default attributes from home.json
  useEffect(() => {
    if (homeData) {
      world.particles = homeData.particles.map((p: any) => {
        const particle = new Particle(
          p.position.x,
          p.position.y,
          p.velocity.x,
          p.velocity.y,
          p.mass
        );
        particle.appliedForce = new Vector2D(p.appliedForce.x, p.appliedForce.y);
        particle.isStationary = p.isStationary;
        return particle;
      });

      world.slopes = homeData.slopes.map((s: any) => ({
        start: new Vector2D(s.start.x, s.start.y),
        end: new Vector2D(s.end.x, s.end.y),
      }));

      draw();
    }
  }, []);

  // Draw all particles and slopes
  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw ropes
    world.ropes.forEach((rope) => {
      ctx.beginPath();
      ctx.moveTo(rope.start.position.x, canvasHeight - rope.start.position.y);
      ctx.lineTo(rope.end.position.x, canvasHeight - rope.end.position.y);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw slopes
    world.slopes.forEach((slope, index) => {
      ctx.beginPath();
      ctx.moveTo(slope.start.x, canvasHeight - slope.start.y);
      ctx.lineTo(slope.end.x, canvasHeight - slope.end.y);
      ctx.strokeStyle = "#1E1E2F";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw particles
    for (const p of world.particles) {
      const flippedY = canvasHeight - p.position.y; // Flip y-coordinate to fix coordinates system.

      ctx.beginPath();
      ctx.arc(p.position.x, flippedY, particleRadius, 0, 2 * Math.PI);
      // Neon glow effect
      ctx.save();
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 50;
      ctx.fillStyle = 'cyan';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'cyan'; // Set circle color to cyan (main fill)
      ctx.fill();
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      
    }
  };

  const handleDownload = () => {
    const particleData = world.particles.map((p) => ({
      position: { x: p.position.x, y: p.position.y },
      velocity: { x: p.velocity.x, y: p.velocity.y },
      mass: p.mass,
      appliedForce: { x: p.appliedForce.x, y: p.appliedForce.y },
      isStationary: p.isStationary,
    }));

    const slopeData = world.slopes.map((slope) => ({
      start: { x: slope.start.x, y: slope.start.y },
      end: { x: slope.end.x, y: slope.end.y },
    }));

    const data = { particles: particleData, slopes: slopeData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'world_data.json');
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        world.particles = data.particles.map((p: any) => {
          const particle = new Particle(
            p.position.x,
            p.position.y,
            p.velocity.x,
            p.velocity.y,
            p.mass
          );
          particle.appliedForce = new Vector2D(p.appliedForce.x, p.appliedForce.y);
          particle.isStationary = p.isStationary;
          return particle;
        });

        world.slopes = data.slopes.map((s: any) => ({
          start: new Vector2D(s.start.x, s.start.y),
          end: new Vector2D(s.end.x, s.end.y),
        }));

        draw();
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  };
  // Animation loop
 
  useEffect(() => {
    let animationFrame: number;

    const loop = () => {
      if (isPlaying) {
        world.step(1 / 30); // faster sim
        draw();
      }

      // Force re-render to update table
      setFrameTick((tick) => tick + 1);
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  useEffect(() => {
  let count = 0;

  const spawnParticle = () => {
    if (count >= 200) return;

    const vx = Math.floor(Math.random() * 100) + 1;
    const vy = Math.floor(Math.random() * 100) + 1;

    let x: number, y: number;
    do {
      x = Math.random() * (canvasWidth - 2 * particleRadius) + particleRadius;
      y = Math.random() * (canvasHeight - 2 * particleRadius) + particleRadius;
    } while (
      x >= 700 && x <= 1200 &&
      y >= 600 && y <= 800
    );

    const newParticle = new Particle(x, y, vx, vy, 1);
    world.addParticle(newParticle);
    draw();

    count++;
  };

  // Spawn 6 particles immediately
  for (let i = 0; i < 6; i++) {
    spawnParticle();
  }

  // Spawn 1 every 2 seconds
  const interval = setInterval(() => {
    if (count >= 200) {
      clearInterval(interval);
    } else {
      spawnParticle();
    }
  }, 2000);

  return () => clearInterval(interval);
}, []);

  return (
  <div style={{ backgroundColor: '#1E1E2F' }}>
    <div
      style={{
        position: 'absolute',
        top: '223px',
        left: '495px',
        display: 'flex',
        alignItems: 'flex-start', // aligns icon to top of text block
        zIndex: 1000,
      }}
    >
      <img
        className="floating-button"
        data-title="Icon"
        src="icon.png"
        alt="Label or icon"
        style={{
          top: '205px',
          width: '207px',
          height: '207px',
          marginRight: '24px',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <TypewriterText
          text="Forceplay"
          speed={20}
          className="text-white text-7xl font-mono"
        />
        
        <p className="text-gray-300 text-2xl font-mono mt-4 fadein">
          A simple, interactive physics sandbox to visualise mechanics problems.
        </p>
        <Link href="/sandbox">
        <div className="cirrcle absolute top-[200px] left-[350px] pt-6 text-[#F0F0F0]">
            <p className="enter">Enter</p>
      </div>
      </Link>
      </div>
    </div>

    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onContextMenu={handleCanvasRightClick}
    />
  </div>
);
}