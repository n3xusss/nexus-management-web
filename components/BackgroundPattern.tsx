'use client';

import { useState, useEffect } from 'react';

export default function BackgroundPattern() {
  const [particles, setParticles] = useState<Array<{top: string, left: string, animation: string, opacity: number}>>([]);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles = [...Array(12)].map((_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `drift-particle ${15 + Math.random() * 10}s ease-in-out ${Math.random() * 5}s infinite`,
      opacity: 0.6
    }));
    
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.08); }
          66% { transform: translate(35px, -15px) scale(0.92); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 30px) scale(0.97); }
          66% { transform: translate(-30px, -20px) scale(1.03); }
        }
        @keyframes drift-particle {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translate(100px, -100px); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; filter: blur(20px); }
          50% { opacity: 0.7; filter: blur(25px); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes trail-move {
          0% { transform: translateX(-100%) translateY(0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateX(200vw) translateY(-50px); opacity: 0; }
        }
        
        .blob-1 { animation: float-1 20s ease-in-out infinite; }
        .blob-2 { animation: float-2 25s ease-in-out infinite; }
        .blob-3 { animation: float-3 18s ease-in-out infinite; }
        .glow { animation: pulse-glow 4s ease-in-out infinite; }
        .gradient-bg { 
          animation: gradient-shift 15s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>

      {/* Animated gradient background layer */}
      <div className="gradient-bg absolute inset-0 bg-gradient-to-br from-[#2d5a45]/5 via-transparent to-[#7CFC9D]/5"></div>

      {/* Organic blob shapes with glassmorphism */}
      <div className="blob-1 absolute -top-32 -left-32 w-[500px] h-[500px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-br from-[#2d5a45]/20 to-[#2d5a45]/10 backdrop-blur-3xl border border-[#2d5a45]/30"></div>
      
      <div className="blob-2 absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-bl from-[#7CFC9D]/15 to-[#2d5a45]/10 backdrop-blur-3xl border border-[#2d5a45]/30"></div>
      
      <div className="blob-3 absolute -bottom-32 left-1/4 w-[450px] h-[450px] rounded-[70%_30%_50%_50%/30%_60%_40%_70%] bg-gradient-to-tr from-[#2d5a45]/20 to-transparent backdrop-blur-3xl border border-[#2d5a45]/30"></div>

      {/* Glowing accent orbs */}
      <div className="glow absolute top-[20%] left-[15%] w-32 h-32 bg-[#7CFC9D]/30 rounded-full" style={{animationDelay: '0s'}}></div>
      <div className="glow absolute top-[60%] right-[20%] w-40 h-40 bg-[#7CFC9D]/25 rounded-full" style={{animationDelay: '2s'}}></div>
      <div className="glow absolute bottom-[25%] left-[10%] w-24 h-24 bg-[#ff6b6b]/20 rounded-full" style={{animationDelay: '1s'}}></div>

      {/* Particle field - Only render after client-side generation */}
      {particles.length > 0 && particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#7CFC9D] rounded-full"
          style={particle}
        ></div>
      ))}

      {/* Floating geometric accents */}
      <div className="blob-1 absolute top-[25%] left-[12%] w-3 h-3 bg-[#7CFC9D] rounded-full shadow-[0_0_10px_#7CFC9D]"></div>
      <div className="blob-2 absolute top-[55%] right-[18%] w-2.5 h-2.5 bg-[#7CFC9D] rounded-full shadow-[0_0_8px_#7CFC9D]"></div>
      <div className="blob-3 absolute bottom-[30%] left-[8%] w-2 h-2 bg-[#ff6b6b] rotate-45 shadow-[0_0_8px_#ff6b6b]"></div>
      <div className="blob-1 absolute top-[40%] right-[12%] w-2 h-2 bg-[#ff6b6b] rotate-45 shadow-[0_0_8px_#ff6b6b]" style={{animationDelay: '3s'}}></div>

      {/* Light trails */}
      <div 
        className="absolute top-[15%] left-0 w-[200px] h-[2px] bg-gradient-to-r from-transparent via-[#7CFC9D]/40 to-transparent"
        style={{animation: 'trail-move 12s ease-in-out infinite'}}
      ></div>
      <div 
        className="absolute top-[65%] left-0 w-[250px] h-[1.5px] bg-gradient-to-r from-transparent via-[#ff6b6b]/30 to-transparent"
        style={{animation: 'trail-move 15s ease-in-out 3s infinite'}}
      ></div>

      {/* Rotating ring accents */}
      <div 
        className="absolute top-[30%] right-[25%] w-20 h-20 border border-[#2d5a45]/40 rounded-full"
        style={{animation: 'rotate-slow 30s linear infinite'}}
      >
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#7CFC9D] rounded-full -translate-x-1/2"></div>
      </div>

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>
    </div>
  );
}