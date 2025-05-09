type Particle = {
  id: number;
  x: number;
  y: number;
  radius: number; // Fixed radius for all particles
};

export class ParticleSet {
  private particles: Map<number, Particle>;
  private nextId: number;
  private readonly radius: number; // Uniform radius for all particles

  constructor(radius: number = 20) {
    this.particles = new Map();
    this.nextId = 0;
    this.radius = radius;
  }

  // Add a new particle and return its ID
  addParticle(x: number, y: number): number {
    const id = this.nextId++;
    this.particles.set(id, { id, x, y, radius: this.radius });
    return id;
  }

  // Remove a particle by ID
  removeParticle(id: number): boolean {
    return this.particles.delete(id);
  }

  // Get a particle by ID
  getParticle(id: number): Particle | undefined {
    return this.particles.get(id);
  }

  // Update a particle's position
  updatePosition(id: number, x: number, y: number): boolean {
    const particle = this.particles.get(id);
    if (!particle) return false;
    particle.x = x;
    particle.y = y;
    return true;
  }

  // Get all particles as an array
  getAllParticles(): Particle[] {
    return Array.from(this.particles.values());
  }
}
