import { Vector2D } from './VectorFunctions';

export class Particle {
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  forces: Vector2D[] = [];
  appliedForce: Vector2D = new Vector2D(0, 0);
  isStationary: boolean = false;
  initialEnergy: number | null = null;
  _fxColor?: { fill: string; glow: string };
  _phase?: number;
  _isHighlight?: boolean;
  _z?: number; // Simulated depth for deep-field effect
  _trail?: Array<{ x: number; y: number }>;
  radius: number;

  constructor(x: number, y: number, vx = 0, vy = 0, mass = 1, radius = 10) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(vx, vy);
    this.mass = mass;
    this.radius = radius;
    this.initialEnergy = 0.5 * mass * (vx ** 2 + vy ** 2) + mass * 9.8 * y; // Initialize total energy
  }

  applyForce(force: Vector2D) {
    this.forces.push(force);
  }

  private calculateKineticEnergy(): number {
    return 0.5 * this.mass * this.velocity.magnitudeSquared();
  }

  private calculatePotentialEnergy(gravity: number): number {
    return this.mass * gravity * this.position.y;
  }

  correctEnergy(gravity: number, tolerance: number = 0.05) {
    if (this.initialEnergy === null) return;

    const currentKineticEnergy = this.calculateKineticEnergy();
    const currentPotentialEnergy = this.calculatePotentialEnergy(gravity);
    const currentTotalEnergy = currentKineticEnergy + currentPotentialEnergy;

    if (Math.abs(currentTotalEnergy - this.initialEnergy) / this.initialEnergy < tolerance) {
      const scale = Math.sqrt(this.initialEnergy / currentTotalEnergy);
      this.velocity = this.velocity.scale(scale);
    }
  }

  update(dt: number) {
    if (this.isStationary) {
      // Keep static particles unaffected
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.forces.length = 0;
      return;
    }
    // Sum all forces and appliedForce in locals
    let fx = this.appliedForce.x;
    let fy = this.appliedForce.y;
    for (const f of this.forces) {
      fx += f.x;
      fy += f.y;
    }
    // clear applied accumulation
    this.forces.length = 0;
    // acceleration components
    const invM = 1 / this.mass;
    const ax = fx * invM;
    const ay = fy * invM;
    // integrate velocity and position
    this.velocity.x += ax * dt;
    this.velocity.y += ay * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    // energy correction if needed
    this.correctEnergy(9.8);
  }
}