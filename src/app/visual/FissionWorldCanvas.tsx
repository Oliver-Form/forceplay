'use client';

// imports for the project
import React, { useRef, useEffect, useState, RefObject } from 'react';
import { WorldNoGravity } from './WorldFission';
import { Particle } from '../../lib/physics/Particle';
import { Vector2D } from '../../lib/physics/VectorFunctions';

import { saveAs } from 'file-saver'; // Import file-saver for downloading JSON

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  className?: string;
}

// declare constants
const virtualWidth = 1920;
const virtualHeight = 1030;
const PARTICLE_RADIUS_MIN = 2;
const PARTICLE_RADIUS_MAX = 12;

// declare instance of World object
const world = new WorldNoGravity();

interface ParticleColor { fill: string; glow: string; highlight?: boolean; }

function getRandomParticleColor(): ParticleColor {
  // Muted dusty blues, teals, subtle yellows, with rare highlight
  let fill: string, glow: string;
  let highlight = false;
  if (Math.random() < 0.02) {
    // Rare highlight particle
    highlight = true;
    fill = 'rgba(255, 165, 0, 0.9)'; // yellow-orange
    glow = 'rgba(255, 165, 0, 0.4)';
  } else {
    const r = Math.random();
    if (r < 0.6) {
      fill = 'rgba(60, 80, 120, 0.6)';   // dusty blue
      glow = 'rgba(60, 80, 120, 0.15)';
    } else if (r < 0.9) {
      fill = 'rgba(80, 100, 100, 0.6)';  // dusty teal
      glow = 'rgba(80, 100, 100, 0.15)';
    } else {
      fill = 'rgba(200, 180, 120, 0.6)'; // subtle yellow
      glow = 'rgba(200, 180, 120, 0.15)';
    }
  }
  return { fill, glow, highlight };
}

// Star color palette for infinite simulation
const starPalette = [
  { fill: 'rgba(255,255,255,1)', weight: 50 },   // Core Bright White
  { fill: 'rgba(72,244,241,0.4)', weight: 20 },  // Cool Cyan Glow
  { fill: 'rgba(14,27,62,0.2)', weight: 10 },    // Dim Blue
  { fill: 'rgba(62,203,243,0.6)', weight: 10 },  // Electric Blue
  { fill: 'rgba(255,216,112,0.5)', weight: 3 },  // Yellow Sparks
  { fill: 'rgba(255,140,66,0.4)', weight: 3 },   // Amber Flare
  { fill: 'rgba(230,92,27,0.3)', weight: 2 },    // Burnt Orange
  { fill: 'rgba(160,160,160,0.3)', weight: 2 },  // Ash Grey
];
function pickStarColor() {
  const total = starPalette.reduce((sum, c) => sum + c.weight, 0);
  let r = Math.random() * total;
  for (const c of starPalette) {
    if (r < c.weight) return c.fill;
    r -= c.weight;
  }
  return starPalette[0].fill;
}

export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameTick, setFrameTick] = useState(0);
  const [highlightedSlope, setHighlightedSlope] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ top: 0, left: 0 });

  // Camera depth and projection constants
  const camZ = useRef(-1000);       // camera starts behind particle plane
  const focalLength = 600;          // focal length for projection
  const camSpeedRef = useRef(0.5);  // initial camera speed (units per frame)
  const camAccel = 0.001;           // small acceleration per frame for gradual ramp-up
  
  // Infinite starfield
  interface Star { x: number; y: number; z: number; radius: number; color: string; }
  const starsRef = useRef<Star[]>([]);
  const starCount = 1000; // increased for denser starfield
  const starDepth = 3000;

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = virtualHeight - (e.clientY - rect.top); // Flip y-coordinate

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
    // Starfield setup
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * virtualWidth,
        y: Math.random() * virtualHeight,
        z: camZ.current + Math.random() * starDepth,
        radius: Math.random() * 2 + 0.5,
        color: pickStarColor(),
      });
    }
    starsRef.current = stars;
    // Initial fission particle
    const color = getRandomParticleColor();
    const particle = new Particle(
      virtualWidth / 2,
      50,
      0,
      0,
      1,
      getRandomRadius()
    );
    particle._fxColor = { fill: color.fill, glow: color.glow };
    particle._phase = Math.random() * Math.PI * 2;
    particle._isHighlight = !!color.highlight;
    world.addParticle(particle);
    draw();
  }, []);


  // Utility to get random radius
  function getRandomRadius() {
    return (
      Math.random() * (PARTICLE_RADIUS_MAX - PARTICLE_RADIUS_MIN) + PARTICLE_RADIUS_MIN
    );
  }

  // Simple noise function for non-uniformity (pseudo-random per particle)
  function pseudoNoise(x: number, y: number) {
    // Use a simple hash for repeatable pseudo-randomness
    return (
      Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
    );
  }

  // Draw all particles and slopes using 3D to 2D projection
  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // reset any transforms, clear frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    // Camera projection setup
    const centerX = virtualWidth / 2;
    const centerY = virtualHeight / 2;
    const dz = 0 - camZ.current; // all particles at z=0 plane
    const safeDZ = Math.max(dz, 0.1); // prevent division by zero
    const baseScale = focalLength / safeDZ;

    // Draw starfield background
    starsRef.current.forEach((star) => {
      const dzStar = star.z - camZ.current;
      const safeDzStar = Math.max(dzStar, 0.1);
      const scale = focalLength / safeDzStar;
      const sx = (star.x - centerX) * scale + centerX;
      const sy = (star.y - centerY) * scale + centerY;
      const r = star.radius * scale;
      ctx.save();
      ctx.globalAlpha = Math.min(1, 1 - dzStar / starDepth);
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw ropes
    world.ropes.forEach((rope) => {
      // project start/end
      const sx = (rope.start.position.x - centerX) * baseScale + centerX;
      const sy = ((virtualHeight - rope.start.position.y) - centerY) * baseScale + centerY;
      const ex = (rope.end.position.x - centerX) * baseScale + centerX;
      const ey = ((virtualHeight - rope.end.position.y) - centerY) * baseScale + centerY;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw slopes
    world.slopes.forEach((slope) => {
      // project slope endpoints
      const sx = (slope.start.x - centerX) * baseScale + centerX;
      const sy = ((virtualHeight - slope.start.y) - centerY) * baseScale + centerY;
      const ex = (slope.end.x - centerX) * baseScale + centerX;
      const ey = ((virtualHeight - slope.end.y) - centerY) * baseScale + centerY;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "#1e1e2f";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw particles
    for (const p of world.particles) {
      const worldX = p.position.x;
      const worldY = virtualHeight - p.position.y;
      const scaleP = baseScale; // since all at z=0
      const screenX = (worldX - centerX) * scaleP + centerX;
      const screenY = (worldY - centerY) * scaleP + centerY;
      const drawR = p.radius * scaleP;
      const color = p._fxColor!;
      const phase = p._phase ?? 0;
      const alphaMod = p._isHighlight ? 0.6 + 0.4 * Math.abs(Math.sin(frameTick * 0.3 + phase)) : 1;

      // Compute flicker for highlight particles
      // organic noise offset scaled to screen
      const noise = pseudoNoise(p.position.x * 0.5, p.position.y * 0.5);
      const offX = (noise - 0.5) * p.radius * 0.07 * scaleP;
      const offY = (noise - 0.5) * p.radius * 0.07 * scaleP;
      const grad = ctx.createRadialGradient(
        screenX + offX,
        screenY + offY,
        drawR * 0.12,
        screenX,
        screenY,
        drawR * 1.45
      );
      grad.addColorStop(0, color.fill);
      grad.addColorStop(0.22, color.fill);
      grad.addColorStop(0.55, color.glow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(screenX, screenY, drawR * 1.4, 0, 2 * Math.PI);
      ctx.globalAlpha = 0.82 * alphaMod;
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Subtle, soft core
      ctx.save();
      ctx.beginPath();
      ctx.arc(screenX, screenY, drawR * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = color.fill;
      ctx.globalAlpha = 0.45 * alphaMod;
      ctx.fill();
      ctx.restore();
    }

    // no canvas transform to restore
  };

  const handleDownload = () => {
    const particleData = world.particles.map((p) => ({
      position: { x: p.position.x, y: p.position.y },
      velocity: { x: p.velocity.x, y: p.velocity.y },
      mass: p.mass,
      appliedForce: { x: p.appliedForce.x, y: p.appliedForce.y },
      isStationary: p.isStationary,
      radius: p.radius,
      _fxColor: p._fxColor,
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
          const color = p._fxColor || getRandomParticleColor();
          const particle = new Particle(
            p.position.x,
            p.position.y,
            p.velocity.x,
            p.velocity.y,
            p.mass,
            p.radius !== undefined ? p.radius : getRandomRadius()
          );
          particle.appliedForce = new Vector2D(p.appliedForce.x, p.appliedForce.y);
          particle.isStationary = p.isStationary;
          particle._fxColor = color;
          particle._phase = Math.random() * Math.PI * 2;
          particle._isHighlight = color.highlight;
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
        world.step(1 / 30);
        // accelerate camera and move forward
        camSpeedRef.current += camAccel;
        camZ.current += camSpeedRef.current;
        // Respawn passed stars
        starsRef.current.forEach((star) => {
          if (star.z <= camZ.current) {
            star.z = camZ.current + starDepth;
            star.x = Math.random() * virtualWidth;
            star.y = Math.random() * virtualHeight;
            star.color = pickStarColor();
          }
        });
        draw();
      }

      // Force re-render to update table
      setFrameTick((tick) => tick + 1);
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  // Spawn particles
  useEffect(() => {
    let count = 0;
    const spawnParticle = () => {
      if (count >= 200) return;

      const vx = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 20) + 1);
      const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 20) + 1);

      let x: number, y: number;
      let radius = getRandomRadius();
      do {
        x = Math.random() * (virtualWidth - 2 * radius) + radius;
        y = Math.random() * (virtualHeight - 2 * radius) + radius;
      } while (
        x >= 700 && x <= 1200 &&
        y >= 600 && y <= 800
      );

      const color = getRandomParticleColor();
      const newParticle = new Particle(x, y, vx, vy, 1, radius);
      newParticle._fxColor = { fill: color.fill, glow: color.glow };
      newParticle._phase = Math.random() * Math.PI * 2;
      newParticle._isHighlight = !!color.highlight;
      world.addParticle(newParticle);
      draw();

      count++;
    };

    // Spawn 6 particles immediately
    for (let i = 0; i < 0; i++) {
      spawnParticle();
    }

  }, []);

  // Resize handler

  interface Props {
    canvasRef: RefObject<HTMLCanvasElement>;
    virtualWidth: number; // 1920
    virtualHeight: number; // 1030
    handleCanvasRightClick: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
  }

  useEffect(() => {
      const updateScale = () => {
        const scaleX = window.innerWidth / virtualWidth;
        const scaleY = window.innerHeight / virtualHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = virtualWidth * scale;
        const scaledHeight = virtualHeight * scale;

        const left = (window.innerWidth - scaledWidth) / 2;
        const top = (window.innerHeight - scaledHeight) / 2;

        setScale(scale);
        setOffset({ top, left });
      };

      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }, [virtualWidth, virtualHeight]);

  return (
  <div
      style={{
        backgroundColor: '#020902',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
    

            <canvas
              ref={canvasRef}
              width={virtualWidth}
              height={virtualHeight}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: virtualWidth,
                height: virtualHeight,
              }}
              onContextMenu={handleCanvasRightClick}
            />
          </div>
      
);
}
