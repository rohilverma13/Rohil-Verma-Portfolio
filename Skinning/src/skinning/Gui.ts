import { Camera } from "../lib/webglutils/Camera.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { SkinningAnimation } from "./App.js";
import { Mat4, Mat3, Vec3, Vec4, Vec2, Mat2, Quat } from "../lib/TSM.js";
import { Bone } from "./Scene.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Ray } from "../lib/threejs/src/Three.js";

/**
 * Might be useful for designing any animation GUI
 */
interface IGUI {
  viewMatrix(): Mat4;
  projMatrix(): Mat4;
  dragStart(me: MouseEvent): void;
  drag(me: MouseEvent): void;
  dragEnd(me: MouseEvent): void;
  onKeydown(ke: KeyboardEvent): void;
}

export enum Mode {
  playback,  
  edit  
}

	
/**
 * Handles Mouse and Button events along with
 * the the camera.
 */

export class GUI implements IGUI {
  private static readonly rotationSpeed: number = 0.05;
  private static readonly zoomSpeed: number = 0.1;
  private static readonly rollSpeed: number = 0.1;
  private static readonly panSpeed: number = 0.1;

  private camera: Camera;
  private dragging: boolean;
  private fps: boolean;
  private prevX: number;
  private prevY: number;

  private height: number;
  private viewPortHeight: number;
  private width: number;

  private animation: SkinningAnimation;

  private selectedBone: number;
  private boneDragging: boolean;

  public time: number;
  public mode: Mode;

  public hoverX: number = 0;
  public hoverY: number = 0;

  public verts: number[] = [];
  public indices: number[] = [];
  public highlightDirty: boolean = false

  public highlightBoneIndex: number = NaN;
  public highlighted: boolean = false


  /**
   *
   * @param canvas required to get the width and height of the canvas
   * @param animation required as a back pointer for some of the controls
   * @param sponge required for some of the controls
   */
  constructor(canvas: HTMLCanvasElement, animation: SkinningAnimation) {
    this.height = canvas.height;
    this.viewPortHeight = this.height - 200;
    this.width = canvas.width;
    this.prevX = 0;
    this.prevY = 0;
    
    this.animation = animation;
    
    this.reset();
    
    this.registerEventListeners(canvas);
  }

  public getNumKeyFrames(): number {
    //TODO: Fix for the status bar in the GUI
    return 0;
  }
  
  public getTime(): number { 
  	return this.time; 
  }
  
  public getMaxTime(): number { 
    //TODO: The animation should stop after the last keyframe
    return 0;
  }

  /**
   * Resets the state of the GUI
   */
  public reset(): void {
    this.fps = false;
    this.dragging = false;
    this.time = 0;
	this.mode = Mode.edit;
    
    this.camera = new Camera(
      new Vec3([0, 0, -6]),
      new Vec3([0, 0, 0]),
      new Vec3([0, 1, 0]),
      45,
      this.width / this.viewPortHeight,
      0.1,
      1000.0
    );
  }

  /**
   * Sets the GUI's camera to the given camera
   * @param cam a new camera
   */
  public setCamera(
    pos: Vec3,
    target: Vec3,
    upDir: Vec3,
    fov: number,
    aspect: number,
    zNear: number,
    zFar: number
  ) {
    this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
  }

  /**
   * Returns the view matrix of the camera
   */
  public viewMatrix(): Mat4 {
    return this.camera.viewMatrix();
  }

  /**
   * Returns the projection matrix of the camera
   */
  public projMatrix(): Mat4 {
    return this.camera.projMatrix();
  }

  /**
   * Callback function for the start of a drag event.
   * @param mouse
   */
  public dragStart(mouse: MouseEvent): void {
    if (mouse.offsetY > 600) {
      // outside the main panel
      return;
    }
	
    // TODO: Add logic to rotate the bones, instead of moving the camera, if there is a currently highlighted bone   
    this.dragging = true;
    this.prevX = mouse.screenX;
    this.prevY = mouse.screenY;
  }

  public incrementTime(dT: number): void {
    if (this.mode === Mode.playback) {
      this.time += dT;
      if (this.time >= this.getMaxTime()) {
        this.time = 0;
        this.mode = Mode.edit;
      }
    }
  }
  

  /**
   * The callback function for a drag event.
   * This event happens after dragStart and
   * before dragEnd.
   * @param mouse
   */
  public drag(mouse: MouseEvent): void {
    let x = mouse.offsetX;
    let y = mouse.offsetY;
    if (this.dragging) {
      const dx = mouse.screenX - this.prevX;
      const dy = mouse.screenY - this.prevY;
      this.prevX = mouse.screenX;
      this.prevY = mouse.screenY;

      /* Left button, or primary button */
      const mouseDir: Vec3 = this.camera.right();
      mouseDir.scale(-dx);
      mouseDir.add(this.camera.up().scale(dy));
      mouseDir.normalize();

      if (dx === 0 && dy === 0) {
        return;
      }

      switch (mouse.buttons) {
        case 1: {
          if (this.highlighted) {
            let bone = this.animation.getScene().meshes[0].bones[this.highlightBoneIndex];
            let rotAxis: Vec3 = Vec3.cross(this.camera.forward(), mouseDir);
            rotAxis = rotAxis.normalize();

            let rotQuat = Quat.fromAxisAngle(rotAxis, -GUI.rotationSpeed).normalize();
            this.rotateBone(bone, rotQuat);

            break;
          }
          else {
            let rotAxis: Vec3 = Vec3.cross(this.camera.forward(), mouseDir);
            rotAxis = rotAxis.normalize();

            if (this.fps) {
              this.camera.rotate(rotAxis, GUI.rotationSpeed);
            } else {
              this.camera.orbitTarget(rotAxis, GUI.rotationSpeed);
            }
            break;
          }
        }
        case 2: {
          /* Right button, or secondary button */
          this.camera.offsetDist(Math.sign(mouseDir.y) * GUI.zoomSpeed);
          break;
        }
        default: {
          break;
        }
      }
    } 
    // TODO: Add logic here:
    // 1) To highlight a bone, if the mouse is hovering over a bone;
    // 2) To rotate a bone, if the mouse button is pressed and currently highlighting a bone.
    this.highlightDirty = false

    // Unproject into world space
    let rayDirection = this.screenToWorld(mouse.offsetX, mouse.offsetY)
    let rayOrigin = this.camera.pos().copy()
    

    let mesh = this.animation.getScene().meshes[0]

    let translations = mesh.getBoneTranslations()
    let rotations = mesh.getBoneRotations()
    const intersections: number[] = []
    let bones = mesh.bones
    for (let i = 0; i < bones.length; i++){
      let bone = bones[i]
      let length = Vec3.distance(bone.endpoint, bone.position)
      
      let transformMatrix = this.gettnb(bone).inverse()

      let directionInLocal = transformMatrix.copy().multiplyVec3(rayDirection)
      let originInLocal = transformMatrix.copy().multiplyVec3(rayOrigin.copy().subtract(bone.position))
      
     

      let intersection = this.rayCylinderIntersection(originInLocal, directionInLocal, 0.1, length)
      

      intersections.push(intersection)

     

    }
    let minIndex = NaN
    let minT = Number.MAX_SAFE_INTEGER
    for (let i = 0; i < intersections.length; i++){
      if(!Number.isNaN(intersections[i])){
        if(intersections[i] <= minT){
          this.highlightDirty = true
          minT = intersections[i]
          minIndex = i
        }
      }
    }

    if(!Number.isNaN(this.highlightBoneIndex)){
      if(Number.isNaN(minIndex)){
        this.highlightDirty = true
      }
    } else {
      if(!Number.isNaN(minIndex)){
        this.highlightDirty = true
      }
    }
    
    this.highlightBoneIndex = minIndex
    if(Number.isNaN(minIndex)){
      this.highlighted = false
    } else {
      this.highlighted = true
    }
  }

  public screenToWorld(x: number, y: number): Vec3 {
    let ndcX = 2 * x / this.width - 1
    let ndcY = 1 - (2 *y / this.viewPortHeight)
    let ndc = new Vec4([ndcX, ndcY, -1, 1])
    let projInverse = this.projMatrix().copy().inverse()
    let unproject = projInverse.multiplyVec4(ndc)
    unproject.w = 0
    let viewInv = this.viewMatrix().copy().inverse()
    let dir = viewInv.multiplyVec4(unproject)
    let rayDirection = new Vec3([dir.x, dir.y, dir.z])
    return rayDirection
  }

  public rotateBone(bone: Bone, rotQuat: Quat): void {
    bone.rotation = Quat.product(rotQuat, bone.rotation);
    let originalEnd = bone.endpoint.copy()
    let end = bone.endpoint.copy();
    let relativeEnd = Vec3.difference(end, bone.position);
    let endQuat = new Quat([relativeEnd.x, relativeEnd.y, relativeEnd.z, 0.0]);
    let endCalc = Quat.product(Quat.product(rotQuat, endQuat), rotQuat.copy().conjugate());
    bone.endpoint.x = endCalc.x + bone.position.x;
    bone.endpoint.y = endCalc.y + bone.position.y;
    bone.endpoint.z = endCalc.z + bone.position.z;
    let difference = Vec3.difference(bone.endpoint, end);
    for (let child = 0; child < bone.children.length; child++) {
      let childIndex = bone.children[child];
      let childBone = this.animation.getScene().meshes[0].bones[childIndex];
      this.moveChild(childBone, difference, rotQuat, originalEnd.copy());
    }
  }

  public rotateWithQuat(quat: Quat, vec: Vec3): Vec3 {
    const vecQuat = new Quat([vec.x, vec.y, vec.z, 0.0]);
    const resultQuat = Quat.product(Quat.product(quat, vecQuat), quat.copy().conjugate());
    return new Vec3([resultQuat.x, resultQuat.y, resultQuat.z]);
  }

  public moveChild(bone: Bone, translation: Vec3, rotQuat: Quat, parentEnd: Vec3): void {
    
    let rotatedPosition = this.rotateWithQuat(rotQuat, Vec3.difference(bone.position, parentEnd)).add(parentEnd.copy());
    let rotatedEndpoint = this.rotateWithQuat(rotQuat, Vec3.difference(bone.endpoint, parentEnd)).add(parentEnd.copy());

    let originalEnd = bone.endpoint.copy()
  
    bone.position = rotatedPosition.add(translation);
    bone.endpoint = rotatedEndpoint.add(translation);
  
    bone.rotation = Quat.product(rotQuat, bone.rotation);
  
    for (let child = 0; child < bone.children.length; child++) {
      let childIndex = bone.children[child];
      let childBone = this.animation.getScene().meshes[0].bones[childIndex];
      this.moveChild(childBone, translation, rotQuat, parentEnd.copy());
    }
  }




  rayCylinderIntersection(rayOrigin: Vec3, rayDirection: Vec3, radius: number, height: number): number {
    // Normalize the ray direction
    const normalizedRayDirection = rayDirection.copy().normalize()
  
    const a = normalizedRayDirection.x * normalizedRayDirection.x + normalizedRayDirection.z * normalizedRayDirection.z;
    const b = 2 * (rayOrigin.x * normalizedRayDirection.x + rayOrigin.z * normalizedRayDirection.z);
    const c = rayOrigin.x * rayOrigin.x + rayOrigin.z * rayOrigin.z - radius * radius;
  
    const discriminant = b * b - 4 * a * c;
  
    if (discriminant < 0) {
      return NaN;
    }
  
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  
    const y1 = rayOrigin.y + t1 * normalizedRayDirection.y;
    const y2 = rayOrigin.y + t2 * normalizedRayDirection.y;
  
    let tMin = Number.MAX_VALUE;
  
    if (y1 >= 0 && y1 <= height) {
      tMin = Math.min(tMin, t1);
    }
  
    if (y2 >= 0 && y2 <= height) {
      tMin = Math.min(tMin, t2);
    }
  
    if (tMin === Number.MAX_VALUE) {
      return NaN;
    }
  
    return tMin;
  }



  public gettnb(bone: Bone): Mat3 {

    let start = bone.position.copy()
    let end = bone.endpoint.copy()
    
    const axis = end.copy().subtract(start);
   
    const t = axis.normalize();
    
    const worldY = new Vec3([0, 1, 0]);
    const dotProduct = Vec3.dot(t, worldY)
  
    const arbitrary = Math.abs(dotProduct) < 0.999 ? worldY : new Vec3([1, 0, 0]);
  
    const n = Vec3.cross(t, arbitrary).normalize()
  
    const b = Vec3.cross(t, n).normalize()
    
  
    // Construct a 3x3 rotation matrix
    const matrix = new Mat3([
      n.x, n.y, n.z,
      t.x, t.y, t.z,
      b.x, b.y, b.z]
    );
  
    return matrix;
  }

 

 
  public getModeString(): string {
    switch (this.mode) {
      case Mode.edit: { return "edit: " + this.getNumKeyFrames() + " keyframes"; }
      case Mode.playback: { return "playback: " + this.getTime().toFixed(2) + " / " + this.getMaxTime().toFixed(2); }
    }
  }
  
  /**
   * Callback function for the end of a drag event
   * @param mouse
   */
  public dragEnd(mouse: MouseEvent): void {
    this.dragging = false;
    this.prevX = 0;
    this.prevY = 0;
	
    // TODO: Handle ending highlight/dragging logic as needed
  
  }

  /**
   * Callback function for a key press event
   * @param key
   */
  public onKeydown(key: KeyboardEvent): void {
    switch (key.code) {
      case "Digit1": {
        this.animation.setScene("./static/assets/skinning/split_cube.dae");
        break;
      }
      case "Digit2": {
        this.animation.setScene("./static/assets/skinning/long_cubes.dae");
        break;
      }
      case "Digit3": {
        this.animation.setScene("./static/assets/skinning/simple_art.dae");
        break;
      }      
      case "Digit4": {
        this.animation.setScene("./static/assets/skinning/mapped_cube.dae");
        break;
      }
      case "Digit5": {
        this.animation.setScene("./static/assets/skinning/robot.dae");
        break;
      }
      case "Digit6": {
        this.animation.setScene("./static/assets/skinning/head.dae");
        break;
      }
      case "Digit7": {
        this.animation.setScene("./static/assets/skinning/wolf.dae");
        break;
      }
      case "KeyW": {
        this.camera.offset(
            this.camera.forward().negate(),
            GUI.zoomSpeed,
            true
          );
        break;
      }
      case "KeyA": {
        this.camera.offset(this.camera.right().negate(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyS": {
        this.camera.offset(this.camera.forward(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyD": {
        this.camera.offset(this.camera.right(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyR": {
        this.animation.reset();
        break;
      }
      case "ArrowLeft": {
		//TODO: Handle bone rolls when a bone is selected
        if (this.highlighted) {
          let bone = this.animation.getScene().meshes[0].bones[this.highlightBoneIndex];
          let boneAxis = bone.endpoint.copy().subtract(bone.position.copy()).normalize();
          let rotQuat = Quat.fromAxisAngle(boneAxis, -GUI.rollSpeed).normalize();
          this.rotateBone(bone, rotQuat);
          break;
        }
        else {
		      this.camera.roll(GUI.rollSpeed, false);
          break;
        }
      }
      case "ArrowRight": {
		//TODO: Handle bone rolls when a bone is selected
        if (this.highlighted) {
          let bone = this.animation.getScene().meshes[0].bones[this.highlightBoneIndex];
          let boneAxis = bone.endpoint.copy().subtract(bone.position.copy()).normalize();
          let rotQuat = Quat.fromAxisAngle(boneAxis, GUI.rollSpeed).normalize();
          this.rotateBone(bone, rotQuat);
          break;
        }
        else {
          this.camera.roll(GUI.rollSpeed, true);
          break;
        }
      }
      case "ArrowUp": {
        this.camera.offset(this.camera.up(), GUI.zoomSpeed, true);
        break;
      }
      case "ArrowDown": {
        this.camera.offset(this.camera.up().negate(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyK": {
        if (this.mode === Mode.edit) {
		//TODO: Add keyframes if required by project spec
        }
        break;
      }      
      case "KeyP": {
        if (this.mode === Mode.edit && this.getNumKeyFrames() > 1)
        {
          this.mode = Mode.playback;
          this.time = 0;
        } else if (this.mode === Mode.playback) {
          this.mode = Mode.edit;
        }
        break;
      }
      default: {
        console.log("Key : '", key.code, "' was pressed.");
        break;
      }
    }
  }

  /**
   * Registers all event listeners for the GUI
   * @param canvas The canvas being used
   */
  private registerEventListeners(canvas: HTMLCanvasElement): void {
    /* Event listener for key controls */
    window.addEventListener("keydown", (key: KeyboardEvent) =>
      this.onKeydown(key)
    );

    /* Event listener for mouse controls */
    canvas.addEventListener("mousedown", (mouse: MouseEvent) =>
      this.dragStart(mouse)
    );

    canvas.addEventListener("mousemove", (mouse: MouseEvent) =>
      this.drag(mouse)
    );

    canvas.addEventListener("mouseup", (mouse: MouseEvent) =>
      this.dragEnd(mouse)
    );

    /* Event listener to stop the right click menu */
    canvas.addEventListener("contextmenu", (event: any) =>
      event.preventDefault()
    );
  }
}

//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