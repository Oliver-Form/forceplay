"use client";
import React, { useEffect, useState, useRef } from 'react';
import { World } from '../../lib/physics/World';
import { Particle } from '../../lib/physics/Particle';
import { Vector2D } from '../../lib/physics/Vector2D';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Example {
  id: number;
  Name: string;
  Data: any;
}

// Animated canvas preview of the simulation
function CanvasPreview({ data }: { data: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const animRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    // initialize world
    const world = new World();
    world.particles = data.particles.map((p: any) => {
      const part = new Particle(p.position.x, p.position.y, p.velocity.x, p.velocity.y, p.mass);
      part.appliedForce = new Vector2D(p.appliedForce.x, p.appliedForce.y);
      part.isStationary = p.isStationary;
      return part;
    });
    world.slopes = data.slopes.map((s: any) => ({ start: new Vector2D(s.start.x, s.start.y), end: new Vector2D(s.end.x, s.end.y) }));
    world.ropes = [];
    if (data.ropes) {
      data.ropes.forEach((r: any) => {
        const p1 = world.particles[r.startIndex];
        const p2 = world.particles[r.endIndex];
        if (p1 && p2) world.addRope(p1, p2);
      });
    }
    worldRef.current = world;
    // draw and step loop
    function draw() {
      if (!ctx || !worldRef.current) return;
      ctx.clearRect(0, 0, w, h);
      // slopes
      worldRef.current.slopes.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s.start.x, h - s.start.y);
        ctx.lineTo(s.end.x, h - s.end.y);
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.stroke();
      });
      // ropes
      worldRef.current.ropes.forEach(r => {
        ctx.beginPath();
        ctx.moveTo(r.start.position.x, h - r.start.position.y);
        ctx.lineTo(r.end.position.x, h - r.end.position.y);
        ctx.strokeStyle = 'red'; ctx.lineWidth = 1; ctx.stroke();
      });
      // particles
      worldRef.current.particles.forEach(p => {
        const fy = h - p.position.y;
        ctx.beginPath();
        ctx.arc(p.position.x, fy, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'cyan'; ctx.fill();
        ctx.strokeStyle = 'cyan'; ctx.lineWidth = 1; ctx.stroke();
      });
    }
    function stepLoop() {
      if (worldRef.current) worldRef.current.step(1 / 30);
      draw();
      animRef.current = requestAnimationFrame(stepLoop);
    }
    // start animation
    draw();
    animRef.current = requestAnimationFrame(stepLoop);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [data]);
  return <canvas ref={canvasRef} width={320} height={200} style={{ width: '100%', backgroundColor: '#1E1E2F', borderRadius: '4px' }} />;
}

export default function ExamplesPage() {
  const router = useRouter();
  const [examples, setExamples] = useState<Example[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('examples')
        .select('id, Name, Data');
      if (data) setExamples(data);
    }
    load();
  }, []);

  const handleLoad = (ex: Example) => {
    localStorage.setItem('forceplayExample', JSON.stringify(ex.Data));
    router.push('/sandbox');
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1>Examples</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between' }}>
        {examples.map((ex) => (
          <div key={ex.id} style={{
            border: '1px solid #444',
            padding: '16px',
            background: '#2D2D3F',
            color: '#fff',
            borderRadius: '4px',
            flex: '1 0 calc((100% - 48px) / 3)',
            maxWidth: 'calc((100% - 48px) / 3)',
            boxSizing: 'border-box'
          }}>
            <h3>{ex.Name}</h3>
            <CanvasPreview data={ex.Data} />
            <button onClick={() => handleLoad(ex)} style={{ marginTop: '8px', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#4caf50', color: '#fff' }}>
              Load into Sandbox
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
