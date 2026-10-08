/**
 * ============================================================================
 * GEOMATRIX - 3D ROTATING HOLOGRAPHIC GIS GLOBE
 * ============================================================================
 * Uses Three.js to render an interactive, rotating digital Earth sphere
 * with green matrix points, latitude/longitude wireframe, and glowing halo,
 * while the satellite radar scanline sweeps continuously across it.
 */

(function initRotatingGlobe() {
    // Reference the container and canvas elements
    const container = document.getElementById('globe-container');
    const canvas = document.getElementById('globe-canvas');

    if (!container || !canvas || typeof THREE === 'undefined') {
        // If Three.js is not loaded or container not found, keep fallback visible
        const fallback = document.getElementById('globe-fallback');
        if (fallback) fallback.style.display = 'block';
        return;
    }

    // 1. SCENE CREATION
    const scene = new THREE.Scene();

    // 2. CAMERA SETUP
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 245;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 2.42;

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,           // Transparent canvas background
        antialias: true,       // Smooth anti-aliased geometry edges
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. GLOBE GROUP (Contains all rotating sphere layers)
    const globeGroup = new THREE.Group();
    // Slight initial tilt for authentic Earth axial orientation (approx. 23.5 degrees)
    globeGroup.rotation.x = 0.26;
    globeGroup.rotation.z = -0.12;
    scene.add(globeGroup);

    // 5. TEXTURE LOADER
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'earth_digital.png',
        function (earthTexture) {
            earthTexture.wrapS = THREE.RepeatWrapping;
            earthTexture.wrapT = THREE.ClampToEdgeWrapping;

            // --- LAYER A: Inner Dark Core Sphere ---
            const coreGeo = new THREE.SphereGeometry(0.99, 48, 48);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x010501
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            globeGroup.add(coreMesh);

            // --- LAYER B: Glowing Green Digital Continent Texture ---
            const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
            const sphereMat = new THREE.MeshBasicMaterial({
                map: earthTexture,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending
            });
            const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
            globeGroup.add(earthMesh);

            // --- LAYER C: Outer Holographic Wireframe Grid ---
            const wireGeo = new THREE.SphereGeometry(1.012, 28, 28);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0xadf203,
                wireframe: true,
                transparent: true,
                opacity: 0.22
            });
            const wireMesh = new THREE.Mesh(wireGeo, wireMat);
            globeGroup.add(wireMesh);

            // --- LAYER D: Atmosphere Rim Glow (Outer Halo) ---
            const glowGeo = new THREE.SphereGeometry(1.08, 36, 36);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xadf203,
                transparent: true,
                opacity: 0.16,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            globeGroup.add(glowMesh);
        },
        undefined,
        function (err) {
            console.warn('Could not load earth_digital.png, falling back to static image:', err);
            const fallback = document.getElementById('globe-fallback');
            if (fallback) fallback.style.display = 'block';
            if (canvas) canvas.style.display = 'none';
        }
    );

    // 6. INTERACTIVE MOUSE ROTATION (Drag to rotate freely)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotateSpeed = 0.0035;

    container.addEventListener('mousedown', function (e) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', function () {
        isDragging = false;
    });

    window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;

        globeGroup.rotation.y += deltaX * 0.008;
        globeGroup.rotation.x += deltaY * 0.008;

        // Constrain vertical rotation to prevent disorienting flip
        globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroup.rotation.x));

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });

    // Touch support for mobile devices
    container.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            isDragging = true;
            prevMouseX = e.touches[0].clientX;
            prevMouseY = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', function () {
        isDragging = false;
    });

    window.addEventListener('touchmove', function (e) {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;

        globeGroup.rotation.y += deltaX * 0.008;
        globeGroup.rotation.x += deltaY * 0.008;
        globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroup.rotation.x));

        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
    }, { passive: true });

    // 7. RESPONSIVE RESIZING
    function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
    }
    window.addEventListener('resize', handleResize);

    // 8. ANIMATION LOOP (Smooth 60 FPS continuous rotation)
    function animate() {
        requestAnimationFrame(animate);

        // Continuous automatic rotation along the Y-axis (Earth's rotation)
        if (!isDragging) {
            globeGroup.rotation.y += autoRotateSpeed;
        }

        renderer.render(scene, camera);
    }
    animate();

})();
