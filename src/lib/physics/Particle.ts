import { Vector2D } from './Vector2D';

export class Particle {
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  forces: Vector2D[] = [];
  appliedForce: Vector2D = new Vector2D(0, 0);
  isStationary: boolean = false;

  constructor(x: number, y: number, vx = 0, vy = 0, mass = 1) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(vx, vy);
    this.mass = mass;
  }

  applyForce(force: Vector2D) {
    this.forces.push(force);
  }

  update(dt: number) {
    console.log(`Updating particle: isStationary=${this.isStationary}, position=${this.position}, velocity=${this.velocity}`);
    if (this.isStationary) {
      // Ensure stationary particles remain completely static
      this.position = this.position; // Explicitly prevent position changes
      this.velocity = new Vector2D(0, 0); // Reset velocity to zero
      this.forces = []; // Clear forces to avoid accumulation
      return;
    }

    const netForce = this.forces.reduce(
      (acc, f) => acc.add(f),
      new Vector2D(0, 0)
    ).add(this.appliedForce); // Include appliedForce in net force
    console.log(`Net force applied: ${netForce}`);

    const acceleration = netForce.scale(1 / this.mass);
    console.log(`Acceleration calculated: ${acceleration}`);

    this.velocity = this.velocity.add(acceleration.scale(dt));
    console.log(`Updated velocity: ${this.velocity}`);

    this.position = this.position.add(this.velocity.scale(dt));
    console.log(`Updated position: ${this.position}`);

    this.forces = []; // Clear forces after each update
    console.log('Forces cleared after update');
  }
}
