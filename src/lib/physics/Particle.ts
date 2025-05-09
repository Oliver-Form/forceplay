import { Vector2D } from './Vector2D';

export class Particle {
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  forces: Vector2D[] = [];

  constructor(x: number, y: number, vx = 0, vy = 0, mass = 1) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(vx, vy);
    this.mass = mass;
  }

  applyForce(force: Vector2D) {
    this.forces.push(force);
  }

  update(dt: number) {
    const netForce = this.forces.reduce(
      (acc, f) => acc.add(f),
      new Vector2D(0, 0)
    );
    const acceleration = netForce.scale(1 / this.mass);
    this.velocity = this.velocity.add(acceleration.scale(dt));
    this.position = this.position.add(this.velocity.scale(dt));
    this.forces = [];
  }
}
