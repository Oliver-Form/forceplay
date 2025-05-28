'use client';

// imports for the project
import React, { useRef, useEffect, useState, RefObject } from 'react';
import { World } from '../lib/physics/WorldVisualiser';
import { Particle } from '../lib/physics/Particle';
import { Vector2D } from '../lib/physics/VectorFunctions';

import { saveAs } from 'file-saver'; // Import file-saver for downloading JSON

// @ts-ignore: no types for jsmediatags
import jsmediatags from 'jsmediatags';
// @ts-ignore no types for color-thief-browser
import ColorThief from 'color-thief-browser';
// @ts-ignore: no types for music-tempo
import MusicTempo from 'music-tempo';

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  className?: string;
}

// declare constants
const virtualWidth = 1920;
const virtualHeight = 1030;
const particleRadius = 10;
// upper limit for active particles

// declare instance of World object
const world = new World();

export default function WorldCanvas() {
  // refs for audio element and playback stats
  const [beatInterval, setBeatInterval] = useState<number|null>(null);
  const lastBeatRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  // update currentTime via animation frame
  useEffect(() => {
    let rafId: number;
    const update = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      rafId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // color palette from album art (bars, particles, fling)
  const [palette, setPalette] = useState<string[]>(['#00ffff', '#00ffff', '#ffff00']);
  const [frameTick, setFrameTick] = useState(0);
  const [highlightedSlope, setHighlightedSlope] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ top: 0, left: 0 });

  // Add refs and state for audio analysis
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  // refs for file-based audio playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  // drag & fling state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2D | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2D | null>(null);
  const [dragParticle, setDragParticle] = useState<Particle | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  // remember original static slopes count
  const staticSlopesCount = useRef(world.slopes.length);
  const prevAmpRef = useRef<number>(0);

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
    // Press 'n' to spawn a new particle at the top centre
    if (e.key.toLowerCase() === 'n') {
      const newParticle = new Particle(virtualWidth / 2, virtualHeight, 0, 0, 1);
      world.addParticle(newParticle);
      draw();
      return;
    }
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

  // Draw all particles and slopes
  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // clear canvas
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    let freqData: Uint8Array | null = null;
    if (audioEnabled && analyserRef.current && freqDataRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
      freqData = freqDataRef.current;
    }
    // draw mirrored bars if freqData exists
    if (freqData) {
      const barCount = 64;
      const half = barCount / 2;
      const barWidth = virtualWidth / barCount;
      const centerX = virtualWidth / 2;
      for (let i = 0; i < half; i++) {
        // compute amplitude and height for this bar
        const start = Math.floor(i * freqData.length / half);
        const end = Math.floor((i + 1) * freqData.length / half);
        let sum = 0;
        for (let j = start; j < end; j++) sum += freqData[j];
        const amplitude = sum / (end - start);
        const height = (amplitude / 255) * virtualHeight;
        // pick palette color based on bar index
        const colorIndex = Math.floor(i * palette.length / half);
        ctx.fillStyle = palette[colorIndex] || '#00ffff';
        const xLeft = centerX - (i + 1) * barWidth;
        const xRight = centerX + i * barWidth;
        ctx.fillRect(xLeft, virtualHeight - height, barWidth - 2, height);
        ctx.fillRect(xRight, virtualHeight - height, barWidth - 2, height);
      }
    }

    // Draw ropes
    world.ropes.forEach((rope) => {
      ctx.beginPath();
      ctx.moveTo(rope.start.position.x, virtualHeight - rope.start.position.y);
      ctx.lineTo(rope.end.position.x, virtualHeight - rope.end.position.y);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw slopes
    world.slopes.forEach((slope, index) => {
      ctx.beginPath();
      ctx.moveTo(slope.start.x, virtualHeight - slope.start.y);
      ctx.lineTo(slope.end.x, virtualHeight - slope.end.y);
      ctx.strokeStyle = "#1e1e2f";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw particles
    for (const p of world.particles) {
      const flippedY = virtualHeight - p.position.y; // Flip y-coordinate to fix coordinates system.

      ctx.beginPath();
      ctx.arc(p.position.x, flippedY, particleRadius, 0, 2 * Math.PI);
      // Neon glow effect
      ctx.save();
      ctx.shadowColor = palette[0] || '#00ffff';
      ctx.shadowBlur = 50;
      ctx.fillStyle = palette[0] || '#00ffff';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = palette[0] || '#00ffff'; // Set circle color to cyan (main fill)
      ctx.fill();
      ctx.strokeStyle = palette[1] || palette[0] || '#00ffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // fling preview
      if (isDragging && dragParticle && dragCurrent) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(dragParticle.position.x, virtualHeight - dragParticle.position.y);
        ctx.lineTo(dragCurrent.x, virtualHeight - dragCurrent.y);
        ctx.strokeStyle = palette[2] || '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5,5]);
        ctx.stroke();
        ctx.restore();
      }
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
        // beat-synced spawning
        if (audioEnabled && beatInterval && audioRef.current) {
          const now = audioRef.current.currentTime;
          if (now - lastBeatRef.current >= beatInterval) {
            lastBeatRef.current = now;
            const count = 1;  // one particle per beat now
            const centerX = virtualWidth/2, centerY = virtualHeight/2;
            for (let i = 0; i < count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 15 * (0.5 + Math.random());
              const p = new Particle(centerX, centerY, Math.cos(angle)*speed, Math.sin(angle)*speed, 1, Math.random()*6+4);
              p.lifetime = 1 + Math.random()*2;
              world.addParticle(p);
            }
          }
        }
        // manual bar collisions for audio bars (improves performance vs slopes)
        const bars: Array<{ x: number; width: number; height: number }> = [];
        if (audioEnabled && analyserRef.current && freqDataRef.current) {
          const freqData = freqDataRef.current;
          const barCount = 64;
          const half = barCount / 2;
          const barWidth = virtualWidth / barCount;
          const centerX = virtualWidth / 2;
          for (let i = 0; i < half; i++) {
            const startIdx = Math.floor(i * freqData.length / half);
            const endIdx = Math.floor((i + 1) * freqData.length / half);
            let sum = 0;
            for (let j = startIdx; j < endIdx; j++) sum += freqData[j];
            const amplitude = sum / (endIdx - startIdx);
            const height = (amplitude / 255) * virtualHeight;
            const xLeft = centerX - (i + 1) * barWidth;
            bars.push({ x: xLeft, width: barWidth, height });
            const xRight = centerX + i * barWidth;
            bars.push({ x: xRight, width: barWidth, height });
          }
        }

        // fixed sub-steps for collision accuracy
        const dt = 1 / 30;
        const subSteps = 5;
        const subDt = dt / subSteps;
        for (let i = 0; i < subSteps; i++) {
          world.step(subDt);
        }
        // resolve bar collisions after physics
        for (const p of world.particles) {
          for (const bar of bars) {
            if (p.position.x >= bar.x && p.position.x <= bar.x + bar.width) {
              const penetration = (bar.height + particleRadius) - p.position.y;
              if (penetration > 0) {
                // lift particle above bar
                p.position.y += penetration;
                // reflect vertical velocity
                if (p.velocity.y < 0) {
                  p.velocity.y = -p.velocity.y * world.restitution;
                }
              }
            }
          }
        }
        // remove expired particles
        world.particles = world.particles.filter(p => p.age < p.lifetime);
        // remove particles off the left/right walls
        world.particles = world.particles.filter(p => p.position.x >= -p.radius && p.position.x <= virtualWidth + p.radius);
        draw();
      }

      // Force re-render to update table
      setFrameTick((tick) => tick + 1);
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audioEnabled, palette, beatInterval]); // <-- added beatInterval here

  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        window.location.href = '/sandbox';
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, []);

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


  // Handler to load user-selected audio file and setup analyser
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // decode audio for BPM detection
    const arrayBuffer = await file.arrayBuffer();
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    const signal = audioBuffer.getChannelData(0);
    const mt = new MusicTempo(signal, { timeStep: 1 / audioBuffer.sampleRate });
    console.log(`Detected BPM: ${mt.tempo}`);
    // use the detected inter-beat interval in seconds
    setBeatInterval(mt.beatInterval);

    const url = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onloadedmetadata = () => setDuration(audioRef.current!.duration);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaElementSource(audioRef.current);
      // Create analyser node for visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // Connect source directly to analyser and output
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

       analyserRef.current = analyser;
       freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      audioRef.current.play();
      setIsPlaying(true);
      setAudioEnabled(true);
      lastBeatRef.current = audioRef.current.currentTime;   // <-- reset beat timer for new song
    }
    // existing ID3 + color-thief handling...
    jsmediatags.read(file, {
      onSuccess: async (tag: any) => {
        const title = tag.tags.title || '';
        const artist = tag.tags.artist || '';
        const query = encodeURIComponent(`${artist} ${title}`);
        try {
          // step 3: get access_token from our server
          const tokRes = await fetch('/api/spotify-token');
          const { access_token } = await tokRes.json();
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
           const data = await res.json();
           const art = data.tracks?.items[0]?.album?.images[0]?.url;
           console.log('Album art URL:', art);
           if (art) {
             const img = new Image();
             img.crossOrigin = 'anonymous';
             img.src = art;
             img.onload = () => {
               const ct = new ColorThief();
               const cols = ct.getPalette(img, 3)
                 .map((rgb: number[]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
               if (cols.length) {
                 setPalette(cols);
                 draw();  // <-- immediately redraw with new palette
               }
             };
           }
         } catch {}
      },
      onError: (_: any) => {}
    });
  };
  // handle play/pause toggle
  const togglePlay = () => {
    // Only toggle if audio element exists and a source is loaded
    if (!audioRef.current || !audioEnabled) return;
    try {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(!audioRef.current.paused);
    } catch {
      // suppress errors when no media resource is available
    }
  };

  // mouse handlers for drag/fling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / scale;
    const y = virtualHeight - (e.clientY - rect.top) / scale;
    const hit = world.particles.find(p => Math.hypot(p.position.x - x, p.position.y - y) <= particleRadius);
    if (hit && !hit.isStationary) {
      setIsDragging(true);
      setDragStart(new Vector2D(hit.position.x, hit.position.y));
      setDragCurrent(new Vector2D(hit.position.x, hit.position.y));
      setDragParticle(hit);
      setHasDragged(false);
      setIsPlaying(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragParticle) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / scale;
    const y = virtualHeight - (e.clientY - rect.top) / scale;
    setDragCurrent(new Vector2D(x, y));
    setHasDragged(true);
    draw();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && dragParticle && dragStart && dragCurrent && hasDragged) {
      const dx = dragCurrent.x - dragStart.x;
      const dy = dragCurrent.y - dragStart.y;
      dragParticle.velocity.x = dx * 5;
      dragParticle.velocity.y = dy * 5;
      world.step(1/30);
      draw();
      setIsPlaying(true);
    }
    setIsDragging(false);
    setDragParticle(null);
    setDragStart(null);
    setDragCurrent(null);
    setHasDragged(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      {/* Persistent controls overlay */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', padding: '6px 10px', borderRadius: 4 }}>
        <button onClick={togglePlay} style={{ color: '#fff' }}>{isPlaying ? 'Pause' : 'Play'}</button>
        <input type="file" accept="audio/*" onChange={handleAudioFileUpload} />
        <progress value={currentTime} max={duration} style={{ width: 160 }} />
        <span style={{ color: '#fff' }}>{Math.floor(currentTime)}/{Math.floor(duration)}s</span>
      </div>

    <div
      style={{
        backgroundColor: '#1E1E2F',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: virtualWidth,
          height: virtualHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: offset.top,
          left: offset.left,
        }}
      >
        <canvas
           ref={canvasRef}
           width={virtualWidth}
           height={virtualHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
    </div>
  </div>
);
}

