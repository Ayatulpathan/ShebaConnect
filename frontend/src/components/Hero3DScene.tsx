import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Hero3DSceneProps {
  className?: string;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion safely (with JSDOM / SSR guards)
    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    // In test / non-WebGL environments (like JSDOM), exit gracefully without crashing
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) return;
    } catch {
      return;
    }

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold all 3D objects
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Floating 3D Icosahedron (Brand Core)
    const coreGeometry = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // Wireframe cage around core
    const wireframeGeometry = new THREE.IcosahedronGeometry(4.2, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    group.add(wireframeMesh);

    // 2. Orbiting Service Spheres (Dhaka Zones & Categories)
    const orbitCount = 8;
    const orbitMeshes: THREE.Mesh[] = [];
    const orbitRadius = 9;
    const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const colors = [0x059669, 0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x14b8a6];

    for (let i = 0; i < orbitCount; i++) {
      const angle = (i / orbitCount) * Math.PI * 2;
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.3,
        metalness: 0.7,
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.x = Math.cos(angle) * orbitRadius;
      sphere.position.y = Math.sin(angle) * (orbitRadius * 0.45);
      sphere.position.z = Math.sin(angle) * (orbitRadius * 0.7);
      group.add(sphere);
      orbitMeshes.push(sphere);
    }

    // 3. Orbiting Rings
    const ringGeo = new THREE.TorusGeometry(orbitRadius, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.35;
    group.add(ringMesh);

    const ringGeo2 = new THREE.TorusGeometry(orbitRadius * 1.25, 0.03, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.15,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI * 0.25;
    ringMesh2.rotation.y = Math.PI * 0.2;
    group.add(ringMesh2);

    // 4. Floating 3D Star / Particle Constellation
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 50;
      particlePositions[i + 1] = (Math.random() - 0.5) * 35;
      particlePositions[i + 2] = (Math.random() - 0.5) * 35;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
    });
    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x10b981, 2, 50);
    pointLight.position.set(10, 10, 15);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0x3b82f6, 1.5, 50);
    backLight.position.set(-15, -10, -10);
    scene.add(backLight);

    // Mouse tracking for 3D parallax depth
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 0.8;
      targetY = (y / rect.height) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse damping (Lerp)
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        // Rotate scene with mouse
        group.rotation.y = mouseX * 0.8 + elapsedTime * 0.12;
        group.rotation.x = -mouseY * 0.5 + Math.sin(elapsedTime * 0.3) * 0.08;

        // Core pulse and spin
        coreMesh.rotation.y = elapsedTime * 0.25;
        coreMesh.rotation.x = elapsedTime * 0.15;
        wireframeMesh.rotation.y = -elapsedTime * 0.18;
        wireframeMesh.rotation.z = elapsedTime * 0.12;

        // Orbiting service nodes
        for (let i = 0; i < orbitCount; i++) {
          const sphere = orbitMeshes[i];
          if (sphere) {
            const angle = (i / orbitCount) * Math.PI * 2 + elapsedTime * 0.3;
            sphere.position.x = Math.cos(angle) * orbitRadius;
            sphere.position.y = Math.sin(angle) * (orbitRadius * 0.45) + Math.sin(elapsedTime * 1.5 + i) * 0.3;
            sphere.position.z = Math.sin(angle) * (orbitRadius * 0.7);
            sphere.rotation.y = elapsedTime;
          }
        }

        // Slow dust drifting
        particlePoints.rotation.y = -elapsedTime * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      coreGeometry.dispose();
      coreMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      sphereGeo.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
