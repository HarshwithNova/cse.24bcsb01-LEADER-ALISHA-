// ============================================================================
// COSMIC WATCH - FRONTEND
// ============================================================================

// Global Variables
let asteroidsThree = [];
let asteroidData = [];
let selectedAsteroid = null;
let isAudioPlaying = false;
let animationSpeed = 1;
let animationFrameId = null;

// Three.js Variables
let scene, camera, renderer, controls;
let earth, moon, earthOrbit, moonOrbit;

// Configuration
const BACKEND_URL = 'http://localhost:5000/api/asteroids';
const NASA_API_KEY = 'smJ35jKybPdC9UI2o8HfPs1Ad5fv87z7tNhLzUGe';

// ============================================================================
// INITIALIZATION
// ============================================================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cosmic Watch Initializing...');
    
    // Check Three.js availability
    if (typeof THREE === 'undefined') {
        showError('Three.js failed to load. Please check your internet connection.');
        return;
    }
    
    // Initialize Three.js
    initThreeJS();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load initial demo data
    setTimeout(loadDemoData, 1500);
    
    console.log('✅ Cosmic Watch Frontend Ready');
});

// ============================================================================
// THREE.JS SCENE SETUP
// ============================================================================

function initThreeJS() {
    console.log('🛠️ Initializing 3D Scene...');
    
    try {
        // 1. Create Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 50, 300);
        
        // 2. Create Camera
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        camera.position.set(0, 5, 15);
        
        // 3. Create Renderer
        const canvas = document.getElementById('spaceScene');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 4. Add Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 5;
            controls.maxDistance = 100;
            controls.maxPolarAngle = Math.PI;
        }
        
        // 5. Add Lighting
        const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // 6. Create Space Elements
        createStars();
        createEarth();
        createMoon();
        
        // 7. Start Animation Loop
        animate();
        
        // 8. Handle Window Resize
        window.addEventListener('resize', onWindowResize);
        
        console.log('✅ 3D Scene Initialized');
        
    } catch (error) {
        console.error('❌ 3D Scene Error:', error);
        showError('3D Graphics Error: ' + error.message);
    }
}

function createStars() {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createEarth() {
    // Earth Group
    earthOrbit = new THREE.Group();
    scene.add(earthOrbit);
    
    // Create Earth
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Try to load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        specular: 0x222222,
        shininess: 5
    });
    
    textureLoader.load(
        'https://threejs.org/examples/textures/land_ocean_ice_cloud_1024.jpg',
        function(texture) {
            material.map = texture;
            material.needsUpdate = true;
        },
        undefined,
        function(error) {
            console.log('Earth texture failed, using fallback');
        }
    );
    
    earth = new THREE.Mesh(geometry, material);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earthOrbit.add(earth);
}

function createMoon() {
    // Moon Orbit Group
    moonOrbit = new THREE.Group();
    earth.add(moonOrbit);
    
    // Create Moon
    const geometry = new THREE.SphereGeometry(0.27, 16, 16);
    const material = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        specular: 0x222222,
        shininess: 5
    });
    
    moon = new THREE.Mesh(geometry, material);
    moon.position.x = 2;
    moon.castShadow = true;
    moon.receiveShadow = true;
    moonOrbit.add(moon);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    // Animate Earth and Moon
    if (earth) {
        earth.rotation.y += 0.002 * animationSpeed;
        earthOrbit.rotation.y += 0.001 * animationSpeed;
    }
    
    if (moonOrbit) {
        moonOrbit.rotation.y += 0.01 * animationSpeed;
    }
    
    // Animate Asteroids
    asteroidsThree.forEach(asteroid => {
        if (!asteroid.userData.paused) {
            asteroid.userData.angle += asteroid.userData.speed * animationSpeed;
        }
        
        asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.radius;
        asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.radius;
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.01;
    });
    
    // Update Controls
    if (controls) {
        controls.update();
    }
    
    // Render Scene
    renderer.render(scene, camera);
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

async function fetchLiveData() {
    console.log('📡 Fetching live asteroid data...');
    
    const asteroidList = document.getElementById('asteroidList');
    if (asteroidList) {
        asteroidList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-satellite"></i>
                <p>Fetching NASA data...</p>
                <div class="loading-spinner"></div>
            </div>
        `;
    }
    
    try {
        // Try local backend first
        let data;
        
        try {
            const response = await fetch(BACKEND_URL);
            if (response.ok) {
                data = await response.json();
                console.log('✅ Backend data received');
            } else {
                throw new Error('Backend failed');
            }
        } catch (backendError) {
            console.log('⚠️ Backend unavailable, using NASA API directly');
            data = await fetchNASAData();
        }
        
        // Process and display data
        processAsteroidData(data);
        showNotification('Live asteroid data loaded successfully!');
        
    } catch (error) {
        console.error('❌ Data fetch error:', error);
        
        if (asteroidList) {
            asteroidList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load live data</p>
                    <p class="hint">Loading demo data instead...</p>
                </div>
            `;
        }
        
        // Fallback to demo data
        setTimeout(loadDemoData, 1000);
    }
}

async function fetchNASAData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`NASA API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const asteroids = [];
        const nearEarthObjects = data.near_earth_objects || {};
        
        Object.values(nearEarthObjects).forEach(dayAsteroids => {
            dayAsteroids.forEach(asteroid => {
                const closeApproach = asteroid.close_approach_data?.[0];
                
                asteroids.push({
                    id: asteroid.id,
                    name: asteroid.name || `Asteroid ${asteroid.id}`,
                    diameter: (asteroid.estimated_diameter?.kilometers?.estimated_diameter_min + 
                              asteroid.estimated_diameter?.kilometers?.estimated_diameter_max) / 2,
                    velocity: closeApproach?.relative_velocity?.kilometers_per_hour || 30000,
                    missDistance: closeApproach?.miss_distance?.kilometers || 5000000,
                    hazardous: asteroid.is_potentially_hazardous_asteroid
                });
            });
        });
        
        return asteroids.slice(0, 15); // Limit to 15 asteroids
        
    } catch (error) {
        console.error('NASA API direct fetch failed:', error);
        throw error;
    }
}

function loadDemoData() {
    console.log('📊 Loading demo data...');
    
    const demoAsteroids = [
        { id: '1', name: 'Apophis (99942)', diameter: 0.34, velocity: 30000, missDistance: 31000, hazardous: true },
        { id: '2', name: 'Bennu (101955)', diameter: 0.49, velocity: 28000, missDistance: 75000, hazardous: true },
        { id: '3', name: '2023 DW', diameter: 0.05, velocity: 25000, missDistance: 1800000, hazardous: false },
        { id: '4', name: 'Didymos (65803)', diameter: 0.78, velocity: 21000, missDistance: 10700000, hazardous: false },
        { id: '5', name: 'Ryugu (162173)', diameter: 0.87, velocity: 32000, missDistance: 950000, hazardous: false },
        { id: '6', name: '2010 RF12', diameter: 0.007, velocity: 45000, missDistance: 79000, hazardous: false },
        { id: '7', name: '2012 TC4', diameter: 0.013, velocity: 28000, missDistance: 50000, hazardous: false },
        { id: '8', name: '2014 JO25', diameter: 0.65, velocity: 23000, missDistance: 1800000, hazardous: false }
    ];
    
    processAsteroidData(demoAsteroids);
    showNotification('Demo asteroid data loaded');
}

function processAsteroidData(asteroids) {
    console.log('🔄 Processing asteroid data...');
    
    // Clear existing asteroids
    clearAsteroids();
    
    // Store data
    asteroidData = asteroids;
    
    // Get DOM elements
    const asteroidList = document.getElementById('asteroidList');
    const selectAsteroid = document.getElementById('selectAsteroid');
    
    if (!asteroidList || !selectAsteroid) return;
    
    // Clear UI
    asteroidList.innerHTML = '';
    selectAsteroid.innerHTML = '<option value="">Select an Asteroid</option>';
    
    // Create 3D asteroids and UI
    asteroids.forEach((asteroid, index) => {
        // Create 3D asteroid
        const asteroid3D = createAsteroid3D(asteroid, index);
        
        // Create UI card
        createAsteroidCard(asteroid, asteroid3D);
        
        // Add to dropdown
        const option = document.createElement('option');
        option.value = asteroid.id;
        option.textContent = asteroid.name;
        selectAsteroid.appendChild(option);
    });
    
    // Update stats
    updateStats();
    
    console.log(`✅ Processed ${asteroids.length} asteroids`);
}

function createAsteroid3D(data, index) {
    const size = Math.min(data.diameter * 2, 1);
    const geometry = new THREE.IcosahedronGeometry(size, 1);
    
    // Make asteroid irregular
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const noise = 0.3;
        positions.setXYZ(
            i,
            x + (Math.random() - 0.5) * noise,
            y + (Math.random() - 0.5) * noise,
            z + (Math.random() - 0.5) * noise
        );
    }
    positions.needsUpdate = true;
    
    // Create material
    const material = new THREE.MeshPhongMaterial({
        color: data.hazardous ? 0xff5555 : 0x88aaff,
        specular: 0x222222,
        shininess: 30,
        emissive: data.hazardous ? 0x330000 : 0x000000,
        emissiveIntensity: data.hazardous ? 0.2 : 0
    });
    
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    // Calculate orbit radius
    const baseRadius = 8;
    const orbitRadius = baseRadius + (index * 1.5);
    
    // Store data
    asteroid.userData = {
        id: data.id,
        name: data.name,
        hazardous: data.hazardous,
        diameter: data.diameter,
        velocity: data.velocity,
        missDistance: data.missDistance,
        angle: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
        radius: orbitRadius,
        paused: false
    };
    
    // Position asteroid
    updateAsteroidPosition(asteroid);
    
    // Add to scene
    scene.add(asteroid);
    asteroidsThree.push(asteroid);
    
    return asteroid;
}

function createAsteroidCard(data, asteroid3D) {
    const asteroidList = document.getElementById('asteroidList');
    if (!asteroidList) return;
    
    const card = document.createElement('div');
    card.className = 'asteroid-card';
    card.dataset.id = data.id;
    
    card.innerHTML = `
        <div class="asteroid-header">
            <div class="asteroid-name">${data.name}</div>
            <div class="asteroid-status ${data.hazardous ? 'hazardous' : 'safe'}">
                ${data.hazardous ? 'HAZARDOUS' : 'SAFE'}
            </div>
        </div>
        <div class="asteroid-details">
            <div>
                <div class="detail-label">Diameter</div>
                <div class="detail-value">${data.diameter.toFixed(3)} km</div>
            </div>
            <div>
                <div class="detail-label">Velocity</div>
                <div class="detail-value">${data.velocity.toLocaleString()} km/h</div>
            </div>
            <div>
                <div class="detail-label">Distance</div>
                <div class="detail-value">${(data.missDistance / 1000000).toFixed(2)}M km</div>
            </div>
            <div>
                <div class="detail-label">Status</div>
                <div class="detail-value">${data.hazardous ? '⚠️ Threat' : '✓ Safe'}</div>
            </div>
        </div>
    `;
    
    // Add click event
    card.addEventListener('click', () => {
        selectAsteroid(data.id);
    });
    
    asteroidList.appendChild(card);
}

function updateAsteroidPosition(asteroid) {
    if (!asteroid.userData.paused) {
        asteroid.userData.angle += asteroid.userData.speed * animationSpeed;
    }
    
    const angle = asteroid.userData.angle;
    const radius = asteroid.userData.radius;
    
    asteroid.position.x = Math.cos(angle) * radius;
    asteroid.position.z = Math.sin(angle) * radius;
    asteroid.position.y = Math.sin(Date.now() * 0.001 + asteroid.userData.id * 100) * 2;
}

function clearAsteroids() {
    // Remove 3D asteroids
    asteroidsThree.forEach(asteroid => {
        scene.remove(asteroid);
    });
    
    asteroidsThree = [];
    asteroidData = [];
    selectedAsteroid = null;
}

function updateStats() {
    const total = asteroidData.length;
    const hazardous = asteroidData.filter(a => a.hazardous).length;
    const safe = total - hazardous;
    
    // Update UI
    const totalCount = document.getElementById('totalCount');
    const hazardCount = document.getElementById('hazardCount');
    const safeCount = document.getElementById('safeCount');
    
    if (totalCount) totalCount.textContent = total;
    if (hazardCount) hazardCount.textContent = hazardous;
    if (safeCount) safeCount.textContent = safe;
}

function selectAsteroid(id) {
    if (!asteroidsThree || asteroidsThree.length === 0) {
        console.warn('No asteroids available yet.');
        return;
    }

    // Ensure ID comparison works (number or string)
    const asteroid = asteroidsThree.find(a => a.userData.id == id);
    if (!asteroid) {
        console.warn('Asteroid not found for ID:', id);
        return;
    }

    // Deselect previously selected asteroid
    if (selectedAsteroid) {
        if (selectedAsteroid.material) {
            selectedAsteroid.material.emissiveIntensity = 0;
        }
        const prevCard = document.querySelector(`.asteroid-card[data-id="${selectedAsteroid.userData.id}"]`);
        if (prevCard) prevCard.classList.remove('selected');
    }

    // Select new asteroid
    selectedAsteroid = asteroid;
    if (asteroid.material) asteroid.material.emissiveIntensity = 0.5;

    // Update UI card highlight
    const card = document.querySelector(`.asteroid-card[data-id="${id}"]`);
    if (card) card.classList.add('selected');

    // Update dropdown value without triggering change event loop
    const selectElement = document.getElementById('selectAsteroid');
    if (selectElement && selectElement.value != id) {
        selectElement.value = id;
    }

    // Move camera smoothly
    if (camera && controls) {
        const target = asteroid.position.clone();
        const offset = new THREE.Vector3(0, 5, 10); // camera offset
        const newCameraPos = target.clone().add(offset);

        // Use a simple tween-like movement
        const duration = 500; // ms
        const start = performance.now();
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();

        function animateCamera(time) {
            const t = Math.min((time - start) / duration, 1);
            camera.position.lerpVectors(startPos, newCameraPos, t);
            controls.target.lerpVectors(startTarget, target, t);
            controls.update();

            if (t < 1) requestAnimationFrame(animateCamera);
        }
        requestAnimationFrame(animateCamera);
    }

    showNotification(`Tracking asteroid: ${asteroid.userData.name}`);
}


// ============================================================================
// UI FUNCTIONS
// ============================================================================

function enterSpace() {
    console.log('🚀 Entering space...');
    
    // Hide hero
    const hero = document.getElementById('hero');
    if (hero) {
        hero.classList.add('hidden');
    }
    
    // Show info panel
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) {
        infoPanel.classList.add('active');
    }
    
    // Try to play audio
    const audio = document.getElementById('spaceAudio');
    if (audio) {
        audio.play().then(() => {
            isAudioPlaying = true;
            const audioBtn = document.getElementById('audioBtn');
            if (audioBtn) {
                audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i> AUDIO OFF';
            }
        }).catch(error => {
            console.log('Audio play failed:', error);
        });
    }
    
    showNotification('Cosmic Watch activated!');
}

function showNotification(message) {
    console.log('📢 Notification:', message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 20, 40, 0.9);
        color: #3cf0ff;
        padding: 12px 24px;
        border-radius: 8px;
        border: 1px solid rgba(60, 240, 255, 0.3);
        font-family: 'Orbitron', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    console.error('❌ Error:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: rgba(255, 50, 50, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Orbitron', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        text-align: center;
    `;
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function initEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Fetch live data button
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchLiveData);
        console.log('✅ Fetch button ready');
    }
    
    // Demo data button
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', loadDemoData);
        console.log('✅ Demo button ready');
    }
    
    // Audio button
    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) {
        audioBtn.addEventListener('click', toggleAudio);
        console.log('✅ Audio button ready');
    }
    
    // Reset camera button
    const resetCamBtn = document.getElementById('resetCam');
    if (resetCamBtn) {
        resetCamBtn.addEventListener('click', resetCamera);
        console.log('✅ Reset camera button ready');
    }
    
    // Asteroid selection dropdown
    const selectAsteroid = document.getElementById('selectAsteroid');
    if (selectAsteroid) {
        selectAsteroid.addEventListener('change', (e) => {
            if (e.target.value) {
                selectAsteroid(e.target.value);
            }
        });
        console.log('✅ Asteroid dropdown ready');
    }
    
    // 3D scene click detection
    if (renderer) {
        renderer.domElement.addEventListener('click', (e) => {
            if (!camera) return;
            
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            const intersects = raycaster.intersectObjects(asteroidsThree);
            
            if (intersects.length > 0) {
                const asteroid = intersects[0].object;
                selectAsteroid(asteroid.userData.id);
                
                // Toggle pause
                asteroid.userData.paused = !asteroid.userData.paused;
                showNotification(
                    `${asteroid.userData.name} ${asteroid.userData.paused ? 'paused' : 'resumed'}`
                );
            }
        });
        console.log('✅ 3D click detection ready');
    }
    
    console.log('✅ All event listeners initialized');
}

function toggleAudio() {
    const audio = document.getElementById('spaceAudio');
    const audioBtn = document.getElementById('audioBtn');

    if (!audio || !audioBtn) return;

    if (isAudioPlaying) {
        audio.pause();
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i> AUDIO ON';
        isAudioPlaying = false;
    } else {
        audio.play().then(() => {
            audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i> AUDIO OFF';
            isAudioPlaying = true;
        }).catch(err => {
            console.log('Audio failed:', err);
        });
    }
}

function resetCamera() {
    if (!camera || !controls) return;

    camera.position.set(0, 5, 15);
    controls.target.set(0, 0, 0);
    controls.update();

    showNotification('Camera reset');
}


// ============================================================================
// GLOBAL EXPORTS & CLEANUP
// ============================================================================

// Make functions available globally
window.enterSpace = enterSpace;
window.selectAsteroid = selectAsteroid;

// Handle page cleanup
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Clean up Three.js resources
    if (scene) {
        scene.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
    
    if (renderer) {
        renderer.dispose();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError(event.error.message || 'Unknown error occurred');
});

console.log('🎉 Cosmic Watch Frontend Fully Loaded!');
function showRegister(){
  document.getElementById("loginPage").style.display="none";
  document.getElementById("registerPage").style.display="flex";
}

function showForgot(){
  document.getElementById("loginPage").style.display="none";
  document.getElementById("forgotPage").style.display="flex";
}

function backToLogin(){
  document.getElementById("registerPage").style.display="none";
  document.getElementById("forgotPage").style.display="none";
  document.getElementById("loginPage").style.display="flex";
}

function registerUser(){
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPassword").value;

  if(name && email && pass){
     alert("Account Created 🚀 (Demo only)");
     backToLogin();
  }else{
     alert("Fill all fields");
  }
}

function sendReset(){
  const email = document.getElementById("forgotEmail").value;

  if(email){
     alert("Reset link sent to " + email + " (Demo)");
     backToLogin();
  }else{
     alert("Enter email first");
  }
}
fetch("/api/forgot-password",{
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body: JSON.stringify({ email: email })
})
.then(res=>res.json())
.then(()=>{
   alert("Reset email sent 🚀");
})
.catch(()=>{
   alert("Email failed ❌");
});
