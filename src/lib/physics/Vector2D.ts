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
}
// need to pump those numbers up quite a bit. at the moment, i'm 57th, but really, i need to get to top 20 or so.
// I'm on 3h 17m. I want to do minimum 6 hours today. I'm going to make some changes to the homepage, then watch some godfather and just write a little to kill time.