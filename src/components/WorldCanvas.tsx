'use client';

// imports for the project
import React, { useRef, useEffect, useState } from 'react';
import { World } from '../lib/physics/World';
import { Particle } from '../lib/physics/Particle';
import EditableCell from './EditableCell';
import { Vector2D } from '../lib/physics/Vector2D';

// declare constants
const canvasWidth = 1900;
const canvasHeight = 700;
const particleRadius = 10;


// declare instance of World object
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPlaying((prev) => !prev); // Toggle play/pause
        e.preventDefault(); // Prevent default scrolling behavior
      } else if (e.key.toLowerCase() === 'n') {
        const newParticle = new Particle(canvasWidth / 2, canvasHeight / 2, 0, 0, 1);
        world.addParticle(newParticle);
        draw();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Draw all particles
  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const p of world.particles) {
      const flippedY = canvasHeight - p.position.y; // Flip y-coordinate to fix coordinates system.

      ctx.beginPath();
      ctx.arc(p.position.x, flippedY, particleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'white'; // Set circle color to white
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the label
      ctx.fillStyle = 'black'; // Set text color to black
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const index = world.particles.indexOf(p);
      const label = String.fromCharCode(65 + (index % 26)) + (index >= 26 ? Math.floor(index / 26) : '');
      ctx.fillText(label, p.position.x, flippedY);
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
            <img
            src={isPlaying ? '/pause.svg' : '/play-button.svg'}
            alt={isPlaying ? 'Pause' : 'Play'}
            style={{ width: '24px', height: '24px' }}
            />
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
              <td>
                {String.fromCharCode(65 + (index % 26)) + (index >= 26 ? Math.floor(index / 26) : '')}
                <button
                  onClick={() => {
                  world.particles.splice(index, 1); // Remove the particle at the given index
                  draw();
                  }}
                  style={{ marginLeft: '8px', cursor: 'pointer', padding: '2px 6px', fontSize: '12px' }}
                >
                  <img
                  src="/delete-button.svg"
                  alt="Delete"
                  style={{ width: '16px', height: '16px' }}
                  />
                </button>
              </td>

              {/* Position */}
              <EditableCell
                key={`pos-x-${index}`}
                value={p.position.x}
                onConfirm={(val) => {
                  p.position.x = val;
                  draw();
                }}
                setIsPlaying={setIsPlaying}
              />
              <EditableCell
                key={`pos-y-${index}`}
                value={p.position.y} // Display y-coordinate as is
                onConfirm={(val) => {
                  p.position.y = val; // Update y-coordinate directly
                  draw();
                }}
                setIsPlaying={setIsPlaying}
              />

              {/* Velocity */}
              <EditableCell
                key={`vel-x-${index}`}
                value={p.velocity.x}
                onConfirm={(val) => {
                  p.velocity.x = val;
                  draw();
                }}
                setIsPlaying={setIsPlaying}
              />
              <EditableCell
                key={`vel-y-${index}`}
                value={p.velocity.y}
                onConfirm={(val) => {
                  p.velocity.y = val;
                  draw();
                }}
                setIsPlaying={setIsPlaying}
              />

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
        <tfoot>
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: '8px' }}>
              <button
                onClick={() => {
                  const newParticle = new Particle(canvasWidth / 2, canvasHeight / 2, 0, 0, 1);
                  world.addParticle(newParticle);
                  draw();
                }}
                style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '16px' }}
              >
                + Add Particle
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
