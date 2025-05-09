'use client';

import React, { useRef, useEffect, useState } from 'react';
import { World } from '../lib/physics/World';
import { Particle } from '../lib/physics/Particle';
import EditableCell from './EditableCell';

const canvasWidth = 1900;
const canvasHeight = 800;
const particleRadius = 10;

const world = new World();

export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameTick, setFrameTick] = useState(0);

  // Initial setup
  useEffect(() => {
    const particle = new Particle(canvasWidth / 2, 50, 0, 0, 1);
    world.addParticle(particle);
    draw();
  }, []);

  // Draw all particles
  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const p of world.particles) {
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, particleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    }
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

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '1px solid black' }}
      />
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <table style={{ marginTop: '2rem', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Index</th>
            <th>Position X</th>
            <th>Position Y</th>
            <th>Velocity X</th>
            <th>Velocity Y</th>
            <th>Mass</th>
          </tr>
        </thead>
        <tbody>
          {world.particles.map((p, index) => (
            <tr key={index}>
              <td>{index}</td>

              {/* Position */}
              {['x', 'y'].map((axis) => (
                <EditableCell
                  key={`pos-${axis}-${index}`}
                  value={p.position[axis]}
                  onConfirm={(val) => {
                    p.position[axis] = val;
                    draw();
                  }}
                  setIsPlaying={setIsPlaying}
                />
              ))}

              {/* Velocity */}
              {['x', 'y'].map((axis) => (
                <EditableCell
                  key={`vel-${axis}-${index}`}
                  value={p.velocity[axis]}
                  onConfirm={(val) => {
                    p.velocity[axis] = val;
                    draw();
                  }}
                  setIsPlaying={setIsPlaying}
                />
              ))}

              {/* Mass */}
              <EditableCell
                key={`mass-${index}`}
                value={p.mass}
                onConfirm={(val) => {
                  p.mass = val;
                  draw();
                }}
                setIsPlaying={setIsPlaying}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
