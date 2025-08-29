"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Dna,
  Brain,
  Shield,
  Zap,
  Globe,
  Search,
  BarChart3,
  Cpu,
  Twitter,
  Github,
  Linkedin,
  Mail,
  BookOpen,
} from "lucide-react";
import TorusKnot3D from "../components/TorusKnot3D";
import Link from "next/link";

// ------------------ 3D DNA HELIX ANIMATION ------------------
const DNAHelix: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 300;

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const radius = 60;
      const helixHeight = 250;
      const turns = 3;

      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        ctx.strokeStyle = strand === 0 ? "#3b82f6" : "#8b5cf6";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = strand === 0 ? "#3b82f6" : "#8b5cf6";

        for (let i = 0; i < helixHeight; i += 2) {
          const angle =
            (i / helixHeight) * turns * Math.PI * 2 + time + strand * Math.PI;
          const x = centerX + Math.cos(angle) * radius;
          const y = i + 25;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          // Add base pairs
          if (i % 20 === 0) {
            const oppositeAngle = angle + Math.PI;
            const oppositeX = centerX + Math.cos(oppositeAngle) * radius;

            ctx.save();
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#10b981";
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(oppositeX, y);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.stroke();
      }

      time += 0.02;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute top-20 right-10 opacity-30 pointer-events-none">
      <canvas ref={canvasRef} className="transform rotate-12" />
    </div>
  );
};

// ------------------ FLOATING PARTICLES ------------------
const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color:
          ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][
            Math.floor(Math.random() * 4)
          ] ?? "#3b82f6",
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.save();
              ctx.globalAlpha = ((100 - distance) / 100) * 0.1;
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

// ------------------ 3D DNA SEQUENCE WITH DEPTH ------------------
const bases = ["A", "T", "G", "C"];

const DNASequence3D: React.FC = () => {
  const [sequence, setSequence] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const baseColors: Record<string, string> = {
    A: "text-red-400",
    T: "text-blue-400",
    G: "text-green-400",
    C: "text-yellow-400",
  };

  useEffect(() => {
    const generateSequence = () => {
      let newSequence = "";
      for (let i = 0; i < 60; i++) {
        newSequence += bases[Math.floor(Math.random() * bases.length)];
      }
      setSequence(newSequence);
    };

    generateSequence();
    const interval = setInterval(generateSequence, 4000);

    const highlightInterval = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % 60);
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(highlightInterval);
    };
  }, []);

  return (
    <div className="relative mb-8 p-6 bg-black/40 rounded-xl border border-gray-700/50 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-green-600/5 animate-pulse" />
      <div className="relative font-mono text-base tracking-wider flex flex-wrap justify-center gap-1">
        {sequence.split("").map((base, index) => (
          <span
            key={index}
            className={`
              inline-block transition-all duration-300 transform
              ${baseColors[base]} 
              ${
                highlightIndex === index
                  ? "scale-125 text-white shadow-lg animate-pulse"
                  : "hover:scale-110"
              }
            `}
            style={{
              transform: `translateZ(${
                highlightIndex === index ? "20px" : "0"
              })`,
              textShadow:
                highlightIndex === index
                  ? "0 0 20px currentColor"
                  : "0 0 10px currentColor",
            }}
          >
            {base}
          </span>
        ))}
      </div>
    </div>
  );
};

// ------------------ 3D FLOATING DNA STRANDS ------------------
interface FloatingDNAStrand3DProps {
  delay?: number;
  position?: "left" | "right";
}
const FloatingDNAStrand3D: React.FC<FloatingDNAStrand3DProps> = ({
  delay = 0,
  position = "left",
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed ${
        position === "left" ? "left-10" : "right-10"
      } top-1/2 opacity-20 pointer-events-none z-10`}
      style={{
        animation: `float3d 10s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transform: `translateY(-50%) rotateY(${rotation}deg) rotateX(${
          Math.sin(rotation * 0.02) * 20
        }deg)`,
      }}
    >
      <Dna size={40} className="text-blue-400 drop-shadow-lg" />
    </div>
  );
};

// ------------------ ENHANCED FEATURE CARD WITH 3D EFFECTS ------------------
interface FeatureCard3DProps {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  accent?: "blue" | "purple" | "green" | "orange";
}
const FeatureCard3D: React.FC<FeatureCard3DProps> = ({
  icon: Icon,
  title,
  description,
  accent = "blue",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const accentColors: Record<string, string> = {
    blue: "from-blue-600/20 to-cyan-600/20 border-blue-500/30 hover:border-blue-400/60",
    purple: "from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400/60",
    green: "from-green-600/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/60",
    orange: "from-orange-600/20 to-red-600/20 border-orange-500/30 hover:border-orange-400/60",
  };

  return (
    <div
      className={`
        p-6 rounded-xl bg-gradient-to-br ${accentColors[accent]} 
        border backdrop-blur-sm transition-all duration-500 
        hover:scale-105 hover:shadow-2xl group cursor-pointer
        transform-gpu perspective-1000
      `}
      style={{
        transform: isHovered
          ? "translateY(-10px) rotateX(5deg) rotateY(5deg)"
          : "translateY(0) rotateX(0) rotateY(0)",
        boxShadow: isHovered
          ? `0 25px 50px -12px ${
              accent === "blue"
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(139, 92, 246, 0.3)"
            }`
          : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="p-3 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-300"
          style={{
            transform: isHovered ? "rotateY(360deg)" : "rotateY(0deg)",
          }}
        >
          <Icon size={24} className="text-white drop-shadow-lg" />
        </div>
        <h3 className="font-semibold text-white text-lg">{title}</h3>
      </div>
      <p className="text-gray-300 leading-relaxed">{description}</p>

      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      </div>
    </div>
  );
};

// ------------------ 3D STAT CARD ------------------
interface StatCard3DProps {
  number: string;
  label: string;
  accent?: "blue" | "purple" | "green" | "orange";
}
const StatCard3D: React.FC<StatCard3DProps> = ({
  number,
  label,
  accent = "blue",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const accentColors: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    orange: "text-orange-400",
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        text-center p-6 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10
        hover:bg-black/40 transition-all duration-500 transform hover:scale-105
        ${isVisible ? "animate-bounce-in" : "opacity-0"}
      `}
    >
      <div
        className={`text-4xl font-bold ${accentColors[accent]} mb-2 drop-shadow-lg`}
      >
        {number}
      </div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
};

// ------------------ ENHANCED HEADER WITH 3D LOGO ------------------
const Header3D: React.FC = () => {
  const [logoRotation, setLogoRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoRotation((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-slate-900/70 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div
            style={{
              transform: `rotateY(${logoRotation}deg) rotateX(${Math.sin(
                logoRotation * 0.1
              ) * 10}deg)`,
            }}
          >
            <Dna size={32} className="text-blue-400 drop-shadow-lg" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            GenovaAI
          </span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm">
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition-colors hover:scale-105 transform"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition-colors hover:scale-105 transform"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-gray-300 hover:text-white transition-colors hover:scale-105 transform"
          >
            About
          </a>
        </nav>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Go to Dashboard
        </a>
      </div>
    </header>
  );
};

// ------------------ ENHANCED FOOTER ------------------
const Footer3D: React.FC = () => (
  <footer className="relative mt-20 overflow-hidden bg-slate-900/90 backdrop-blur-xl border-t border-white/15">
    {/* Background layers */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_400px_at_10%_10%,rgba(125,201,255,0.10),transparent),radial-gradient(900px_480px_at_90%_80%,rgba(232,144,83,0.10),transparent)]" />
    <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background:linear-gradient(to_right,transparent,rgba(255,255,255,0.12),transparent)] [background-size:6px_100%] animate-[gridShift_8s_linear_infinite]" />
    <style jsx>{`
      @keyframes gridShift {
        0% {
          background-position: 0 0;
        }
        100% {
          background-position: 100% 0;
        }
      }
    `}</style>

    {/* Content */}
    <div className="relative container mx-auto grid gap-10 px-6 py-12 text-sm text-gray-300 md:grid-cols-4">
      {/* Brand + description */}
      <div className="md:col-span-2">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-amber-400 ring-1 ring-white/20 shadow-[0_0_20px_rgba(125,201,255,0.35)]" />
          <span className="text-xl font-bold text-white">GenovaAI</span>
        </div>
        <p className="max-w-prose leading-relaxed text-gray-400">
          AI-powered DNA variant analysis to accelerate research and clinical
          decisions.
        </p>

        {/* Socials */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="https://twitter.com/GenovaAI"
            aria-label="GenovaAI on X/Twitter"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Twitter className="h-4 w-4 text-slate-200 group-hover:text-white" />
          </a>
          <a
            href="https://github.com/ayushkumar1991"
            aria-label="GenovaAI on GitHub"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Github className="h-4 w-4 text-slate-200 group-hover:text-white" />
          </a>
          <a
            href="https://linkedin.com/in/ayush-kumar-607444242"
            aria-label="GenovaAI on LinkedIn"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Linkedin className="h-4 w-4 text-slate-200 group-hover:text-white" />
          </a>
          <a
            href="mailto:ayushwork003@gmail.com"
            className="group inline-flex items-center gap-2 rounded-md bg-white/5 px-3 h-9 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Mail className="h-4 w-4 text-slate-200" />
            <span className="text-slate-200 group-hover:text-white">Contact</span>
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
        <ul className="space-y-3">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              Home <Cpu className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </li>
          <li>
            <a
              href="#features"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              Features <BookOpen className="h-3.5 w-3.5 opacity-60" />
            </a>
          </li>
          <li>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              Dashboard <Shield className="h-3.5 w-3.5 opacity-60" />
            </a>
          </li>
        </ul>
      </div>

      {/* Contact + Newsletter */}
      <div>
        <h4 className="mb-4 font-semibold text-white">Contact</h4>
        <p className="text-gray-400">Email: ayushwork003@gmail.com</p>
        <p className="text-gray-400">Twitter: @GenovaAI</p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-5 rounded-lg border border-white/10 bg-white/5 p-2.5 transition focus-within:border-white/20"
        >
          <label htmlFor="newsletter" className="sr-only">
            Subscribe for updates
          </label>
          <div className="flex items-center gap-2">
            <input
              id="newsletter"
              type="email"
              placeholder="Work email"
              className="w-full rounded-md bg-transparent px-3 py-2.5 text-slate-200 placeholder:text-slate-400 outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-gradient-to-br from-sky-400 to-amber-400 px-3.5 py-2 text-[13px] font-semibold text-slate-900 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white/60"
            >
              Subscribe
            </button>
          </div>
          <p className="mt-1 px-1 text-[11px] text-slate-400">
            Updates on features, research notes, and releases. No spam.
          </p>
        </form>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="relative border-t border-white/10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-gray-400 md:flex-row">
        <p>© {new Date().getFullYear()} GenovaAI. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="transition hover:text-white">
            Privacy
          </a>
          <a href="/terms" className="transition hover:text-white">
            Terms
          </a>
          <span className="text-white/20">|</span>
          <span className="text-gray-400">v1.0.0</span>
        </div>
      </div>
    </div>
  </footer>
);

// ------------------ MAIN LANDING PAGE WITH 3D EFFECTS ------------------
export default function DNAHeroPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white overflow-hidden relative">
      <ParticleSystem />
      <Header3D />

      {/* 3D Floating Elements */}
      <FloatingDNAStrand3D delay={0} position="left" />
      <FloatingDNAStrand3D delay={3} position="right" />
      <DNAHelix />

      {/* Metallic Torus Knot behind the hero heading */}
      <div className="absolute left-0 right-0" style={{ zIndex: 5 }}>
        <TorusKnot3D />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-44 pb-32">
        <div className="text-center max-w-6xl mx-auto">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-300 mb-10 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Cpu size={18} className="animate-spin-slow" />
            <span>Powered by Evo2 Large Language Model</span>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight animate-fade-in-up relative">
            AI-Powered DNA
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Variant Analysis
            </span>
          </h1>

          {/* Enhanced Subtitle */}
          <p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Predict the pathogenicity of genetic mutations with state-of-the-art
            machine learning
          </p>

          {/* 3D DNA Sequence */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <DNASequence3D />
          </div>

          {/* Enhanced CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <a
              href="/dashboard"
              className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl flex items-center gap-3 group"
            >
              <span>Start Analysis</span>
              <ChevronRight
                size={22}
                className="group-hover:translate-x-2 transition-transform duration-300"
              />
            </a>
            <button className="px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
              View Demo
            </button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <StatCard3D number="99.2%" label="Accuracy" accent="blue" />
            <StatCard3D number="<1s" label="Analysis Time" accent="purple" />
            <StatCard3D number="H100" label="GPU Powered" accent="green" />
            <StatCard3D number="24/7" label="Available" accent="orange" />
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div
        id="features"
        className="relative z-10 container mx-auto px-6 pb-32"
      >
        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Comprehensive Genetic Analysis Suite
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Everything you need to analyze genetic variants and predict their
            clinical significance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <FeatureCard3D
            icon={Brain}
            title="AI-Powered Predictions"
            description="Advanced Evo2 model analyzes mutations with state-of-the-art accuracy for pathogenicity prediction"
            accent="blue"
          />
          <FeatureCard3D
            icon={Shield}
            title="ClinVar Integration"
            description="Compare AI predictions against established clinical classifications from the ClinVar database"
            accent="purple"
          />
          <FeatureCard3D
            icon={Search}
            title="Gene Explorer"
            description="Browse chromosomes, search specific genes like BRCA1, and explore reference genome sequences"
            accent="green"
          />
          <FeatureCard3D
            icon={Globe}
            title="Multiple Assemblies"
            description="Support for different genome assemblies including hg38 with comprehensive coverage"
            accent="orange"
          />
          <FeatureCard3D
            icon={Zap}
            title="GPU Acceleration"
            description="Lightning-fast analysis powered by H100 GPUs deployed on Modal's serverless infrastructure"
            accent="blue"
          />
          <FeatureCard3D
            icon={BarChart3}
            title="Confidence Scoring"
            description="Get detailed confidence estimates for each prediction with comprehensive analysis metrics"
            accent="purple"
          />
        </div>
      </div>

      <Footer3D />

      <style jsx>{`
        @keyframes float3d {
          0%,
          100% {
            transform: translateY(-50%) translateZ(0) rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: translateY(-60%) translateZ(20px) rotateY(90deg) rotateX(10deg);
          }
          50% {
            transform: translateY(-40%) translateZ(-10px) rotateY(180deg) rotateX(-5deg);
          }
          75% {
            transform: translateY(-70%) translateZ(15px) rotateY(270deg) rotateX(15deg);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 1s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}