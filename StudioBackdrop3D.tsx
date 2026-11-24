import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { IMG_STUDIO_LUXURY_BG } from '../data/catalog';

interface StudioBackdrop3DProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  prefersReducedMotion: boolean;
}

const _dummy = new THREE.Object3D();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createBrushedStoneRoughnessTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2a2d36';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i++) {
      const y = (i * 19) % 256;
      const alpha = 0.04 + ((i * 7) % 10) * 0.01;
      ctx.fillStyle = `rgba(210, 224, 245, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, y, 256, 1);
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, 254, 254);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export const StudioBackdrop3D: React.FC<StudioBackdrop3DProps> = ({
  pointerRef,
  prefersReducedMotion,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    const disposables: { dispose: () => void }[] = [];

    try {
      const isSoftwareGl = detectSoftwareGl();

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x06080e);
      scene.fog = new THREE.FogExp2(0x06080e, 0.042);

      const width = container.clientWidth || 960;
      const height = container.clientHeight || 620;

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
      camera.position.set(0, 1.55, 8.6);
      camera.lookAt(0, 0.75, 0);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(width, height);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglReady(false);
      };
      const handleContextRestored = () => {
        setWebglReady(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      // Mandatory PMREM studio environment reflection
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      pmrem.dispose();
      disposables.push(envTex);

      // 3-Point Warm/Cool Studio Light Rig
      const hemi = new THREE.HemisphereLight(0x8bb6ff, 0x090b10, 0.85);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfff4e8, 2.2);
      keyLight.position.set(5, 8, 6);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.left = -8;
        keyLight.shadow.camera.right = 8;
        keyLight.shadow.camera.top = 8;
        keyLight.shadow.camera.bottom = -8;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x3b82f6, 2.0);
      rimLight.position.set(-6, 4.5, -5);
      scene.add(rimLight);

      const cyanAccentLight = new THREE.PointLight(0x22d3ee, 4.5, 16, 1.6);
      cyanAccentLight.position.set(0, 3.2, 2.5);
      scene.add(cyanAccentLight);

      // Architectural Group
      const studioGroup = new THREE.Group();
      scene.add(studioGroup);

      const floorRoughTex = createBrushedStoneRoughnessTexture();
      floorRoughTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      disposables.push(floorRoughTex);

      const floorGeo = new THREE.PlaneGeometry(36, 36);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0b0e16,
        roughness: 0.24,
        metalness: 0.58,
        roughnessMap: floorRoughTex,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = -1.45;
      floorMesh.receiveShadow = !isSoftwareGl;
      studioGroup.add(floorMesh);
      disposables.push(floorGeo, floorMat);

      // Architectural Beveled Monolith Columns Framing the Luxury Gallery
      const pillarShape = new THREE.Shape();
      pillarShape.moveTo(-0.32, -0.32);
      pillarShape.lineTo(0.32, -0.32);
      pillarShape.lineTo(0.32, 0.32);
      pillarShape.lineTo(-0.32, 0.32);
      pillarShape.closePath();

      const pillarGeo = new THREE.ExtrudeGeometry(pillarShape, {
        steps: 1,
        depth: 7.4,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
      });
      pillarGeo.rotateX(Math.PI / 2);

      const pillarMat = new THREE.MeshPhysicalMaterial({
        color: 0x151923,
        roughness: 0.36,
        metalness: 0.72,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25,
      });
      disposables.push(pillarGeo, pillarMat);

      const pillarCoords: [number, number][] = [
        [-4.9, -2.2],
        [-3.3, -5.0],
        [3.3, -5.0],
        [4.9, -2.2],
      ];
      for (const [px, pz] of pillarCoords) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, 5.2, pz);
        studioGroup.add(pillar);
      }

      // Recessed Vertical Light Channels Along Architectural Bays
      const stripGeo = new THREE.BoxGeometry(0.055, 6.2, 0.06);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const stripWhiteMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
      disposables.push(stripGeo, stripMat, stripWhiteMat);

      const stripPositions: [number, number, boolean][] = [
        [-4.55, -2.0, true],
        [-2.95, -4.75, false],
        [2.95, -4.75, false],
        [4.55, -2.0, true],
      ];
      for (const [sx, sz, blue] of stripPositions) {
        const strip = new THREE.Mesh(stripGeo, blue ? stripMat : stripWhiteMat);
        strip.position.set(sx, 1.5, sz);
        studioGroup.add(strip);
      }

      // Overhead Diffused Studio Skylight Beam
      const ceilingBeamGeo = new THREE.BoxGeometry(7.6, 0.08, 0.35);
      const ceilingBeamMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
      disposables.push(ceilingBeamGeo, ceilingBeamMat);

      for (const bz of [-0.8, -3.2, -5.6]) {
        const beam = new THREE.Mesh(ceilingBeamGeo, ceilingBeamMat);
        beam.position.set(0, 4.35, bz);
        studioGroup.add(beam);
      }

      // Dual Sculpted Basalt & Brushed Titanium Pedestals for the Twin Hero Sneakers
      const createPedestal = (x: number, y: number, z: number, widthBox: number, depthBox: number) => {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const baseGeo = new THREE.BoxGeometry(widthBox, 0.42, depthBox);
        const baseMat = new THREE.MeshPhysicalMaterial({
          color: 0x10131c,
          roughness: 0.22,
          metalness: 0.78,
          clearcoat: 0.9,
          clearcoatRoughness: 0.14,
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.21;
        baseMesh.castShadow = !isSoftwareGl;
        baseMesh.receiveShadow = !isSoftwareGl;
        group.add(baseMesh);

        const trimGeo = new THREE.BoxGeometry(widthBox + 0.04, 0.04, depthBox + 0.04);
        const trimMat = new THREE.MeshPhysicalMaterial({
          color: 0xcbd5e1,
          roughness: 0.18,
          metalness: 0.95,
          anisotropy: 0.75,
        });
        const trimMesh = new THREE.Mesh(trimGeo, trimMat);
        trimMesh.position.y = 0.43;
        group.add(trimMesh);

        const glowGeo = new THREE.BoxGeometry(widthBox * 0.92, 0.02, depthBox * 0.92);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.y = 0.02;
        group.add(glowMesh);

        disposables.push(baseGeo, baseMat, trimGeo, trimMat, glowGeo, glowMat);
        studioGroup.add(group);
      };

      // Left-Rear Pedestal (Sneaker #2) + Right-Foreground Pedestal (Sneaker #1)
      createPedestal(-1.72, -1.43, -1.0, 2.4, 1.5);
      createPedestal(1.58, -1.43, 0.85, 2.7, 1.65);

      // Ambient Architectural Light Motes (InstancedMesh > 20 items)
      const moteCount = 36;
      const moteGeo = new THREE.SphereGeometry(0.022, 8, 8);
      const moteMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.55,
      });
      const motes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
      const moteSeeds = Array.from({ length: moteCount }, (_, i) => ({
        x: ((i % 9) - 4) * 1.15 + ((i * 17) % 10) * 0.06,
        y: -0.6 + ((i * 23) % 42) * 0.11,
        z: -4.2 + ((i * 13) % 35) * 0.16,
        speed: 0.3 + (i % 5) * 0.12,
        phase: i * 0.7,
      }));
      motes.frustumCulled = false;
      moteSeeds.forEach((s, i) => {
        _dummy.position.set(s.x, s.y, s.z);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        motes.setMatrixAt(i, _dummy.matrix);
      });
      motes.instanceMatrix.needsUpdate = true;
      motes.computeBoundingSphere();
      studioGroup.add(motes);
      disposables.push(moteGeo, moteMat);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
      setWebglReady(true);

      const clock = new THREE.Clock();

      function afterDraw(cb: () => void) {
        if (!renderer || disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
            if (status === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        } else {
          frameId = window.setTimeout(cb, 80);
        }
      }

      const tick = () => {
        if (disposed || !renderer || !scene) return;
        const dt = Math.min(clock.getDelta(), 0.1);
        const elapsed = clock.getElapsedTime();

        const targetX = prefersReducedMotion ? 0 : pointerRef.current.x * 0.65;
        const targetY = prefersReducedMotion ? 1.55 : 1.55 - pointerRef.current.y * 0.28;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 4.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4.5, dt);
        camera.lookAt(0, 0.65, -0.5);

        if (!prefersReducedMotion) {
          for (let i = 0; i < moteCount; i++) {
            const s = moteSeeds[i];
            _dummy.position.set(
              s.x + Math.sin(elapsed * s.speed + s.phase) * 0.16,
              s.y + Math.cos(elapsed * s.speed * 0.8 + s.phase) * 0.18,
              s.z
            );
            _dummy.scale.setScalar(0.8 + 0.35 * Math.sin(elapsed + s.phase));
            _dummy.updateMatrix();
            motes.setMatrixAt(i, _dummy.matrix);
          }
          motes.instanceMatrix.needsUpdate = true;
        }

        renderer.render(scene, camera);

        if (prefersReducedMotion) return;
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      const handleResize = () => {
        if (!container || !renderer) return;
        const nw = container.clientWidth || 960;
        const nh = container.clientHeight || 620;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', handleResize);

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        window.removeEventListener('resize', handleResize);
        if (renderer) {
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
          renderer.dispose();
        }
        for (const d of disposables) {
          d.dispose();
        }
      };
    } catch {
      setWebglReady(false);
    }
  }, [pointerRef, prefersReducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Architectural Studio Photography Fallback / Underlay */}
      <img
        src={IMG_STUDIO_LUXURY_BG}
        alt=""
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          webglReady ? 'opacity-25' : 'opacity-45'
        }`}
      />
      <div
        ref={mountRef}
        className={`absolute inset-0 transition-opacity duration-700 ${
          webglReady ? 'opacity-90' : 'opacity-0'
        }`}
      />
      {/* Measured atmospheric studio gradient scrim for contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 64% 48%, rgba(37,99,235,0.16), transparent 55%), linear-gradient(90deg, #06070B 0%, rgba(6,7,11,0.88) 38%, rgba(6,7,11,0.35) 68%, rgba(6,7,11,0.75) 100%), linear-gradient(180deg, rgba(6,7,11,0.65) 0%, transparent 25%, transparent 72%, #06070B 100%)',
        }}
      />
    </div>
  );
};
