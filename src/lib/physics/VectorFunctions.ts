export class Vector2D {
  public x: number;
  public y: number;
// this class is for a 2d vector
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
// this is the constructor for a 2d vector. 
  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }
// this functions adds 2d vectors together
  scale(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }
// this function multiplies a vector by a scalar
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }
  // modify this vector instead of allocating new one
  addInPlace(v: Vector2D): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  // scale this vector by scalar
  scaleInPlace(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}

