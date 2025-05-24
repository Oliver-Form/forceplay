'use client';

// imports for the project
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { World } from '../lib/physics/World';
import { Particle } from '../lib/physics/Particle';
import EditableCell from './EditableCell';
import { Vector2D } from '../lib/physics/VectorFunctions';
import { saveAs } from 'file-saver'; // Import file-saver for downloading JSON
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// declare constants
const canvasWidth = 1900;
const canvasHeight = 700;
const particleRadius = 10;

// declare instance of World object
const world = new World();
export { world as worldInstance }; // allow importing live world state

interface WorldCanvasProps { initialData?: any | null; }
export default function WorldCanvas({ initialData }: WorldCanvasProps) {
  const router = useRouter();
  // Scaling logic similar to HomeWorldCanvas
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ top: 0, left: 0 });
  // Load example data into world on initialData change
  useEffect(() => {
    if (initialData) {
      try {
        // Load particles
        world.particles = initialData.particles.map((p: any) => {
          const particle = new Particle(p.position.x, p.position.y, p.velocity.x, p.velocity.y, p.mass);
          particle.appliedForce = new Vector2D(p.appliedForce.x, p.appliedForce.y);
          particle.isStationary = p.isStationary;
          return particle;
        });
        // Load slopes
        world.slopes = initialData.slopes.map((s: any) => ({
          start: new Vector2D(s.start.x, s.start.y),
          end: new Vector2D(s.end.x, s.end.y),
        }));
        // Load ropes
        world.ropes = [];
        if (initialData.ropes) {
          initialData.ropes.forEach((r: any) => {
            const p1 = world.particles[r.startIndex];
            const p2 = world.particles[r.endIndex];
            if (p1 && p2) world.addRope(p1, p2, r.length);
          });
        }
        // Restore settings if present (examples load)
        if (typeof initialData.restitution === 'number') {
          setRestitutionValue(initialData.restitution);
          world.setRestitution(initialData.restitution);
        }
        if (typeof initialData.gravityEnabled === 'boolean') {
          setGravityEnabled(initialData.gravityEnabled);
          world.setGravityEnabled(initialData.gravityEnabled);
        }
        draw();
      } catch (err) {
        console.error('Error loading initial data', err);
      }
    }
  }, [initialData]);
  // Form state for inline particle editing
  const [particleForm, setParticleForm] = useState<{
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
    appliedForce: { x: number; y: number };
    isStationary: boolean;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Content natural dimensions for scaling
  const sidebarWidth = 300;
  const bottomHeight = 100; // approx height of bottom controls
  const contentWidth = sidebarWidth + canvasWidth;
  const contentHeight = canvasHeight + bottomHeight;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameTick, setFrameTick] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [slopeMode, setSlopeMode] = useState(false);
  const [slopePoints, setSlopePoints] = useState<Vector2D[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Vector2D | null>(null);
  const [showSlopeModal, setShowSlopeModal] = useState(false);
  const [highlightedSlope, setHighlightedSlope] = useState<number | null>(null);
  const [ropeMode, setRopeMode] = useState(false);
  const [ropePoints, setRopePoints] = useState<Particle[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [showAttributesTable, setShowAttributesTable] = useState(false);
  const [restitutionValue, setRestitutionValue] = useState(world.restitution);
  const [gravityEnabled, setGravityEnabled] = useState(world.useGravity);
  const [showCoordinateModal, setShowCoordinateModal] = useState(false);
  const [coordinateInputs, setCoordinateInputs] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const [heritageError, setHeritageError] = useState<boolean>(false);
  // Editing data for inline particle attribute form
  const [editingData, setEditingData] = useState<{
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
    appliedForce: { x: number; y: number };
    isStationary: boolean;
  } | null>(null);
  // Circular motion state for rope-connected particles
  const [anchorParticle, setAnchorParticle] = useState<Particle | null>(null);
  const [angularSpeed, setAngularSpeed] = useState<number>(0);

  // Fling drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2D | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2D | null>(null);
  const [dragParticle, setDragParticle] = useState<Particle | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const updateForce = (particle: Particle, fx: number, fy: number) => {
    particle.appliedForce.x = fx;
    particle.appliedForce.y = fy;
    draw();
  };

  const handleSlopeButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey) {
      setShowCoordinateModal(true);
    } else {
      setSlopeMode((prev) => {
        const newMode = !prev;
        if (newMode === false) {
          setSlopePoints([]);
          setPreviewPoint(null);
        }
        return newMode;
      });
      setSlopePoints([]);
      setPreviewPoint(null);
    }
  };

  const handleCoordinateModalSave = () => {
    const { startX, startY, endX, endY } = coordinateInputs;
    const start = new Vector2D(startX, startY);
    const end = new Vector2D(endX, endY);

    world.addSlope(start, end);
    setShowCoordinateModal(false);
    draw();
  };

  const handleCoordinateModalCancel = () => {
    setShowCoordinateModal(false);
  };

  const handleRopeButtonClick = () => {
    setRopeMode((prev) => !prev);
    setRopePoints([]); // Reset rope points when toggling mode
  };

  const handleModalSave = (start: Vector2D, end: Vector2D) => {
    world.addSlope(start, end);
    setShowSlopeModal(false);
    draw();
  };

  const handleModalCancel = () => {
    setShowSlopeModal(false);
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert screen coords to logical canvas coords by accounting for scale
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const clickX = clientX / scale;
    const clickY = canvasHeight - (clientY / scale); // Flip y-coordinate

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

  // Function to handle particle click or slope creation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert screen coords to logical canvas coords by accounting for scale
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const clickX = clientX / scale;
    const clickY = canvasHeight - (clientY / scale); // Flip y-coordinate

    if (ropeMode) {
      const clickedParticle = world.particles.find((p) => {
        const dx = p.position.x - clickX;
        const dy = p.position.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) <= particleRadius;
      });

      if (clickedParticle) {
        if (ropePoints.length === 0) {
          setRopePoints([clickedParticle]);
        } else {
          const p1 = ropePoints[0];
          const p2 = clickedParticle;
          if ((p1.isStationary && !p2.isStationary) || (!p1.isStationary && p2.isStationary)) {
            world.addRope(p1, p2);
          } else {
            alert('Pendulums must connect a stationary and a non-stationary particle');
          }
          setRopeMode(false);
          setRopePoints([]);
          draw();
        }
      }
      return;
    }

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

    if (slopeMode) {
      const newPoint = new Vector2D(clickX, clickY);
      setSlopePoints((prev) => {
        const updatedPoints = [...prev, newPoint];
        if (updatedPoints.length === 2) {
          world.addSlope(updatedPoints[0], updatedPoints[1]);
          setSlopeMode(false);
          setSlopePoints([]);
          setPreviewPoint(null);
          draw();
        }
        return updatedPoints;
      });
      return;
    }

    const clickedParticle = world.particles.find((p) => {
      const dx = p.position.x - clickX;
      const dy = p.position.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= particleRadius;
    });

    if (clickedParticle) {
      setIsPlaying(false); // Pause simulation
      setSelectedParticle(clickedParticle);
      // Initialize inline form with current attributes
      setParticleForm({
        position: { x: clickedParticle.position.x, y: clickedParticle.position.y },
        velocity: { x: clickedParticle.velocity.x, y: clickedParticle.velocity.y },
        mass: clickedParticle.mass,
        appliedForce: { x: clickedParticle.appliedForce.x, y: clickedParticle.appliedForce.y },
        isStationary: clickedParticle.isStationary,
      });
    } else {
      // Clear form when clicking elsewhere
      setSelectedParticle(null);
      setParticleForm(null);
    }
  };

  // Add mouse move handler for slope preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && dragParticle) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const x = clientX / scale;
      const y = canvasHeight - (clientY / scale);
      setDragCurrent(new Vector2D(x, y));
      setHasDragged(true);
      draw();
      return;
    }
    if (!slopeMode || slopePoints.length !== 1) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = clientX / scale;
    const y = canvasHeight - (clientY / scale);
    const point = new Vector2D(x, y);
    setPreviewPoint(point);
    draw();
  };

  // Fling-to-launch mouse handlers
  const handleMouseDownFling = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = clientX / scale;
    const y = canvasHeight - (clientY / scale);
    const clickedParticle = world.particles.find(p => {
      const dx = p.position.x - x;
      const dy = p.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= particleRadius;
    });
    if (clickedParticle && !clickedParticle.isStationary) {
      // Ready to drag this particle
      setIsPlaying(false);
      setDragParticle(clickedParticle);
      setIsDragging(true);
      setDragStart(new Vector2D(clickedParticle.position.x, clickedParticle.position.y));
      setDragCurrent(new Vector2D(clickedParticle.position.x, clickedParticle.position.y));
      setHasDragged(false);
    }
  };

  const handleMouseUpFling = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging && dragParticle && dragStart && dragCurrent) {
      // Compute drag vector
      const dx = dragCurrent.x - dragStart.x;
      const dy = dragCurrent.y - dragStart.y;
      const forceScale = 5;
      // Apply scaled impulse for noticeable launch
      dragParticle.velocity.x = dx * forceScale;
      dragParticle.velocity.y = dy * forceScale;
      world.step(1/30);
      draw();
      setIsPlaying(true);
    }
    // Reset drag state
    setIsDragging(false);
    setDragParticle(null);
    setDragStart(null);
    setDragCurrent(null);
    setHasDragged(false);
  };

  // Draw all particles and slopes (memoized)
  const draw = useCallback(() => {
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
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3; // Increase line width for better visibility
      ctx.stroke();
    });
    // Draw rubber-band preview when placing a slope
    if (slopeMode && slopePoints.length === 1 && previewPoint) {
      const start = slopePoints[0];
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(start.x, canvasHeight - start.y);
      ctx.lineTo(previewPoint.x, canvasHeight - previewPoint.y);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Draw particles
    for (let i = 0, len = world.particles.length; i < len; i++) {
      const p = world.particles[i];
      const flippedY = canvasHeight - p.position.y;

      ctx.beginPath();
      ctx.arc(p.position.x, flippedY, particleRadius, 0, 2 * Math.PI);
      ctx.save();
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 50;
      ctx.fillStyle = 'cyan';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'cyan';
      ctx.fill();
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the label without expensive indexOf
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '');
      ctx.fillText(label, p.position.x, flippedY);
    }

    // Draw fling preview line
    if (isDragging && dragParticle && dragCurrent) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dragParticle.position.x, canvasHeight - dragParticle.position.y);
      ctx.lineTo(dragCurrent.x, canvasHeight - dragCurrent.y);
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }, [canvasRef, slopeMode, slopePoints, previewPoint, isDragging, dragParticle, dragCurrent]);

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
    const ropeData = world.ropes.map((r) => ({
      startIndex: world.particles.indexOf(r.start),
      endIndex: world.particles.indexOf(r.end),
      length: r.length,
    }));
    const data = { particles: particleData, slopes: slopeData, ropes: ropeData, restitution: restitutionValue, gravityEnabled };
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

        // Convert slope records into Vector2D objects
        world.slopes = data.slopes.map((s: any) => {
          return {
            start: new Vector2D(s.start.x, s.start.y),
            end:   new Vector2D(s.end.x,   s.end.y),
          };
        });
        // Load rope connections if present
        world.ropes = [];
        if (data.ropes) {
          data.ropes.forEach((r: any) => {
            const p1 = world.particles[r.startIndex];
            const p2 = world.particles[r.endIndex];
            if (p1 && p2) world.addRope(p1, p2, r.length);
          });
        }
        // Restore settings if present (backward-compatible)
        if (typeof data.restitution === 'number') {
          setRestitutionValue(data.restitution);
          world.setRestitution(data.restitution);
        }
        if (typeof data.gravityEnabled === 'boolean') {
          setGravityEnabled(data.gravityEnabled);
          world.setGravityEnabled(data.gravityEnabled);
        }
        draw();
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  };

  // History for inversion playback
  type Snapshot = {
    particles: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      mass: number;
      appliedForce: { x: number; y: number };
      isStationary: boolean;
    }[];
    slopes: { start: Vector2D; end: Vector2D }[];
    ropes: { start: Particle; end: Particle }[];
  };

  const historyRef = useRef<Snapshot[]>([]);
  const MAX_HISTORY = 1000;

  // Animation loop
  useEffect(() => {
    let animationFrame: number;

    const loop = () => {
      if (isPlaying) {
        if (isInverted) {
          // Play backwards using history
          if (historyRef.current.length > 0) {
            const snap = historyRef.current.pop()!;
            // Restore particle states
            world.particles.forEach((p, i) => {
              const data = snap.particles[i];
              p.position.x = data.position.x;
              p.position.y = data.position.y;
              p.velocity.x = data.velocity.x;
              p.velocity.y = data.velocity.y;
              p.appliedForce.x = data.appliedForce.x;
              p.appliedForce.y = data.appliedForce.y;
              p.mass = data.mass;
              p.isStationary = data.isStationary;
            });
            // Restore slopes
            world.slopes = snap.slopes.map(s => ({ start: new Vector2D(s.start.x, s.start.y), end: new Vector2D(s.end.x, s.end.y) }));
          }
        } else {
          // Record current state for potential inversion
          const snap: Snapshot = {
            particles: world.particles.map(p => ({
              position: { x: p.position.x, y: p.position.y },
              velocity: { x: p.velocity.x, y: p.velocity.y },
              mass: p.mass,
              appliedForce: { x: p.appliedForce.x, y: p.appliedForce.y },
              isStationary: p.isStationary,
            })),
            slopes: world.slopes.map(s => ({ start: s.start, end: s.end })),
            ropes: world.ropes.map(r => ({ start: r.start, end: r.end })),
          };
          historyRef.current.push(snap);
          if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
          world.step(1 / 30); // faster sim
        }
        draw();
        // Only trigger React re-render if attributes table is visible
        if (showAttributesTable) {
          setFrameTick((tick) => tick + 1);
        }
      }

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, showAttributesTable]);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / contentWidth;
      const scaleY = window.innerHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = contentWidth * scale;
      // const scaledHeight = contentHeight * scale; // no longer needed for top calculation

      const left = (window.innerWidth - scaledWidth) / 2;
      const top = 0;

      setScale(scale);
      setOffset({ top, left });
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [contentWidth, contentHeight]);
  // Redraw canvas when page visibility changes or window gains focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        draw();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', draw);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', draw);
    };
  }, []);

  // Sync selectedParticle to editingData and compute circular motion state
  useEffect(() => {
    if (selectedParticle) {
      // inline edit form data
      setEditingData({
        position: { x: selectedParticle.position.x, y: selectedParticle.position.y },
        velocity: { x: selectedParticle.velocity.x, y: selectedParticle.velocity.y },
        mass: selectedParticle.mass,
        appliedForce: { x: selectedParticle.appliedForce.x, y: selectedParticle.appliedForce.y },
        isStationary: selectedParticle.isStationary,
      });
      // compute circular motion if tethered
      const rope = world.ropes.find(r =>
        (r.start === selectedParticle && r.end.isStationary) ||
        (r.end === selectedParticle && r.start.isStationary)
      );
      if (rope) {
        const stationary = rope.start.isStationary ? rope.start : rope.end;
        const mobile = stationary === rope.start ? rope.end : rope.start;
        const dx = mobile.position.x - stationary.position.x;
        const dy = mobile.position.y - stationary.position.y;
        const r2 = dx*dx + dy*dy || 1;
        const omega = (dx * mobile.velocity.y - dy * mobile.velocity.x) / r2;
        setAnchorParticle(stationary);
        setAngularSpeed(omega);
      } else {
        setAnchorParticle(null);
        setAngularSpeed(0);
      }
    } else {
      setEditingData(null);
      setAnchorParticle(null);
      setAngularSpeed(0);
    }
  }, [selectedParticle]);

  // Save current world as example
  const handleSaveExample = async () => {
    const name = prompt('Enter a name for this example:');
    if (!name) return;
    // build data object
    const particleData = world.particles.map(p => ({ position: { x: p.position.x, y: p.position.y }, velocity: { x: p.velocity.x, y: p.velocity.y }, mass: p.mass, appliedForce: { x: p.appliedForce.x, y: p.appliedForce.y }, isStationary: p.isStationary }));
    const slopeData = world.slopes.map(s => ({ start: { x: s.start.x, y: s.start.y }, end: { x: s.end.x, y: s.end.y } }));
    const ropeData = world.ropes.map(r => ({
      startIndex: world.particles.indexOf(r.start),
      endIndex: world.particles.indexOf(r.end),
      length: r.length,
    }));
    const data = { particles: particleData, slopes: slopeData, ropes: ropeData, restitution: restitutionValue, gravityEnabled };
    const { error } = await supabase.from('examples').insert({ Name: name, Data: data });
    if (error) alert('Save failed: ' + error.message);
    else alert('Example saved successfully!');
  };

  return (
    <div
      ref={containerRef}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: offset.top,
        left: offset.left,
        width: contentWidth,
        height: '100vh',
      }}
    >
      {/* Content area: sidebar and canvas */}
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Side panel with two resizable boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', width: sidebarWidth, padding: '8px', boxSizing: 'border-box', height: '100vh', position: 'sticky', top: 0 }}>
          <div style={{ flex: 1, backgroundColor: '#2D2D3F', marginBottom: '8px', resize: 'vertical', overflow: 'auto', minHeight: 0, color: '#fff', padding: '8px' }}>
            {editingData ? (
              <div>
                <h3>
                  Edit Particle{' '}
                  {(() => {
                    const idx = world.particles.indexOf(selectedParticle!);
                    const letter = String.fromCharCode(65 + (idx % 26));
                    const suffix = idx >= 26 ? Math.floor(idx / 26) : '';
                    return `${letter}${suffix}`;
                  })()}
                </h3>
                {/* Position X */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Position X:
                    <input type="number" defaultValue={editingData.position.x} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, position: { ...editingData.position, x: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.position.x = editingData.position.x; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save X" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Position Y */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Position Y:
                    <input type="number" defaultValue={editingData.position.y} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, position: { ...editingData.position, y: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.position.y = editingData.position.y; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save Y" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Velocity X */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Velocity X:
                    <input type="number" defaultValue={editingData.velocity.x} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, velocity: { ...editingData.velocity, x: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.velocity.x = editingData.velocity.x; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save VX" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Velocity Y */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Velocity Y:
                    <input type="number" defaultValue={editingData.velocity.y} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, velocity: { ...editingData.velocity, y: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.velocity.y = editingData.velocity.y; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save VY" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Mass */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Mass:
                    <input type="number" defaultValue={editingData.mass} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, mass: isNaN(v) ? 0 : v });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.mass = editingData.mass; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save Mass" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Force X */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Force X:
                    <input type="number" defaultValue={editingData.appliedForce.x} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, appliedForce: { ...editingData.appliedForce, x: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.appliedForce.x = editingData.appliedForce.x; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save Fx" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Force Y */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Force Y:
                    <input type="number" defaultValue={editingData.appliedForce.y} onBlur={e => {
                      const v = parseFloat(e.target.value);
                      setEditingData({ ...editingData, appliedForce: { ...editingData.appliedForce, y: isNaN(v) ? 0 : v } });
                    }} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.appliedForce.y = editingData.appliedForce.y; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save Fy" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                {/* Stationary */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ flex: 1 }}>Stationary:
                    <input type="checkbox" checked={editingData.isStationary} onChange={e => setEditingData({ ...editingData, isStationary: e.target.checked })} />
                  </label>
                  <button type="button" onClick={() => { if (selectedParticle && editingData) { selectedParticle.isStationary = editingData.isStationary; draw(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src="/check-mark.svg" alt="Save Stationary" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
                <button type="button" onClick={() => setSelectedParticle(null)} style={{ marginTop: '8px' }}>Close</button>
              </div>
             ) : (
               <p>Select a particle to edit</p>
             )}
          </div>
          <div style={{ flex: 1, backgroundColor: '#2D2D3F', resize: 'vertical', overflow: 'auto', minHeight: 0 }}>
            {/* Box 2: circular motion controls or guidance */}
            {selectedParticle ? (
              anchorParticle ? (
                <div style={{ padding: '8px', color: '#fff' }}>
                  <h3>Circular Motion</h3>
                  <label>
                    Angular Speed:
                    <input
                      type="number"
                      value={angularSpeed}
                      step="0.01"
                      onChange={(e) => {
                        const o = parseFloat(e.target.value);
                        if (!isNaN(o) && anchorParticle) {
                          setAngularSpeed(o);
                          const dx = selectedParticle.position.x - anchorParticle.position.x;
                          const dy = selectedParticle.position.y - anchorParticle.position.y;
                          selectedParticle.velocity.x = -o * dy;
                          selectedParticle.velocity.y = o * dx;
                          draw();
                        }
                      }}
                      style={{ marginLeft: '8px', width: '80px' }}
                    />
                  </label>
                </div>
              ) : (
                <div style={{ padding: '8px', color: '#fff' }}>
                  <p>Select a rope-connected particle to adjust circular motion.</p>
                </div>
              )
            ) : (
              <div style={{ padding: '8px', color: '#fff' }}>
                <p>Select a particle to see circular motion controls.</p>
              </div>
            )}
          </div>
        </div>
        {/* Main canvas and upper controls panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#1E1E2F', padding: '8px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button
                  onClick={handleSlopeButtonClick}
                  style={{
                    backgroundColor: slopeMode ? 'lightblue' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <img
                    src="/slope.svg"
                    alt="Add Slope"
                    style={{ width: '24px', height: '24px' }}
                  />
                </button>
                <button
                  onClick={handleRopeButtonClick}
                  style={{
                    backgroundColor: ropeMode ? 'lightcoral' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <img
                    src="/rope.svg"
                    alt="Add Rope"
                    style={{ width: '24px', height: '24px' }}
                  />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setShowSettingsModal(true)} style={{ cursor: 'pointer', padding: '4px 8px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  Settings
                </button>
                <button onClick={handleDownload} style={{ cursor: 'pointer', padding: '4px 8px', background: '#888', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  Download JSON
                </button>
                <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#666', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  Upload JSON
                  <input type="file" accept="application/json" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={() => router.push('/examples')} style={{ cursor: 'pointer', padding: '4px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  View Gallery
                </button>
                <button onClick={handleSaveExample} style={{ cursor: 'pointer', padding: '4px 8px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  Save to Gallery
                </button>
              </div>
            </div>
          </div>

          {showSettingsModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#888',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <h3>Settings</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={showAttributesTable}
                    onChange={(e) => setShowAttributesTable(e.target.checked)}
                  />
                  Show Attributes Table
                </label>
                <br />
                <button onClick={() => setIsInverted(prev => !prev)} style={{ marginTop: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                  Inversion: {isInverted ? 'On' : 'Off'}
                </button>
                <br />
                <label>
                  Restitution ({restitutionValue.toFixed(2)}):
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={restitutionValue}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setRestitutionValue(v);
                      world.setRestitution(v);
                      draw();
                    }}
                  />
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={gravityEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setGravityEnabled(enabled);
                      world.setGravityEnabled(enabled);
                      draw();
                    }}
                  />
                  Enable Gravity
                </label>
                <br />
                <button onClick={() => setShowSettingsModal(false)}>Close</button>
              </div>
            </div>
          )}

          {showCoordinateModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{
                backgroundColor: '#888',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}>
                <h3>Enter Coordinates</h3>
                {/*allow user to enter -0 so they can type in negatives*/}
                <label>
                  Start X: <input type="number" value={coordinateInputs.startX} onChange={(e) => setCoordinateInputs({ ...coordinateInputs, startX: parseFloat(e.target.value) })} />
                </label>
                <br />
                <label>
                  Start Y: <input type="number" value={coordinateInputs.startY} onChange={(e) => setCoordinateInputs({ ...coordinateInputs, startY: parseFloat(e.target.value) })} />
                </label>
                <br />
                <label>
                  End X: <input type="number" value={coordinateInputs.endX} onChange={(e) => setCoordinateInputs({ ...coordinateInputs, endX: parseFloat(e.target.value) })} />
                </label>
                <br />
                <label>
                  End Y: <input type="number" value={coordinateInputs.endY} onChange={(e) => setCoordinateInputs({ ...coordinateInputs, endY: parseFloat(e.target.value) })} />
                </label>
                <br />
                <button onClick={handleCoordinateModalSave}>Save </button>
                <button onClick={handleCoordinateModalCancel}> Cancel</button>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseLeave={handleMouseUpFling}
            style={{ border: '1px solid #F0F0F0' }}
            onMouseDown={handleMouseDownFling}
            onMouseUp={handleMouseUpFling}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          />

          {/* usage instructions */}
          <div
            className="flexbox-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
              margin: '8px auto',
              width: canvasWidth,
            }}
          >
            <button onClick={() => setIsPlaying(!isPlaying)}>
              <img
                src={isPlaying ? '/pause.svg' : '/play-button.svg'}
                alt={isPlaying ? 'Pause' : 'Play'}
                style={{ width: '24px', height: '24px' }}
              />
            </button>
            <p>N for new particle</p>
            <p>Space to play/pause</p>
            <p>Click on particle to edit its attributes</p>
          </div>
        </div>
      </div>
      {/* Bottom controls and tables: play button, attributes table, selectedModal */}
      <div style={{ padding: '8px' }}>
        {showAttributesTable && (
          <table style={{ marginTop: '2rem', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Position X</th>
                <th>Position Y</th>
                <th>Velocity X</th>
                <th>Velocity Y</th>
                <th>Mass</th>
                <th>Fx</th>
                <th>Fy</th>
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

                  {/* Force X */}
                  <EditableCell
                    key={`fx-${index}`}
                    value={p.appliedForce.x}
                    onConfirm={(val) => {
                      updateForce(p, val, p.appliedForce.y);
                    }}
                    setIsPlaying={setIsPlaying}
                  />

                  {/* Force Y */}
                  <EditableCell
                    key={`fy-${index}`}
                    value={p.appliedForce.y}
                    onConfirm={(val) => {
                      updateForce(p, p.appliedForce.x, val);
                    }}
                    setIsPlaying={setIsPlaying}
                  />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '8px' }}>
                  <button
                    onClick={() => {
                      const newParticle = new Particle(canvasWidth / 2, canvasHeight / 2, 0, 0, 1);
                      world.addParticle(newParticle);
                      draw();
                    }}
                    style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '16px' }}
                  >
                    + Add Particle (n)
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

