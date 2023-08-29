import * as THREE from "three";
import { TextureLoader } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const TEXTURES = ["textures/fabric.jpeg", "textures/square_pattern.avif", "textures/carpet.jpeg"];
let windEnabled = true;
let pointAttached = true;
let clothTear = false;
let windLevel = 50;  

//Define scene and camera, also add orbital controls
const windowHeight = 800;
const windowWidth = 800;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(windowWidth, windowHeight);
renderer.setClearColor(0x87ceeb);
document.getElementById("renderer").appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

// Add a couple light sources
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);


//Add texture for the ground, by default set to rocky ground image
const groundTexture = new THREE.TextureLoader().load("textures/rocky_ground.jpeg");
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50); 

const groundGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);

groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -200;

scene.add(groundPlane);



// Define class for a particle - our cloth is represented by many particles connected by constraints
// Current implementation has mass always equal to 1, can change in future implementations
class Particle {
    constructor(x, y, z, mass = 1) {
      this.position = new THREE.Vector3(x, y, z);
      this.previous = new THREE.Vector3(x, y, z);
      this.original = new THREE.Vector3(x, y, z);
      this.mass = mass;
      this.velocity = new THREE.Vector3();
      this.force = new THREE.Vector3();
    }
}



// Initialize cloth geometry, as well as particles, vertices, and texture UV coordinates
const clothWidth = 10;
const clothHeight = 10;
const horizontalParticles = 20;
const verticalParticles = 20;
const clothGeometry = new THREE.BufferGeometry();

const particles = [];
const vertices = [];
const indices = [];
const textureUVs = [];

//Loop through each particle horizontally and vertically
for (let vertPart = 0; vertPart < verticalParticles; vertPart++) {
    for (let horPart = 0; horPart < horizontalParticles; horPart++) {

        //Initialize 3-d coordinates of particles based on cloth width and height
        //Center of cloth is at the origin, all particles z coordinate is 0
        const x = (horPart / (horizontalParticles - 1)) * clothWidth - clothWidth / 2;
        const y = (vertPart / (verticalParticles - 1)) * clothHeight - clothHeight / 2;
        const z = 0;

        //Add indices to define the particles as going row by row, from left to right
        const index = horPart + horizontalParticles * (verticalParticles - 1 - vertPart); 
        particles[index] = new Particle(x, y, z);
        vertices.push(x, y, z);

        if (horPart < horizontalParticles - 1 && vertPart < verticalParticles - 1) {

            //Create a square defined by 4 adjacent particles
            const topleft = horPart + horizontalParticles * vertPart;
            const bottomleft = horPart + horizontalParticles * (vertPart + 1);
            const bottomright = (horPart + 1) + horizontalParticles * (vertPart + 1);
            const topright = (horPart + 1) + horizontalParticles * vertPart;

            //Draw square by dividing it into two triangles
            indices.push(topleft, bottomleft, topright);
            indices.push(bottomleft, bottomright, topright);
        }

        //Update UV coordinates
        textureUVs.push(vertPart/verticalParticles, horPart/horizontalParticles);
    }
}

//Set attributes of cloth geometry
clothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
clothGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(textureUVs, 2));
clothGeometry.setIndex(indices);

const texture = new THREE.TextureLoader().load( "textures/fabric.jpeg");

//Create cloth material and cloth mesh
const clothMaterial = new THREE.MeshBasicMaterial({ map: texture, wireframe: false });
clothMaterial.side = THREE.DoubleSide; // Show both sides of the cloth

const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
scene.add(clothMesh);


//Create cylinder geometry to represent the pole that the cloth is attached to
const radiusTop = 0.1; 
const radiusBottom = 0.1;
const height = 1000;
const radialSegments = 32;
const geometry = new THREE.CylinderGeometry(
  radiusTop,
  radiusBottom,
  height,
  radialSegments
);

// Create cylinder mesh 
const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
const pole = new THREE.Mesh(geometry, material);

//Rotate and translate pole to be aligned with top of cloth and add to scene
pole.rotateZ(Math.PI/2);
pole.translateX(clothHeight/2 - 0.05);
scene.add(pole);


//Set position of camera
camera.position.set(20, 5, -15);
camera.lookAt(scene.position);
controls.update();

//Initialize wind force, only in -z direction
const windForce = new THREE.Vector3(0, 0, -5);


//Create time intervals - change timestep to change speed of simulation
//Constraint Iterations specifies integrity of cloth
const timeStep = 5 / 60;
const constraintIterations = 500;

//Define gravity vector (only -9.8 in the y direction)
const gravity = new THREE.Vector3(0, -9.8, 0);



//Method for ensuring that no two particles are more than their original distance from each other
function distConstraints(p1, p2, distance) {
    const diff = new THREE.Vector3().subVectors(p2.position, p1.position);
    const currentDistance = diff.length();
    if (currentDistance === 0) return; // Prevent division by zero

    //Find scaling factor based on ratio between current distance and resting (target) distance
    const ratio = distance / currentDistance
    const correction = diff.multiplyScalar(1 - ratio).multiplyScalar(0.5);

    //Correct positions of both particles.
    p1.position.add(correction);
    p2.position.sub(correction);
}

//Method for applying position constraints. If pointAttached is false, then the entire top side of the cloth is attached
function posConstraint(index){
    const particle = particles[index];
    particle.position.copy(particle.original);
    particle.previous.copy(particle.original);
    
}

function simulate() {
    
    // Attain wind strength from cos curve applied to current time stamp.
    const windStrength = Math.cos(performance.now() / 1000) * 2.5 + 1; // Adjust the frequency and amplitude of the wind

    //Update the z component of windforce since our wind only moves in the -z direction
    windForce.set(0, 0, (windLevel / -10) * windStrength);

    //For each particle, update the force of the particle.
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Mass is always 1 in current implementation - multiply gravity and wind by mass if mass changes
        particle.force.copy(gravity);
        if (windEnabled) {
            particle.force.add(windForce);
        }
    }


    //Update positions of particles by verlet integration stipulations
    for (let i = 0; i < particles.length; i++) {
        const curParticle = particles[i];
        const newPos = new THREE.Vector3().addVectors(curParticle.position, curParticle.velocity.multiplyScalar(timeStep));

        //Add force of particle to new position, update velocities and positions
        newPos.add(curParticle.force.multiplyScalar(timeStep * timeStep / 2));
        curParticle.velocity.add(curParticle.force.multiplyScalar(timeStep));
        curParticle.previous.copy(curParticle.position);
        curParticle.position.copy(newPos);
    }

    

    // Apply distance and position constraints. 
    // Constraints are more heavily enforced throughout entire cloth with higher constraint iterations
    for (let i = 0; i < constraintIterations; i++) {
        //Iterate through each vertical and horizontal particle
        for (let vertPart = 0; vertPart < verticalParticles; vertPart++) {
            for (let horPart = 0; horPart < horizontalParticles; horPart++) {
                const index = horPart + horizontalParticles * vertPart;

                //Apply distance constraint to horizontally adjacent particles (current particle and particle to the left)
                if (horPart > 0) {
                    if(clothTear){
                        if(horPart != horizontalParticles / 2){
                            distConstraints(particles[index], particles[index - 1], clothWidth / (horizontalParticles - 1));
                        }
                    }else {
                        distConstraints(particles[index], particles[index - 1], clothWidth / (horizontalParticles - 1));
                    }
                }
                
                //Apply distance constraint to vertically adjacent particles (current particle and particle above)
                if (vertPart > 0) {
                    distConstraints(particles[index], particles[index - horizontalParticles], clothHeight / (verticalParticles - 1));
                }
                
                //Apply position constraints
                //If point attached is false, attach top side
                //If point attached is true, only attach top two corners
                if (vertPart == 0 && (!pointAttached || (horPart == 0 || horPart == horizontalParticles - 1))) {
                    posConstraint(index);
                }
                
            }
        }
    }

    // Update positions of particles
    const positions = clothGeometry.attributes.position.array;
    for (let i = 0; i < particles.length; i++) {
        positions[i * 3] = particles[i].position.x;
        positions[i * 3 + 1] = particles[i].position.y;
        positions[i * 3 + 2] = particles[i].position.z;
    }

    clothGeometry.attributes.position.needsUpdate = true;
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);

    simulate();

    controls.update();

    renderer.render(scene, camera);
}

animate();

function updateTexture(radioButton) {
    const newTexture = new THREE.TextureLoader().load(TEXTURES[radioButton]);
    clothMaterial.map = newTexture;

    clothMesh.material.map.needsUpdate = true;
    clothMesh.material.needsUpdate = true;
}

function updateWind(wind) {
    windEnabled = wind;
}

function updateAttached(attached) {
    pointAttached = attached;
}

function updateTear(){
    clothTear = !clothTear;
}

function updateWindLevel(level){
    windLevel = level;
}



//Event listeners to update GUI buttons

const textureButtons = document.querySelectorAll('input[name="texture"]');
for (let i = 0; i < textureButtons.length; i++) {
  textureButtons[i].addEventListener('change', () => updateTexture(i));
}

const windButtons = document.querySelectorAll('input[name="wind"]');
for (let i = 0; i < windButtons.length; i++) {
  windButtons[i].addEventListener('change', () => updateWind(i == 0));
}

const attachedButtons = document.querySelectorAll('input[name="attached"]');
for (let i = 0; i < attachedButtons.length; i++) {
  attachedButtons[i].addEventListener('change', () => updateAttached(i == 0));
}

const slider = document.getElementById("myRange");
slider.addEventListener('change', () => updateWindLevel(slider.value));

