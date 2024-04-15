/**
 * A simple library for 2D vectors.
 *
 * @file vector.js
 * @module
 * @author HSstudent16 (alias Wogglebug)
 * @license MIT
 * @version 1.0.0
 */


export const Vector = (root => {

  root = root ?? self;

  class Vector {
    /**
     * Create a new 2D Vector
     *
     * @param {number?} x
     * @param {number?} y
     */
    constructor(x, y) {
      this.x = +x;
      this.y = +y;
    }

    /**
     * Add two vectors
     *
     * @param {Vector} a
     * @param {Vector} b
     * @param {Vector?} c Optional destination Vector
     *
     * @returns {Vector}
     */
    static add(a, b, c) {
      c = c ?? new Vector();
      c.x = a.x + b.x;
      c.y = a.y + b.y;
      return c;
    }

    /**
     * Subtract two vectors
     *
     * @param {Vector} a
     * @param {Vector} b
     * @param {Vector?} c Optional destination Vector
     *
     * @returns {Vector}
     */
    static sub(a, b, c) {
      c = c ?? new Vector();
      c.x = a.x - b.x;
      c.y = a.y - b.y;
      return c;
    }

    /**
     * Multiply two vectors, or a vector and scalar;
     * If two vectors are given, their respective components are multiplied.
     *
     * @param {Vector} a
     * @param {Vector|number} b A Vector or scalar (number)
     * @param {Vector?} c Optional destination Vector
     *
     * @returns {Vector}
     */
    static mult(a, b, c) {
      c = c ?? new Vector();
      if (b instanceof Vector) {
        c.x = a.x * b.x;
        c.y = a.y * b.y;
      } else {
        c.x = a.x * b;
        c.y = a.y * b;
      }
      return c;
    }

    /**
     * Divide two vectors, or a vector and a scalar;
     * If two vectors are given, their respective components are divided.
     *
     * @param {Vector} a
     * @param {Vector|number} b A Vector or scalar (number)
     * @param {Vector?} c Optional destination Vector
     *
     * @returns {Vector}
     */
    static div(a, b, c) {
      c = c ?? new Vector();
      if (b instanceof Vector) {
        c.x = a.x / b.x;
        c.y = a.y / b.y;
      } else {
        c.x = a.x / b;
        c.y = a.y / b;
      }
      return c;
    }

    /**
     * Find the dot product of two vectors
     *
     * @param {Vector} a
     * @param {Vector} b
     *
     * @returns {number}
     */
    static dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }

    /**
     * Find the magnitude (length) of a vector
     *
     * @param {Vector} a
     *
     * @returns {number}
     */
    static mag(a) {
      return Math.sqrt(a.x ** 2 + a.y ** 2);
    }

    /**
     * Find the squared magnitude of a vector;
     * This may be preferred over `Vector.mag()` for performance.
     *
     * @param {Vector} a
     *
     * @returns {number}
     */
    static sqMag(a) {
      return a.x ** 2 + a.y ** 2;
    }

    /**
     * Project vector "b" onto vector "a"
     *
     * @param {Vector} a The original vector; the result will have the same direction as this vector.
     * @param {Vector} b The vector to be projected
     * @param {Vector?} c Optional destination Vector
     *
     * @returns {Vector}
     */
    static project(a, b, c) {
      let scalar = Vector.dot(a, b) / Vector.sqMag(a);

      c = c ?? new Vector();

      c.x = a.x * scalar;
      c.y = a.y * scalar;

      return c;
    }

    /**
     * Take the cross product of two vectors;
     * Since these are 2D vectors, it is assumed that the "z" component is
     * zero, and the magnitude is returned.
     *
     * @param {Vector} a
     * @param {Vector} b
     *
     * @returns {number}
     */
    static cross(a, b) {
      return a.x * b.y - b.x * a.y;
    }

    /**
     * Sets the components of a vector to either another vector's components, given numbers, or 0
     *
     * @param {Vector|number?} a
     * @param {number?} b
     */
    set(a, b) {
      if (a instanceof Vector) {
        this.x = a.x;
        this.y = a.y;
      } else {
        this.x = a ?? 0;
        this.y = b ?? this.x;
      }
    }
  }

  // Create instance methods that call the static methods
  for (let i of ["add", "sub", "div", "mult", "dot", "mag", "sqMag", "project", "cross"]) {
    let f = Vector[i];
    if (f) {
      Vector.prototype[i] = function (b, c) {
        return f(this, b, c ?? this);
      };
    }
  }

  // Export the Vector class!
  return root.Vector = Vector;

})(this);