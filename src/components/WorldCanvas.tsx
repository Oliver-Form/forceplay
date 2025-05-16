'use client';

// imports for the project
import React, { useRef, useEffect, useState } from 'react';
import { World } from '../lib/physics/World';
import { Particle } from '../lib/physics/Particle';
import EditableCell from './EditableCell';
import { Vector2D } from '../lib/physics/Vector2D';
import ParticleModal from './ParticleModal';
import { saveAs } from 'file-saver'; // Import file-saver for downloading JSON

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
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [slopeMode, setSlopeMode] = useState(false);
  const [slopePoints, setSlopePoints] = useState<Vector2D[]>([]);
  const [showSlopeModal, setShowSlopeModal] = useState(false);
  const [highlightedSlope, setHighlightedSlope] = useState<number | null>(null);
  const [ropeMode, setRopeMode] = useState(false);
  const [ropePoints, setRopePoints] = useState<Particle[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAttributesTable, setShowAttributesTable] = useState(false);
  const [showCoordinateModal, setShowCoordinateModal] = useState(false);
  const [coordinateInputs, setCoordinateInputs] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });

  const updateForce = (particle: Particle, fx: number, fy: number) => {
    particle.appliedForce.x = fx;
    particle.appliedForce.y = fy;
    draw();
  };

  const handleSlopeButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey) {
      setShowCoordinateModal(true);
    } else {
      setSlopeMode((prev) => !prev);
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
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = canvasHeight - (e.clientY - rect.top); // Flip y-coordinate

    if (ropeMode) {
      const clickedParticle = world.particles.find((p) => {
        const dx = p.position.x - clickX;
        const dy = p.position.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) <= particleRadius;
      });

      if (clickedParticle) {
        setRopePoints((prev) => {
          const updatedPoints = [...prev, clickedParticle];
          if (updatedPoints.length === 2) {
            // Connect the two particles with a red string
            world.addRope(updatedPoints[0], updatedPoints[1]);
            setRopeMode(false);
            setRopePoints([]);
            draw();
          }
          return updatedPoints;
        });
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
    }
  };

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
      ctx.strokeStyle = index === highlightedSlope ? 'yellow' : 'blue';
      ctx.lineWidth = index === highlightedSlope ? 4 : 3; // Increase line width for better visibility
      ctx.stroke();
    });

    // Draw particles
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
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
        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <img
            src="/settings.svg"
            alt="Settings"
            style={{ width: '24px', height: '24px' }}
          />
        </button>
        <button
          onClick={handleDownload}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <img
            src="/download.svg"
            alt="Download"
            style={{ width: '24px', height: '24px' }}
          />
        </button>
        <label
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <img
            src="/upload.svg"
            alt="Upload"
            style={{ width: '24px', height: '24px' }}
          />
          <input
            type="file"
            accept="application/json"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
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
              backgroundColor: 'white',
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
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}>
            <h3>Enter Coordinates</h3>
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
            <button onClick={handleCoordinateModalSave}>Save</button>
            <button onClick={handleCoordinateModalCancel}>Cancel</button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '1px solid black' }}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasRightClick}
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

      {selectedParticle && (
        <ParticleModal
          particle={{
            position: selectedParticle.position,
            velocity: selectedParticle.velocity,
            mass: selectedParticle.mass,
            appliedForce: selectedParticle.appliedForce,
            isStationary: selectedParticle.isStationary, // Ensure isStationary is passed to the modal
          }}
          onSave={(updatedParticle) => {
            selectedParticle.position = new Vector2D(updatedParticle.position.x, updatedParticle.position.y);
            selectedParticle.velocity = new Vector2D(updatedParticle.velocity.x, updatedParticle.velocity.y);
            selectedParticle.mass = updatedParticle.mass;
            selectedParticle.appliedForce = new Vector2D(updatedParticle.appliedForce.x, updatedParticle.appliedForce.y);
            selectedParticle.isStationary = updatedParticle.isStationary;
            setSelectedParticle(null);
            draw();
          }}
          onCancel={() => setSelectedParticle(null)}
        />
      )}
    </div>
  );
}
