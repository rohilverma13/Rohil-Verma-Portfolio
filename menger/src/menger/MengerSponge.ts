import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";

/* A potential interface that students should implement */
interface IMengerSponge {
  setLevel(level: number): void;
  isDirty(): boolean;
  setClean(): void;
  normalsFlat(): Float32Array;
  indicesFlat(): Uint32Array;
  positionsFlat(): Float32Array;
}

/**
 * Represents a Menger Sponge
 */
export class MengerSponge implements IMengerSponge {

  // TODO: sponge data structures
  nesting_level;
  dirty;
  cube_vertex = new Float32Array([
    // Front Face
    0.5, 0.5, -0.5, 1.0,    // 0
    -0.5, 0.5, -0.5, 1.0,   // 1
    0.5, -0.5, -0.5, 1.0,   // 2
    -0.5, -0.5, -0.5, 1.0,  // 3
      
    // Back Face
    0.5, 0.5, 0.5, 1.0,     // 4
    -0.5, 0.5, 0.5, 1.0,    // 5
    0.5, -0.5, 0.5, 1.0,    // 6
    -0.5, -0.5, 0.5, 1.0,   // 7

    // Left Face
    0.5, 0.5, 0.5, 1.0,     // 8
    0.5, 0.5, -0.5, 1.0,    // 9
    0.5, -0.5, 0.5, 1.0,    // 10
    0.5, -0.5, -0.5, 1.0,   // 11

    // Right Face
    -0.5, 0.5, 0.5, 1.0,    // 12
    -0.5, 0.5, -0.5, 1.0,   // 13
    -0.5, -0.5, 0.5, 1.0,   // 14
    -0.5, -0.5, -0.5, 1.0,  // 15

    // Top Face
    0.5, 0.5, 0.5, 1.0,     // 16
    -0.5, 0.5, 0.5, 1.0,    // 17
    0.5, 0.5, -0.5, 1.0,    // 18
    -0.5, 0.5, -0.5, 1.0,   // 19

    // Bottom Face
    0.5, -0.5, -0.5, 1.0,   // 20
    -0.5, -0.5, -0.5, 1.0,  // 21
    0.5, -0.5, 0.5, 1.0,    // 22
    -0.5, -0.5, 0.5, 1.0    // 23
    ]);
  
  cube_index = new Uint32Array([
    // Front Face
    0, 2, 1, 1, 2, 3,
      
    // Back Face
    4, 5, 7, 4, 7, 6,

    // Left Face
    8, 10, 9, 9, 10, 11,

    // Right Face
    12, 13, 15, 12, 15, 14,

    // Top Face
    17, 16, 18, 17, 18, 19,

    // Bottom Face
    21, 20, 22, 21, 22, 23
    ]);

  cube_norms = new Float32Array([
    // Front Face
    0.0, 0.0, -1.0, 0.0, 
    0.0, 0.0, -1.0, 0.0, 
    0.0, 0.0, -1.0, 0.0,
    0.0, 0.0, -1.0, 0.0,

    // Back Face
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 1.0, 0.0,

    // Left Face
    1.0, 0.0, 0.0, 0.0, 
    1.0, 0.0, 0.0, 0.0, 
    1.0, 0.0, 0.0, 0.0,
    1.0, 0.0, 0.0, 0.0,

    // Right Face
    -1.0, 0.0, 0.0, 0.0, 
    -1.0, 0.0, 0.0, 0.0, 
    -1.0, 0.0, 0.0, 0.0,
    -1.0, 0.0, 0.0, 0.0,

    // Top Face
    0.0, 1.0, 0.0, 0.0, 
    0.0, 1.0, 0.0, 0.0, 
    0.0, 1.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,

    // Bottom Face
    0.0, -1.0, 0.0, 0.0, 
    0.0, -1.0, 0.0, 0.0, 
    0.0, -1.0, 0.0, 0.0,
    0.0, -1.0, 0.0, 0.0
    ]);


  vertex;
  index;
  norms;
  
  constructor(level: number) {
	  this.setLevel(level);
	  // TODO: other initialization	
  }

  public generateVertex(minX, minY, minZ, length): [number[], number[]]{
    let allVerts = new Array();
    let verts = new Array();
    let norms = new Array();

    allVerts.push([minX, minY, minZ, 1.0])
    allVerts.push([minX, minY + length, minZ, 1.0])
    allVerts.push([minX + length, minY + length, minZ, 1.0])
    allVerts.push([minX + length, minY, minZ, 1.0])
    allVerts.push([minX, minY, minZ + length, 1.0])
    allVerts.push([minX, minY + length, minZ + length, 1.0])
    allVerts.push([minX + length, minY + length, minZ + length, 1.0])
    allVerts.push([minX + length, minY, minZ + length, 1.0])

    // Front Face
    verts = verts.concat(allVerts[0]);
    verts = verts.concat(allVerts[1]);
    verts = verts.concat(allVerts[2]);
    verts = verts.concat(allVerts[0]);
    verts = verts.concat(allVerts[2]);
    verts = verts.concat(allVerts[3]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([0.0, 0.0, -1.0, 0.0])
    }

    // Back Face
    verts = verts.concat(allVerts[4]);
    verts = verts.concat(allVerts[6]);
    verts = verts.concat(allVerts[5]);
    verts = verts.concat(allVerts[4]);
    verts = verts.concat(allVerts[7]);
    verts = verts.concat(allVerts[6]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([0.0, 0.0, 1.0, 0.0])
    }

    // Left Face 
    verts = verts.concat(allVerts[7]);
    verts = verts.concat(allVerts[2]);
    verts = verts.concat(allVerts[6]);
    verts = verts.concat(allVerts[7]);
    verts = verts.concat(allVerts[3]);
    verts = verts.concat(allVerts[2]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([1.0, 0.0, 0.0, 0.0])
    }

    // Right Face 
    verts = verts.concat(allVerts[0]);
    verts = verts.concat(allVerts[5]);
    verts = verts.concat(allVerts[1]);
    verts = verts.concat(allVerts[0]);
    verts = verts.concat(allVerts[4]);
    verts = verts.concat(allVerts[5]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([-1.0, 0.0, 0.0, 0.0])
    }

    // Top Face 
    verts = verts.concat(allVerts[2]);
    verts = verts.concat(allVerts[5]);
    verts = verts.concat(allVerts[6]);
    verts = verts.concat(allVerts[2]);
    verts = verts.concat(allVerts[1]);
    verts = verts.concat(allVerts[5]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([0.0, 1.0, 0.0, 0.0])
    }

    // Bot Face 
    verts = verts.concat(allVerts[7]);
    verts = verts.concat(allVerts[0]);
    verts = verts.concat(allVerts[3]);
    verts = verts.concat(allVerts[7]);
    verts = verts.concat(allVerts[4]);
    verts = verts.concat(allVerts[0]);
    for (var i = 0; i < 6; i++) {
      norms = norms.concat([0.0, -1.0, 0.0, 0.0])
    }

    // console.log("verts " + verts.toString());

    return [verts, norms];
  }

  public recursiveCube(minX, minY, minZ, maxX, level): [number[], number[]]{
    let newVerts = new Array();
    let newNorms = new Array();
    let interval = (maxX - minX) / 3.0;

    // console.log("HERE: " + minX + " " + minY + " " + minZ);

    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        for (let c = 0; c < 3; c++) {
          if ((a % 2 + b % 2 + c % 2) < 2) {
            if (level > 0) {
              let newMinX = minX + a * interval;
              let newMinY = minY + b * interval;
              let newMinZ = minZ + c * interval;
              let results = this.recursiveCube(newMinX, newMinY, newMinZ, newMinX + interval, level - 1);
              newVerts = newVerts.concat(results[0]);
              newNorms = newNorms.concat(results[1]);
            }
            else {
              let results = this.generateVertex(minX, minY, minZ, maxX - minX);
              newVerts = newVerts.concat(results[0]);
              newNorms = newNorms.concat(results[1]);
            }
          }
        }
      }
    }


    return [newVerts, newNorms];
  }

  /**
   * Returns true if the sponge has changed.
   */
  public isDirty(): boolean {
    return this.dirty;
  }

  public setClean(): void {
    this.dirty = false;
  }
  
  public setLevel(level: number)
  {
	  // TODO: initialize the cube
    this.nesting_level = level - 1;
    this.dirty = true;

    if (this.nesting_level == 0) {
      this.vertex = this.cube_vertex;
      this.index = this.cube_index;
      this.norms = this.cube_norms;
    }
    else {
      let results = this.recursiveCube(-0.5, -0.5, -0.5, 0.5, this.nesting_level);

      let num = results[0].length;
      console.log("Vertex Array Length = " + num);

      this.vertex = new Float32Array(results[0]);
      this.index = new Uint32Array(Array.from(this.vertex.keys()));
      this.norms = new Float32Array(results[1]);
    }
  }

  /* Returns a flat Float32Array of the sponge's vertex positions */
  public positionsFlat(): Float32Array {
	  // TODO: right now this makes a single triangle. Make the cube fractal instead.
    return this.vertex;
    // return this.cube_vertex;
  }

  /**
   * Returns a flat Uint32Array of the sponge's face indices
   */
  public indicesFlat(): Uint32Array {
    // TODO: right now this makes a single triangle. Make the cube fractal instead.
    return this.index;
    // return this.cube_index;
  }

  /**
   * Returns a flat Float32Array of the sponge's normals
   */
  public normalsFlat(): Float32Array {
	  // TODO: right now this makes a single triangle. Make the cube fractal instead.
    return this.norms;
    // return this.cube_norms;
  }

  /**
   * Returns the model matrix of the sponge
   */
  public uMatrix(): Mat4 {

    // TODO: change this, if it's useful
    const ret : Mat4 = new Mat4().setIdentity();

    return ret;    
  }
  
}
