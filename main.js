import * as THREE from 'https://unpkg.com/three@0.162.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/PointerLockControls.js';
import { VRButton } from 'https://unpkg.com/three@0.162.0/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.162.0/examples/jsm/webxr/XRControllerModelFactory.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x666666); // Medium gray background

// Museum dimensions
const MUSEUM = {
    width: 60,
    height: 12,
    depth: 40,
    wallThickness: 0.5
};

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, MUSEUM.depth / 2 - 2); // Position at entrance, human height
camera.lookAt(0, 1.7, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true; // Enable XR support
document.body.appendChild(renderer.domElement);

// Create a VR button
document.body.appendChild(VRButton.createButton(renderer)); // Add VR button

// First Person Controls Setup
const controls = new PointerLockControls(camera, document.body);

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isSprinting = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let baseSpeed = 1.5; // Reduced default speed
const sprintMultiplier = 1.5; // Reduced sprint multiplier

// Add instructions overlay
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.width = '100%';
instructions.style.height = '100%';
instructions.style.top = '0';
instructions.style.left = '0';
instructions.style.display = 'flex';
instructions.style.flexDirection = 'column';
instructions.style.justifyContent = 'center';
instructions.style.alignItems = 'center';
instructions.style.color = '#ffffff';
instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.41)';
instructions.style.textAlign = 'center';
instructions.innerHTML = `
    <div style="padding: 20px; background: rgba(0,0,0,0.7); border-radius: 10px;">
        <h1 style="margin: 0 0 20px 0;">Welcome to Cafe Fomento </h1>
        <p style="margin: 0 0 10px 0;">Click to start</p>
        <p style="margin: 0;">
            Move: WASD / Arrow Keys<br>
            Look: Mouse<br>
            Sprint: Hold Shift<br>
            Video Play/Pause: X (when near)<br>
            Exit: ESC
        </p>
        <p id="error-message" style="color: #ff4444; margin-top: 10px; display: none;">
            Unable to start first-person view. Please ensure:<br>
            - You're using a supported browser<br>
            - The page is served from a web server<br>
            - You've allowed pointer lock in your browser
        </p>
        <button id="startButton" style="margin-top: 20px; padding: 10px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 5px; cursor: pointer;">Click to Start</button>
    </div>
`;
document.body.appendChild(instructions);

// Error message element
const errorMessage = document.getElementById('error-message');

// Get the start button element
const startButton = document.getElementById('startButton');

// Add event listener to the start button
startButton.addEventListener('click', () => {
    controls.lock(); // Lock the screen
    instructions.style.display = 'none'; // Hide the instructions
});

// Handle pointer lock state changes
controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
    speedControls.style.display = 'none';
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'flex'; // Show instructions again if unlocked
    speedControls.style.display = 'block'; // Show speed controls if needed
});

// Handle pointer lock errors
document.addEventListener('pointerlockerror', (event) => {
    console.error('Pointer lock error:', event);
    if (errorMessage) {
        errorMessage.style.display = 'block';
    }
});

// Add speed control UI
const speedControls = document.createElement('div');
speedControls.style.position = 'absolute';
speedControls.style.bottom = '20px';
speedControls.style.left = '50%';
speedControls.style.transform = 'translateX(-50%)';
speedControls.style.background = 'rgba(0,0,0,0.7)';
speedControls.style.padding = '10px';
speedControls.style.borderRadius = '5px';
speedControls.style.color = '#ffffff';
speedControls.style.textAlign = 'center';
speedControls.innerHTML = `
    <div>
        <label for="speedSlider">Walking Speed: <span id="speedValue">2.0</span></label><br>
        <input type="range" id="speedSlider" min="0.5" max="4" step="0.25" value="2.0" style="width: 200px"><br>
        <small style="color: #aaa">Hold Shift to Sprint (1.5x speed)</small>
    </div>
`;
document.body.appendChild(speedControls);

// Speed slider functionality
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
speedSlider.addEventListener('input', (e) => {
    baseSpeed = parseFloat(e.target.value);
    speedValue.textContent = baseSpeed.toFixed(1);
});

// Function to toggle video play/pause
function toggleVideo() {
    if (video.paused) {
        video.play();
        playPauseBtn.textContent = 'Pause';
        videoStatus.textContent = 'Playing';
    } else {
        video.pause();
        playPauseBtn.textContent = 'Play';
        videoStatus.textContent = 'Paused';
    }
}

// Keyboard controls
const onKeyDown = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isSprinting = true;
            break;
        case 'KeyX':
            if (isNearVideoFrame()) {
                toggleVideo();
            }
            break;
    }
};

const onKeyUp = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isSprinting = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light
scene.add(ambientLight);

// Main directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(20, 30, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add additional lights for better visibility
const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
frontLight.position.set(0, 10, 30);
scene.add(frontLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(0, 10, -30);
scene.add(backLight);

// Create floor with brighter color
const floorGeometry = new THREE.PlaneGeometry(MUSEUM.width, MUSEUM.depth);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa, // Lighter gray
    roughness: 0.3,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Enhanced ceiling with beams
function createCeilingBeam(width, height, depth, position) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
        color: 0xd3d3d3,
        roughness: 0.5,
        metalness: 0.2
    });
    const beam = new THREE.Mesh(geometry, material);
    beam.position.copy(position);
    beam.castShadow = true;
    beam.receiveShadow = true;
    return beam;
}

// Create main ceiling
const ceilingGeometry = new THREE.PlaneGeometry(MUSEUM.width, MUSEUM.depth);
const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide
});
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = MUSEUM.height;
ceiling.receiveShadow = true;
scene.add(ceiling);

// Add ceiling beams
const beamSpacing = 5;
for (let x = -MUSEUM.width/2 + beamSpacing; x < MUSEUM.width/2; x += beamSpacing) {
    const beam = createCeilingBeam(
        0.3, // width
        0.4, // height
        MUSEUM.depth, // depth
        new THREE.Vector3(x, MUSEUM.height - 0.2, 0)
    );
    scene.add(beam);
}

// Add cross beams
for (let z = -MUSEUM.depth/2 + beamSpacing; z < MUSEUM.depth/2; z += beamSpacing) {
    const crossBeam = createCeilingBeam(
        MUSEUM.width, // width
        0.4, // height
        0.3, // depth
        new THREE.Vector3(0, MUSEUM.height - 0.2, z)
    );
    scene.add(crossBeam);
}

// Create walls
function createWall(width, height, depth, position, rotation = { x: 0, y: 0, z: 0 }) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.5,
        metalness: 0.1
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.rotation.x = rotation.x;
    wall.rotation.y = rotation.y;
    wall.rotation.z = rotation.z;
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
}

// Back wall
const backWall = createWall(
    MUSEUM.width,
    MUSEUM.height,
    MUSEUM.wallThickness,
    new THREE.Vector3(0, MUSEUM.height / 2, -MUSEUM.depth / 2)
);
scene.add(backWall);

// Front wall with entrance
const frontWallLeft = createWall(
    MUSEUM.width / 3,
    MUSEUM.height,
    MUSEUM.wallThickness,
    new THREE.Vector3(-MUSEUM.width / 3, MUSEUM.height / 2, MUSEUM.depth / 2)
);
scene.add(frontWallLeft);

const frontWallRight = createWall(
    MUSEUM.width / 3,
    MUSEUM.height,
    MUSEUM.wallThickness,
    new THREE.Vector3(MUSEUM.width / 3, MUSEUM.height / 2, MUSEUM.depth / 2)
);
scene.add(frontWallRight);

const frontWallTop = createWall(
    MUSEUM.width,
    MUSEUM.height / 3,
    MUSEUM.wallThickness,
    new THREE.Vector3(0, MUSEUM.height - MUSEUM.height / 6, MUSEUM.depth / 2)
);
scene.add(frontWallTop);

// Side walls
const leftWall = createWall(
    MUSEUM.depth,
    MUSEUM.height,
    MUSEUM.wallThickness,
    new THREE.Vector3(-MUSEUM.width / 2, MUSEUM.height / 2, 0),
    { x: 0, y: Math.PI / 2, z: 0 }
);
scene.add(leftWall);

const rightWall = createWall(
    MUSEUM.depth,
    MUSEUM.height,
    MUSEUM.wallThickness,
    new THREE.Vector3(MUSEUM.width / 2, MUSEUM.height / 2, 0),
    { x: 0, y: Math.PI / 2, z: 0 }
);
scene.add(rightWall);

// Create short interior walls
const INTERIOR_WALL_HEIGHT = MUSEUM.height * 0.7; // 70% of ceiling height
const INTERIOR_WALL_LENGTH = MUSEUM.depth / 2;

// Create first short wall (left side, parallel to entrance)

// const shortWall1 = createWall(
//     INTERIOR_WALL_LENGTH*.7,
//     INTERIOR_WALL_HEIGHT,
//     MUSEUM.wallThickness,
//     new THREE.Vector3(-MUSEUM.width / 4, INTERIOR_WALL_HEIGHT / 2, -MUSEUM.depth / 4+8),
//     { x: 0, y: 0, z: 0 }
// );
// scene.add(shortWall1);

// Create second short wall (right side, parallel to entrance)
const shortWall2 = createWall(
    INTERIOR_WALL_LENGTH*.7,
    INTERIOR_WALL_HEIGHT/3,
    MUSEUM.wallThickness,
    new THREE.Vector3(MUSEUM.width / 8-1, INTERIOR_WALL_HEIGHT / 3-1, -MUSEUM.depth / 4 ),
    { x: 0, y: 0, z: 0 }
);
scene.add(shortWall2);

// Create third short wall (left side, perpendicular to entrance)
const shortWall3 = createWall(
    INTERIOR_WALL_LENGTH/2,
    INTERIOR_WALL_HEIGHT,
    MUSEUM.wallThickness,
    new THREE.Vector3(-MUSEUM.width / 4, INTERIOR_WALL_HEIGHT / 2, -MUSEUM.depth / 4+3),
    { x: 0, y: Math.PI / 2, z: 0 }
);
scene.add(shortWall3);

// Create fourth short wall (right side, perpendicular to entrance)
const shortWall4 = createWall(
    INTERIOR_WALL_LENGTH/4,
    INTERIOR_WALL_HEIGHT/3,
    MUSEUM.wallThickness,
    new THREE.Vector3(MUSEUM.width / 4-2, INTERIOR_WALL_HEIGHT / 3-1, -MUSEUM.depth / 4-2.5),
    { x: 0, y: Math.PI / 2, z: 0 }
);
scene.add(shortWall4);

const table = createWall(
    INTERIOR_WALL_LENGTH/3,
    INTERIOR_WALL_HEIGHT/2,
    MUSEUM.wallThickness,
    new THREE.Vector3(MUSEUM.width / 4-2, INTERIOR_WALL_HEIGHT / 3-1, MUSEUM.depth/4-5 ),
    { x: 0, y: Math.PI / 2, z: 0 }
);
table.rotation.x = Math.PI/2
table.rotation.y = Math.PI
scene.add(table);

const table_leg = createWall(
    INTERIOR_WALL_LENGTH/8,
    INTERIOR_WALL_HEIGHT/6,
    MUSEUM.wallThickness*4,
    new THREE.Vector3(MUSEUM.width / 4-2, INTERIOR_WALL_HEIGHT / 3-2, MUSEUM.depth/4-5 ),
    { x: 0, y: Math.PI / 2, z: 0 }
);
table_leg.rotation.x = Math.PI/2
table_leg.rotation.y = Math.PI
scene.add(table_leg);

const coffeeinfo = createWall(
    INTERIOR_WALL_LENGTH/8,
    INTERIOR_WALL_HEIGHT/6,
    MUSEUM.wallThickness*4,
    new THREE.Vector3(MUSEUM.width / 4+3, INTERIOR_WALL_HEIGHT / 3-2, MUSEUM.depth/4-28 ),
    { x: 0, y: Math.PI / 2, z: 0 }
);
coffeeinfo.rotation.x = Math.PI/2
coffeeinfo.rotation.y = Math.PI
scene.add(coffeeinfo);

// Create video frame
const frameWidth = 4;
const frameHeight = 6;
const frameDepth = 0.2;

// Create video elements
const video = document.createElement('video');
video.style.display = 'none';
video.crossOrigin = 'anonymous';
video.loop = true;
video.muted = true;
document.body.appendChild(video);

const video2 = document.createElement('video');
video2.style.display = 'none';
video2.crossOrigin = 'anonymous';
video2.loop = true;
video2.muted = true;
document.body.appendChild(video2);


const video3 = document.createElement('video');
video3.style.display = 'block'; // Make it visible for testing
video3.crossOrigin = 'anonymous';
video3.loop = true;
video3.muted = true;
document.body.appendChild(video3);

// set video 
video3.src = './videos/airline-game.mp4';



const video4 = document.createElement('video');
video4.style.display = 'block'; // Make it visible for testing
video4.crossOrigin = 'anonymous';
video4.loop = true;
video4.muted = true;
document.body.appendChild(video4);

video4.src = './videos/fomento-menu.mp4';


video4.addEventListener('loadeddata', () => {
    console.log("Video 4 is loaded and ready to play.");
    video4.play().catch((error) => {
        console.error("Error attempting to play the video:", error);
    });
});

const video5 = document.createElement('video');
video4.style.display = 'block'; // Make it visible for testing
video4.crossOrigin = 'anonymous';
video4.loop = true;
video4.muted = true;
document.body.appendChild(video5);

video5.src = './videos/fomento-expo.mp4';


video5.addEventListener('loadeddata', () => {
    console.log("Video 5 is loaded and ready to play.");
    video5.play().catch((error) => {
        console.error("Error attempting to play the video:", error);
    });
});




// Create video textures
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

const videoTexture2 = new THREE.VideoTexture(video2);
videoTexture2.minFilter = THREE.LinearFilter;
videoTexture2.magFilter = THREE.LinearFilter;

const videoTexture3 = new THREE.VideoTexture(video3);
videoTexture3.minFilter = THREE.LinearFilter;
videoTexture3.magFilter = THREE.LinearFilter;

const videoTexture4 = new THREE.VideoTexture(video4);
videoTexture4.minFilter = THREE.LinearFilter;
videoTexture4.magFilter = THREE.LinearFilter;

const videoTexture5 = new THREE.VideoTexture(video5);
videoTexture5.minFilter = THREE.LinearFilter;
videoTexture5.magFilter = THREE.LinearFilter;

// Create frame materials
const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.5
});

const screenMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.FrontSide
});

const screenMaterial2 = new THREE.MeshBasicMaterial({
    map: videoTexture2,
    side: THREE.FrontSide
});

const screenMaterial3 = new THREE.MeshBasicMaterial({
    map: videoTexture3,
    side: THREE.FrontSide
});

const screenMaterial4 = new THREE.MeshBasicMaterial({
    map: videoTexture4,
    side: THREE.FrontSide
});

const screenMaterial5 = new THREE.MeshBasicMaterial({
    map: videoTexture5,
    side: THREE.FrontSide
});



// Create frame and screen geometries
const frameGeometry = new THREE.BoxGeometry(frameWidth + 0.2, frameHeight + 0.2, frameDepth);
const screenGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight);

// Create first video frame (left wall)
const frame = new THREE.Mesh(frameGeometry, frameMaterial);
const screen = new THREE.Mesh(screenGeometry, screenMaterial);

// Create second video frame (right wall)
const frame2 = new THREE.Mesh(frameGeometry.clone(), frameMaterial.clone());
const screen2 = new THREE.Mesh(screenGeometry.clone(), screenMaterial2);

const screen3 = new THREE.Mesh(screenGeometry.clone(), screenMaterial3);
const screen4 = new THREE.Mesh(screenGeometry.clone(), screenMaterial4);
const screen5 = new THREE.Mesh(screenGeometry.clone(), screenMaterial5);

// Position first frame and screen (left wall)
frame.position.set(
    -MUSEUM.width / 4,
    INTERIOR_WALL_HEIGHT / 2, 
    -MUSEUM.depth /4 + MUSEUM.wallThickness / 2 + frameDepth / 2 + 8
);
screen.position.set(
    -MUSEUM.width / 4,
    INTERIOR_WALL_HEIGHT / 2,
    -MUSEUM.depth / 4 + MUSEUM.wallThickness / 2 + frameDepth + MUSEUM.depth/2+8
);
screen.rotation.y = 3.14

// Position second frame and screen (right wall)
frame2.position.set(
    MUSEUM.width / 4,
    INTERIOR_WALL_HEIGHT / 2,
    -MUSEUM.depth /4 + MUSEUM.wallThickness / 2 + frameDepth / 2 + 8
);
screen2.position.set(
    MUSEUM.width / 4,
    INTERIOR_WALL_HEIGHT / 2,
    -MUSEUM.depth / 4 + MUSEUM.wallThickness / 2 + frameDepth + MUSEUM.depth/2+8
    

);

screen2.rotation.y = 3.14 

screen3.position.set(
    MUSEUM.width / 4+10,
    INTERIOR_WALL_HEIGHT / 2,
    -MUSEUM.depth /2 +5 + frameDepth + MUSEUM.depth/4+2
);

screen3.rotation.y = -Math.PI/2

screen4.position.set(
    MUSEUM.width / 4-2,
     INTERIOR_WALL_HEIGHT / 3-.7,
      MUSEUM.depth/4-5
    
);
screen4.rotation.z = -Math.PI/2
screen4.rotation.x = -Math.PI/2
// screen4.rotation.y = Math.PI/2

screen5.rotation.y = 3.14 

screen5.position.set(
    0,
    INTERIOR_WALL_HEIGHT / 2,
    MUSEUM.depth /4 -3 + frameDepth + MUSEUM.depth/4+2
);


// scene.add(frame);
scene.add(screen);
// scene.add(frame2);
scene.add(screen2);
scene.add(screen3);
scene.add(screen4);
scene.add(screen5);


// Add spotlights for video frames
const frameSpotlight = createSpotlight(
    new THREE.Vector3(-MUSEUM.width / 4, MUSEUM.height - 1, -MUSEUM.depth / 4),
    new THREE.Vector3(-MUSEUM.width / 4, INTERIOR_WALL_HEIGHT / 2, -MUSEUM.depth / 4)
);
frameSpotlight.angle = Math.PI / 6;
frameSpotlight.intensity = 2;
frameSpotlight.distance = 15;
scene.add(frameSpotlight);

const frameSpotlight2 = createSpotlight(
    new THREE.Vector3(MUSEUM.width / 4, MUSEUM.height - 1, -MUSEUM.depth / 4),
    new THREE.Vector3(MUSEUM.width / 4, INTERIOR_WALL_HEIGHT / 2, -MUSEUM.depth / 4)
);
frameSpotlight2.angle = Math.PI / 6;
frameSpotlight2.intensity = 2;
frameSpotlight2.distance = 15;
scene.add(frameSpotlight2);

// Create video controls UI for both frames
const videoControls = document.createElement('div');
videoControls.style.position = 'absolute';
videoControls.style.bottom = '20%';
videoControls.style.left = '50%';
videoControls.style.transform = 'translateX(-50%)';
videoControls.style.background = 'rgba(0,0,0,0.7)';
videoControls.style.padding = '10px';
videoControls.style.borderRadius = '5px';
videoControls.style.color = '#ffffff';
videoControls.style.textAlign = 'center';
videoControls.style.display = 'none';
videoControls.innerHTML = `
    <div style="display: flex; gap: 10px; align-items: center;">
        <button id="playPauseBtn" style="padding: 5px 10px; background: #444; color: white; border: none; border-radius: 3px; cursor: pointer;">Play</button>
        <div id="videoStatus" style="margin-left: 10px;">Paused</div>
    </div>
`;

const videoControls2 = document.createElement('div');
videoControls2.style.position = 'absolute';
videoControls2.style.bottom = '20%';
videoControls2.style.left = '50%';
videoControls2.style.transform = 'translateX(-50%)';
videoControls2.style.background = 'rgba(0,0,0,0.7)';
videoControls2.style.padding = '10px';
videoControls2.style.borderRadius = '5px';
videoControls2.style.color = '#ffffff';
videoControls2.style.textAlign = 'center';
videoControls2.style.display = 'none';
videoControls2.innerHTML = `
    <div style="display: flex; gap: 10px; align-items: center;">
        <button id="playPauseBtn2" style="padding: 5px 10px; background: #444; color: white; border: none; border-radius: 3px; cursor: pointer;">Play</button>
        <div id="videoStatus2" style="margin-left: 10px;">Paused</div>
    </div>
`;

document.body.appendChild(videoControls);
document.body.appendChild(videoControls2);
// document.body.appendChild(videoControls3);


const playPauseBtn = document.getElementById('playPauseBtn');
const videoStatus = document.getElementById('videoStatus');
const playPauseBtn2 = document.getElementById('playPauseBtn2');
const videoStatus2 = document.getElementById('videoStatus2');
// const playPauseBtn3 = document.getElementById('playPauseBtn3');
// const videoStatus3 = document.getElementById('videoStatus3');

// Video control functionality for both frames
playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPauseBtn.textContent = 'Pause';
        videoStatus.textContent = 'Playing';
    } else {
        video.pause();
        playPauseBtn.textContent = 'Play';
        videoStatus.textContent = 'Paused';
    }
});

playPauseBtn2.addEventListener('click', () => {
    if (video2.paused) {
        video2.play();
        playPauseBtn2.textContent = 'Pause';
        videoStatus2.textContent = 'Playing';
    } else {
        video2.pause();
        playPauseBtn2.textContent = 'Play';
        videoStatus2.textContent = 'Paused';
    }
});

// playPauseBtn3.addEventListener('click', () => {
//     if (video3.paused) {
//         video3.play();
//         playPauseBtn3.textContent = 'Pause';
//         videoStatus3.textContent = 'Playing';
//     } else {
//         video3.pause();
//         playPauseBtn3.textContent = 'Play';
//         videoStatus3.textContent = 'Paused';
//     }
// });

// Function to check if camera is near either video frame
function isNearVideoFrame() {
    const distanceToFrame1 = camera.position.distanceTo(frame.position);
    const distanceToFrame2 = camera.position.distanceTo(frame2.position);
    const viewingDistance = 5;
    return {
        frame1: distanceToFrame1 < viewingDistance,
        frame2: distanceToFrame2 < viewingDistance
    };
}

// Add file inputs for both video selections
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'video/*';
fileInput.style.position = 'absolute';
fileInput.style.bottom = '60px';
fileInput.style.left = '25%';
fileInput.style.transform = 'translateX(-50%)';
fileInput.style.zIndex = '1000';
fileInput.style.backgroundColor = 'rgba(0,0,0,0.7)';
fileInput.style.color = 'white';
fileInput.style.padding = '10px';
fileInput.style.borderRadius = '5px';

const fileInput2 = document.createElement('input');
fileInput2.type = 'file';
fileInput2.accept = 'video/*';
fileInput2.style.position = 'absolute';
fileInput2.style.bottom = '60px';
fileInput2.style.left = '75%';
fileInput2.style.transform = 'translateX(-50%)';
fileInput2.style.zIndex = '1000';
fileInput2.style.backgroundColor = 'rgba(0,0,0,0.7)';
fileInput2.style.color = 'white';
fileInput2.style.padding = '10px';
fileInput2.style.borderRadius = '5px';

document.body.appendChild(fileInput);
document.body.appendChild(fileInput2);



// Handle file selection for both frames
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;
        video.load();
        video.play().catch(e => {
            console.log("Video autoplay failed:", e);
            playPauseBtn.textContent = 'Play';
            videoStatus.textContent = 'Paused';
        });
        playPauseBtn.textContent = 'Pause';
        videoStatus.textContent = 'Playing';
    }
});

fileInput2.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        video2.src = fileURL;
        video2.load();
        video2.play().catch(e => {
            console.log("Video autoplay failed:", e);
            playPauseBtn2.textContent = 'Play';
            videoStatus2.textContent = 'Paused';
        });
        playPauseBtn2.textContent = 'Pause';
        videoStatus2.textContent = 'Playing';
    }
});

// Hide file inputs when in pointer lock mode
controls.addEventListener('lock', () => {
    fileInput.style.display = 'none';
    fileInput2.style.display = 'none';
    videoControls.style.display = 'none';
    videoControls2.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    fileInput.style.display = 'block';
    fileInput2.style.display = 'block';
    videoControls.style.display = 'none';
    videoControls2.style.display = 'none';
    
});

// Add general room spotlights
function createSpotlight(position, targetPosition) {
    const spotlight = new THREE.SpotLight(0xffffff, 1);
    spotlight.position.copy(position);
    spotlight.angle = Math.PI / 4;
    spotlight.penumbra = 0.5;
    spotlight.decay = 2;
    spotlight.distance = 25;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;

    const targetObject = new THREE.Object3D();
    targetObject.position.copy(targetPosition);
    scene.add(targetObject);
    spotlight.target = targetObject;

    return spotlight;
}

// Add room spotlights in a grid pattern
const spotlightSpacing = 15;
for (let x = -MUSEUM.width/3; x <= MUSEUM.width/3; x += spotlightSpacing) {
    for (let z = -MUSEUM.depth/3; z <= MUSEUM.depth/3; z += spotlightSpacing) {
        const spotlight = createSpotlight(
            new THREE.Vector3(x, MUSEUM.height - 0.5, z),
            new THREE.Vector3(x, 0, z)
        );
        scene.add(spotlight);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    renderer.setAnimationLoop(render); // Use setAnimationLoop for VR
}

// Add after renderer setup
const controllerModelFactory = new XRControllerModelFactory();

// Create controllers
const controller1 = renderer.xr.getController(0); // Left controller
const controller2 = renderer.xr.getController(1); // Right controller

// Add controller models
const controllerGrip1 = renderer.xr.getControllerGrip(0);
const controllerGrip2 = renderer.xr.getControllerGrip(1);

// Add controller models to the scene
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));

scene.add(controllerGrip1);
scene.add(controllerGrip2);

// Add controller rays for pointing
const controllerRay1 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff })
);
controllerRay1.scale.z = 5;
controller1.add(controllerRay1);

const controllerRay2 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff })
);
controllerRay2.scale.z = 5;
controller2.add(controllerRay2);

scene.add(controller1);
scene.add(controller2);

// Movement variables for VR
let vrMoveForward = false;
let vrMoveBackward = false;
let vrMoveLeft = false;
let vrMoveRight = false;
const vrSpeed = 2.0;

// Handle VR controller input
controller1.addEventListener('squeezestart', () => {
    vrMoveForward = true;
});

controller1.addEventListener('squeezeend', () => {
    vrMoveForward = false;
});

controller2.addEventListener('squeezestart', () => {
    vrMoveBackward = true;
});

controller2.addEventListener('squeezeend', () => {
    vrMoveBackward = false;
});

// Add thumbstick movement
controller1.addEventListener('thumbstickmoved', (event) => {
    const x = event.axes[0];
    const y = event.axes[1];
    
    // Simple joystick movement
    vrMoveLeft = x < -0.5;
    vrMoveRight = x > 0.5;
    vrMoveForward = y > 0.5;
    vrMoveBackward = y < -0.5;
});

// Add trigger functionality for right controller
controller2.addEventListener('selectstart', () => {
    // Check if controller ray intersects with any interactive objects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), controller2);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        // Handle interaction with the object
        console.log('Interacting with:', object);
    }
});

// Add haptic feedback
function triggerHapticPulse(controller, intensity, duration) {
    if (controller.gamepad && controller.gamepad.hapticActuators) {
        controller.gamepad.hapticActuators[0].pulse(intensity, duration);
    }
}

// Add controller button events
controller1.addEventListener('squeezestart', () => {
    triggerHapticPulse(controller1, 0.5, 100);
});

controller2.addEventListener('squeezestart', () => {
    triggerHapticPulse(controller2, 0.5, 100);
});

// Update the render function to handle VR movement
function render() {
    if (renderer.xr.isPresenting) {
        // VR Movement
        const moveSpeed = vrSpeed * 0.01;
        
        // Get the camera's forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        
        // Reset Y component to keep movement on the ground plane
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        // Apply movement to the camera
        if (vrMoveForward) {
            camera.position.add(forward.multiplyScalar(moveSpeed));
        }
        if (vrMoveBackward) {
            camera.position.add(forward.multiplyScalar(-moveSpeed));
        }
        if (vrMoveLeft) {
            camera.position.add(right.multiplyScalar(-moveSpeed));
        }
        if (vrMoveRight) {
            camera.position.add(right.multiplyScalar(moveSpeed));
        }
    } else {
        if (controls.isLocked) {
            // Calculate movement
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            // Apply movement with sprint multiplier
            const currentSpeed = isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;
            
            if (moveForward || moveBackward) velocity.z = direction.z * currentSpeed;
            if (moveLeft || moveRight) velocity.x = direction.x * currentSpeed;

            // Store current position before movement
            const previousPosition = camera.position.clone();

            // Update position
            controls.moveRight(velocity.x * 0.1);
            controls.moveForward(velocity.z * 0.1);

            // Collision detection parameters
            const playerRadius = 0.3;
            const wallPadding = playerRadius + MUSEUM.wallThickness / 2;

            // Main walls collision
            let collision = false;

            // Outer walls collision
            if (camera.position.x < -MUSEUM.width/2 + wallPadding || 
                camera.position.x > MUSEUM.width/2 - wallPadding || 
                camera.position.z < -MUSEUM.depth/2 + wallPadding || 
                camera.position.z > MUSEUM.depth/2 - wallPadding) {
                collision = true;
            }

            // Front entrance walls collision
            if (camera.position.z > MUSEUM.depth/2 - wallPadding) {
                // Left entrance wall
                if (camera.position.x < -MUSEUM.width/6) {
                    collision = true;
                }
                // Right entrance wall
                if (camera.position.x > MUSEUM.width/6) {
                    collision = true;
                }
            }

            // Interior walls collision
            const shortWallHalfLength = INTERIOR_WALL_LENGTH *.6 / 2; // Updated for shorter parallel walls
            const perpWallHalfLength = INTERIOR_WALL_LENGTH / 4 ; // Updated for shorter perpendicular walls

            // Left parallel wall (shortWall1)
            // if (Math.abs(camera.position.x + MUSEUM.width/4) < wallPadding &&
            //     Math.abs(camera.position.z - (-MUSEUM.depth/4 +4 )) < shortWallHalfLength) {
            //     collision = true;
            // }

            // Right parallel wall (shortWall2)
            // if (Math.abs(camera.position.x - MUSEUM.width/2-5) < wallPadding &&
            //     Math.abs(camera.position.z - (-MUSEUM.depth/4-5 )) < shortWallHalfLength) {
            //     collision = true;
            // }

            // // Left perpendicular wall (shortWall3)
            // if (Math.abs(camera.position.z - (-MUSEUM.depth/4 +8)) < wallPadding &&
            //     Math.abs(camera.position.x + MUSEUM.width/5) < perpWallHalfLength) {
            //     collision = true;
            // }

            // // Right perpendicular wall (shortWall4)
            // if (Math.abs(camera.position.z - (-MUSEUM.depth/4 + 8)) < wallPadding &&
            //     Math.abs(camera.position.x - MUSEUM.width/5) < perpWallHalfLength) {
            //     collision = true;
            // }

            // If collision detected, restore previous position
            if (collision) {
                camera.position.copy(previousPosition);
            }

            // Apply friction
            velocity.x *= 0.8;
            velocity.z *= 0.8;

            // Check proximity to video frame and update controls visibility
            if (isNearVideoFrame()) {
                videoControls.style.display = 'block';
            } else {
                videoControls.style.display = 'none';
            }
        }
    }

    renderer.render(scene, camera);
}

animate();

// Create texture loader
const textureLoader = new THREE.TextureLoader();

// Function to load texture and handle errors
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error(`Error loading texture ${path}:`, error);
                // Return a colored material as fallback
                resolve(new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff,
                    roughness: 0.5,
                    metalness: 0.2
                }));
            }
        );
    });
}

// Create picture frame function with texture support
function createPictureFrame(width, height, position, rotation, texturePath) {
    const frameDepth = 0.1;
    const framePadding = 0.1;

    // Create frame
    const frameGeometry = new THREE.BoxGeometry(width + framePadding*2, height + framePadding*2, frameDepth);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.5
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);

    // Create picture
    const pictureGeometry = new THREE.PlaneGeometry(width, height);
    let pictureMaterial;

    // Load texture if path provided, otherwise use random color
    if (texturePath) {
        pictureMaterial = new THREE.MeshStandardMaterial({
            roughness: 0.5,
            metalness: 0.2
        });
        
        loadTexture(texturePath).then(texture => {
            pictureMaterial.map = texture;
            pictureMaterial.needsUpdate = true;
        });
    } else {
        pictureMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.2
        });
    }

    const picture = new THREE.Mesh(pictureGeometry, pictureMaterial);

    // Position frame and picture
    frame.position.copy(position);
    frame.rotation.copy(rotation);
    picture.position.copy(position);
    picture.rotation.copy(rotation);
    
    // Offset picture slightly from frame
    const offset = new THREE.Vector3(0, 0, frameDepth/2 + 0.01);
    offset.applyEuler(rotation);
    picture.position.add(offset);

    return { frame, picture };
}

// Add picture frames to walls with texture paths
const FRAME_WIDTH = 3 * 1.3;
const FRAME_HEIGHT = 2 * 1.3;
const FRAME_WALL_HEIGHT = INTERIOR_WALL_HEIGHT / 2;

// Left wall frames
const leftFrame1 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(-MUSEUM.width/2 + MUSEUM.wallThickness/2 + 0.1, FRAME_WALL_HEIGHT, -MUSEUM.depth/4),
    new THREE.Euler(0, Math.PI/2, 0),
    'textures/frame1.png'
);
scene.add(leftFrame1.frame);
scene.add(leftFrame1.picture);

const leftFrame2 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(-MUSEUM.width/2 + MUSEUM.wallThickness/2 + 0.1, FRAME_WALL_HEIGHT, MUSEUM.depth/4),
    new THREE.Euler(0, Math.PI/2, 0),
    'textures/frame2.png'
);
scene.add(leftFrame2.frame);
scene.add(leftFrame2.picture);

// Right wall frames
const rightFrame1 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(MUSEUM.width/2 - MUSEUM.wallThickness/2 - 0.1, FRAME_WALL_HEIGHT, -MUSEUM.depth/4),
    new THREE.Euler(0, -Math.PI/2, 0),
    'textures/frame3.png'
);
scene.add(rightFrame1.frame);
scene.add(rightFrame1.picture);

const rightFrame2 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(MUSEUM.width/2 - MUSEUM.wallThickness/2 - 0.1, FRAME_WALL_HEIGHT, MUSEUM.depth/4),
    new THREE.Euler(0, -Math.PI/2, 0),
    'textures/frame4.png'
);
scene.add(rightFrame2.frame);
scene.add(rightFrame2.picture);

// Back wall frames
const backFrame1 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(-MUSEUM.width/4, FRAME_WALL_HEIGHT, -MUSEUM.depth/2 + MUSEUM.wallThickness/2 + 0.1),
    new THREE.Euler(0, 0, 0),
    'textures/frame5.png'
);
scene.add(backFrame1.frame);
scene.add(backFrame1.picture);

const backFrame2 = createPictureFrame(
    FRAME_WIDTH,
    FRAME_HEIGHT,
    new THREE.Vector3(MUSEUM.width/4, FRAME_WALL_HEIGHT, -MUSEUM.depth/2 + MUSEUM.wallThickness/2 + 0.1),
    new THREE.Euler(0, 0, 0),
    'textures/frame6.png'
);
scene.add(backFrame2.frame);
scene.add(backFrame2.picture);

// Add spotlights for each picture frame
function createFrameSpotlight(position, targetPosition) {
    const spotlight = new THREE.SpotLight(0xffffff, 1.5);
    spotlight.position.copy(position);
    spotlight.angle = Math.PI/6;
    spotlight.penumbra = 0.5;
    spotlight.decay = 2;
    spotlight.distance = 10;
    spotlight.castShadow = true;

    const targetObject = new THREE.Object3D();
    targetObject.position.copy(targetPosition);
    scene.add(targetObject);
    spotlight.target = targetObject;

    return spotlight;
}

// Add spotlights for each frame
[leftFrame1, leftFrame2, rightFrame1, rightFrame2, backFrame1, backFrame2].forEach(frame => {
    const spotlightPosition = frame.frame.position.clone();
    spotlightPosition.y = MUSEUM.height - 3;
    
    const spotlight = createFrameSpotlight(
        spotlightPosition,
        frame.frame.position
    );
    scene.add(spotlight);
});

// Create an iframe element
const iframe = document.createElement('iframe');
iframe.style.width = '80%'; // Set width of the iframe
iframe.style.height = '80%'; // Set height of the iframe
iframe.style.position = 'fixed'; // Fixed position
iframe.style.top = '10%'; // Position from the top
iframe.style.left = '10%'; // Position from the left
iframe.style.zIndex = '1000'; // Ensure it appears above other content
iframe.style.border = 'none'; // Remove border
iframe.style.display = 'none'; // Initially hidden

// Append the iframe to the body
document.body.appendChild(iframe);

// ... existing iframe code ...

// Create close button
let closeButton; 

function showcCloseButton() {
    if (!closeButton) {
        closeButton = document.createElement('button');
        closeButton.textContent = 'X'; // Set button text
        closeButton.style.position = 'absolute'; // Position it absolutely
        closeButton.style.top = '5%'; // Position from the top
        closeButton.style.right = '5%'; // Position from the right
        closeButton.style.zIndex = '1001'; // Ensure it appears above the iframe
        closeButton.style.fontSize = '20px'; // Adjust font size
        closeButton.style.backgroundColor = 'red'; // Background color
        closeButton.style.color = 'white'; // Text color
        closeButton.style.border = 'none'; // Remove border
        closeButton.style.cursor = 'pointer'; // Change cursor on hover
        closeButton.style.padding = '5px 10px'; // Add some padding
        closeButton.style.borderRadius = '5px'; // Rounded corners

        // Append the close button to the body
        document.body.appendChild(closeButton);

        // Add event listener to close the iframe
        closeButton.addEventListener('click', () => {
            iframe.style.display = 'none'; // Hide the iframe
            closeButton.style.display = 'none'; // Hide the close button
        });
    } else {
        closeButton.style.display = 'block'; // Show the button again if it already exists
    }
}

// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// limit clicking when unlock event listener for mouse clicks
window.addEventListener('click', (event) => {
    // Check if the pointer is locked
    if (!document.pointerLockElement) {
        // Pointer is not locked, prevent the action
        console.log("Pointer is not locked. Action is limited.");
        return; // Exit the function to prevent further action
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects([screen4]);

    if (intersects.length > 0) {
        console.log("screen4 clicked"); // Log when screen4 is clicked
        iframe.src = 'storyline/fomento-final/index.html'; // Ensure this path is correct
        iframe.style.display = 'block'; // Show the iframe
        console.log("iframe src set to:", iframe.src); // Log the iframe source
        showcCloseButton(); // Show the close button
        controls.unlock(); // Lock the screen
    }
});

window.addEventListener('click', (event) => {
    // Check if the pointer is locked
    if (!document.pointerLockElement) {
        // Pointer is not locked, prevent the action
        console.log("Pointer is not locked. Action is limited.");
        return; // Exit the function to prevent further action
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects([screen5]);

    if (intersects.length > 0) {
        console.log("screen5 clicked"); // Log when screen4 is clicked
        iframe.src = 'storyline/fomento-final/index.html'; // Ensure this path is correct
        iframe.style.display = 'block'; // Show the iframe
        console.log("iframe src set to:", iframe.src); // Log the iframe source
        showcCloseButton(); // Show the close button
        controls.unlock(); // Lock the screen
    }
});

window.addEventListener('click', (event) => {
    // Check if the pointer is locked
    if (!document.pointerLockElement) {
        // Pointer is not locked, prevent the action
        console.log("Pointer is not locked. Action is limited.");
        return; // Exit the function to prevent further action
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects([coffeeinfo]);

    if (intersects.length > 0) {
        console.log("coffee clicked"); // Log when screen4 is clicked
        showInfoDialog();
      
        controls.unlock(); // Lock the screen
    }
});

function showInfoDialog() {
    const dialog = document.createElement('div');
    dialog.style.position = 'absolute';
    dialog.style.top = '550px';
    dialog.style.left = '730px';
    dialog.style.padding = '130px';
    dialog.style.background = 'white';
    dialog.style.border = '1px solid black';
    dialog.style.opacity = '1'; // Set the desired opacity
    dialog.innerHTML = '<strong>Coffee Info:</strong><br>This is a coffee object. ☕<br><button id="closeBtn">Close</button>';

    document.body.appendChild(dialog);
  
    document.getElementById('closeBtn').onclick = () => {
      dialog.remove();
    };
  }


// Add event listener to the start button
startButton.addEventListener('click', () => {
    controls.lock(); // Lock the screen
    instructions.style.display = 'none'; // Hide the instructions
})

