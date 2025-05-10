import { Particle } from './Particle';

export class StringConstraint {
  p1: Particle;
  p2: Particle;
  length: number;

  constructor(p1: Particle, p2: Particle, length: number) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
  }
}
