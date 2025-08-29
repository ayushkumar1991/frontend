"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type TorusKnotUniforms = {
  uTime: { value: number };
  uColorA: { value: THREE.Color };
  uColorB: { value: THREE.Color };
  uTint: { value: THREE.Color };
  uGloss: { value: number };
  uMetal: { value: number };
  uLightDir: { value: THREE.Vector3 };
};

const TorusKnot3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = 200;
    const height = 200;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 260);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountNode.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(200, 220, 240);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-200, -120, 180);
    scene.add(dirLight2);

    // Geometry
    const geometry = new THREE.TorusKnotGeometry(70, 22, 320, 40, 2, 3);

    // Uniforms for shader
    const colorA = new THREE.Color("#b8c0ff");
    const colorB = new THREE.Color("#f5c6ff");
    const tint = new THREE.Color("#d9d9df");

    const uniforms: TorusKnotUniforms = {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uTint: { value: tint },
      uGloss: { value: 64.0 },
      uMetal: { value: 1.0 },
      uLightDir: { value: new THREE.Vector3(0.6, 0.7, 0.4).normalize() },
    };

    // Shader material with gradient metallic shader
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vPosW = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vNormalW;
        varying vec3 vPosW;

        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uTint;
        uniform float uGloss;
        uniform float uMetal;
        uniform vec3 uLightDir;

        void main() {
          float ct = cos(uTime * 0.15);
          float st = sin(uTime * 0.15);
          mat3 rotY = mat3(
            ct, 0.0, st,
            0.0, 1.0, 0.0,
            -st, 0.0, ct
          );
          vec3 n = normalize(rotY * normalize(vNormalW));

          float f = 0.5 * (n.y + 1.0);
          f = pow(f, 0.8);

          vec3 base = mix(uColorA, uColorB, f);

          vec3 L = normalize(uLightDir);
          vec3 V = normalize(-vPosW);
          vec3 H = normalize(L + V);

          float lambert = max(dot(n, L), 0.0);
          float spec = pow(max(dot(n, H), 0.0), uGloss) * (0.25 + 0.75 * lambert);

          vec3 color = mix(base, vec3(1.0), spec * uMetal);
          color = color * (uTint / 0.85);

          float fres = pow(1.0 - max(dot(n, V), 0.0), 2.0);
          color += fres * 0.08;

          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
    });

    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.set(0.6, 0.3, 0.1);
    scene.add(torus);

    // Animation loop
    const animate = () => {
      uniforms.uTime.value += 0.016;

      torus.rotation.y += 0.005;
      torus.rotation.x += 0.0025;

      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup on unmount
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
      }
      if (mountNode.firstChild) {
        mountNode.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: "8rem",
        height: "420px",
        zIndex: 1,
        opacity: 0.9,
        filter: "saturate(1.07) contrast(1.05)",
      }}
    />
  );
};

export default TorusKnot3D;
