"use client";
import React, { useEffect, useState, useRef } from 'react';

import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Example {
  id: number;
  Name: string;
  Data: any;
}

// Static canvas preview of the simulation data
function CanvasPreview({ data }: { data: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // original canvas size
    const origW = 1900;
    const origH = 700;
    // preview size
    const w = canvas.width;
    const h = canvas.height;
    // compute scale to fit
    const scaleX = w / origW;
    const scaleY = h / origH;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scaleX, scaleY);
    // draw slopes
    data.slopes.forEach((s: any) => {
      ctx.beginPath();
      ctx.moveTo(s.start.x, origH - s.start.y);
      ctx.lineTo(s.end.x, origH - s.end.y);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    // draw ropes
    if (data.ropes) {
      data.ropes.forEach((r: any) => {
        const p1 = data.particles[r.startIndex];
        const p2 = data.particles[r.endIndex];
        ctx.beginPath();
        ctx.moveTo(p1.position.x, origH - p1.position.y);
        ctx.lineTo(p2.position.x, origH - p2.position.y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    // draw particles with golden-angle coloring and glow
    data.particles.forEach((p: any, i: number) => {
      const fy = origH - p.position.y;
      ctx.beginPath();
      ctx.arc(p.position.x, fy, 10, 0, 2 * Math.PI);
      const golden = 137.508;
      const hue = (i * golden) % 360;
      // glow effect
      ctx.save();
      ctx.shadowColor = `hsl(${hue},70%,65%)`;
      ctx.shadowBlur = 50;
      ctx.fillStyle = `hsl(${hue},70%,65%)`;
      ctx.fill();
      ctx.restore();
      // main fill and stroke
      ctx.fillStyle = `hsl(${hue},70%,65%)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(${hue},70%,45%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();
  }, [data]);
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={110}
      style={{ width: '100%', height: 'auto', backgroundColor: '#1E1E2F', borderRadius: '4px' }}
    />
  );
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'flex-start' }}>
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
      {/* Back button fixed in bottom-right */}
      <button
        onClick={() => router.push('/sandbox')}
        style={{ position: 'fixed', bottom: '1rem', right: '1rem', padding: '0.75rem 1.25rem', background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Back to Sandbox
      </button>
    </div>
  );
}

