"use client";
import React, { useEffect, useRef } from 'react';

type Props = { className?: string };

export default function SpatialEnvironment({ className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        // Dynamic import of three to keep bundle size low and work with SSR
        const THREE = await import('three');
        if (!mounted || !containerRef.current) return;

        const { Scene, PerspectiveCamera, WebGLRenderer, Color, FogExp2, AmbientLight, DirectionalLight, BoxGeometry, MeshLambertMaterial, Mesh, Group } = THREE as any;

        const scene = new Scene();
        scene.background = new Color(0x87ceeb); // sky-blue
        scene.fog = new FogExp2(0x87ceeb, 0.002);

        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 600;

        const camera = new PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 2, 5);

        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        containerRef.current.appendChild(renderer.domElement);

        const ambient = new AmbientLight(0xffffff, 0.6);
        scene.add(ambient);

        const dir = new DirectionalLight(0xffffff, 0.8);
        dir.position.set(5, 10, 7.5);
        scene.add(dir);

        // Lightweight LOD placeholders
        const lodGroup = new Group();
        const geom = new BoxGeometry(1, 1, 1);
        const nearMat = new MeshLambertMaterial({ color: 0xff6b6b });
        const midMat = new MeshLambertMaterial({ color: 0x6bff9a });
        const farMat = new MeshLambertMaterial({ color: 0x6ba6ff });

        const near = new Mesh(geom, nearMat); near.position.set(0, 0.5, 0);
        const mid = new Mesh(geom, midMat); mid.position.set(5, 0.5, 0); mid.scale.set(0.75, 0.75, 0.75);
        const far = new Mesh(geom, farMat); far.position.set(10, 0.5, 0); far.scale.set(0.5, 0.5, 0.5);

        lodGroup.add(near, mid, far);
        scene.add(lodGroup);

        let rafId: number;
        function animate() {
          if (!mounted) return;
          rafId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();

        function onResize() {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }

        window.addEventListener('resize', onResize);

        cleanup = () => {
          mounted = false;
          window.removeEventListener('resize', onResize);
          if (rafId) cancelAnimationFrame(rafId);
          try { renderer.dispose(); } catch (e) {}
          try { containerRef.current && containerRef.current.removeChild(renderer.domElement); } catch (e) {}
        };
      } catch (e) {
        // If three is not available or initialization fails, keep a graceful DOM placeholder
        // This ensures the component is production-safe and SSR-friendly.
      }
    }

    init();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      data-testid="spatial-environment"
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative', background: 'linear-gradient(#87ceeb, #ffffff)' }}
    >
      <div style={{ position: 'absolute', left: 8, top: 8, color: '#222', fontSize: 12, background: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: 4 }}>
        Spatial Environment
      </div>
    </div>
  );
}
