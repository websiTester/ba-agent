'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface RingParticle {
  angle: number;
  radius: number;
  z: number;
  opacity: number;
  size: number;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  // Neural network particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let ringParticles: RingParticle[] = [];
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      ringParticles = [];
      
      // Network particles
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }

      // Ring particles (vertical ellipse on left side)
      const ringCount = 120;
      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2;
        ringParticles.push({
          angle,
          radius: 180,
          z: Math.cos(angle) * 60,
          opacity: Math.random() * 0.8 + 0.2,
          size: Math.random() * 2.5 + 1,
        });
      }
    };

    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      const connectionDistance = 150;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(100, 180, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(180, 130, 255, ${opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(100, 180, 255, ${opacity})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const drawRing = (ctx: CanvasRenderingContext2D) => {
      const centerX = canvas.width * 0.28;
      const centerY = canvas.height * 0.5;

      // Draw ring particles
      ringParticles.forEach((p, index) => {
        const currentAngle = p.angle + time * 0.3;
        const x = centerX + Math.sin(currentAngle) * p.radius;
        const y = centerY + Math.cos(currentAngle) * p.radius * 1.3;
        const z = Math.cos(currentAngle) * 60;
        
        const depthOpacity = (z + 60) / 120;
        const finalOpacity = p.opacity * depthOpacity * (0.7 + Math.sin(time * 2 + index * 0.1) * 0.3);
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 8);
        glowGradient.addColorStop(0, `rgba(100, 180, 255, ${finalOpacity * 0.5})`);
        glowGradient.addColorStop(0.5, `rgba(130, 160, 255, ${finalOpacity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, p.size * 8, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 255, ${finalOpacity})`;
        ctx.fill();
      });
    };

    const drawLightRays = (ctx: CanvasRenderingContext2D) => {
      const centerX = canvas.width * 0.35;
      const centerY = canvas.height * 0.5;
      
      const rayCount = 50;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 0.6 - Math.PI * 0.3;
        const length = 300 + Math.random() * 400;
        const spread = Math.sin(time * 0.5 + i * 0.3) * 0.1;
        
        const endX = centerX + Math.cos(angle + spread) * length;
        const endY = centerY + Math.sin(angle + spread) * length * 0.3;
        
        const gradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
        const rayOpacity = 0.02 + Math.sin(time + i * 0.5) * 0.01;
        gradient.addColorStop(0, `rgba(100, 180, 255, ${rayOpacity})`);
        gradient.addColorStop(0.5, `rgba(180, 130, 255, ${rayOpacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        
        // Create dotted/particle ray effect
        const segments = 30;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const x = centerX + (endX - centerX) * t;
          const y = centerY + (endY - centerY) * t;
          
          if (s % 2 === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.moveTo(x, y);
          }
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.opacity = 0.3 + Math.sin(time * p.pulseSpeed * 10 + p.pulseOffset) * 0.2;
      });

      // Draw light rays first (background)
      drawLightRays(ctx);
      
      // Draw connections
      drawConnections(ctx);

      // Draw ring
      drawRing(ctx);

      // Draw particles
      particles.forEach(p => {
        // Glow
        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
        glowGradient.addColorStop(0, `rgba(100, 180, 255, ${p.opacity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${p.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const clearError = () => {
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push('/login');
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 25%, #1a0d35 50%, #251445 75%, #1a0a2e 100%)',
        }}
      />
      
      {/* Radial glow effects */}
      <div 
        className="absolute"
        style={{
          top: '30%',
          left: '20%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(100, 80, 200, 0.15) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      <div 
        className="absolute"
        style={{
          top: '50%',
          left: '40%',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(60, 130, 255, 0.1) 0%, transparent 60%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Logo */}
      <div className="absolute top-6 right-8 z-20">
        <div 
          className="px-6 py-2 rounded-full text-white font-semibold text-sm tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #e84393 0%, #d63384 100%)',
            boxShadow: '0 4px 20px rgba(232, 67, 147, 0.4)',
          }}
        >
          BA Agent
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - AI Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          <div className="text-center px-12">
            {/* AI Text with glow */}
            <div className="relative mb-8">
              <h1 
                className="text-[120px] font-bold tracking-wider"
                style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: `
                    0 0 40px rgba(100, 180, 255, 0.8),
                    0 0 80px rgba(100, 150, 255, 0.5),
                    0 0 120px rgba(130, 100, 255, 0.3)
                  `,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                AI
              </h1>
            </div>
            
            <p 
              className="text-lg tracking-[0.3em] uppercase mb-4"
              style={{ color: 'rgba(200, 210, 255, 0.7)' }}
            >
              Artificial Intelligence
            </p>
            
            <h2 
              className="text-4xl font-bold mb-8"
              style={{
                background: 'linear-gradient(90deg, #fff 0%, #a5b4fc 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Business Analysis<br />Assistant
            </h2>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div 
            className="w-full max-w-md p-10 rounded-3xl"
            style={{
              background: 'rgba(25, 15, 45, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(100, 130, 255, 0.15)',
              boxShadow: `
                0 0 60px rgba(100, 80, 200, 0.15),
                inset 0 0 60px rgba(100, 130, 255, 0.03)
              `,
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <h1 
                className="text-5xl font-bold"
                style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: '0 0 30px rgba(100, 180, 255, 0.6)',
                }}
              >
                AI
              </h1>
              <p className="text-sm text-purple-300 mt-2 tracking-wider">
                Business Analysis Assistant
              </p>
            </div>

            <h2 
              className="text-2xl font-semibold mb-2 text-center"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              Create Account
            </h2>
            <p 
              className="text-center mb-8"
              style={{ color: 'rgba(180, 190, 220, 0.7)' }}
            >
              Join BA Agent to get started
            </p>

            {/* Error message */}
            {error && (
              <div 
                className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-shake"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)',
                }}
              >
                <svg 
                  className="w-5 h-5 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  style={{ color: '#f87171' }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span 
                  className="text-sm"
                  style={{ color: '#fca5a5' }}
                >
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(180, 190, 220, 0.9)' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError();
                    }}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(30, 20, 50, 0.6)',
                      border: '1px solid rgba(100, 130, 255, 0.2)',
                      boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(100, 150, 255, 0.5)';
                      e.target.style.boxShadow = '0 0 20px rgba(100, 130, 255, 0.2), inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                      e.target.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(180, 190, 220, 0.9)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(30, 20, 50, 0.6)',
                      border: '1px solid rgba(100, 130, 255, 0.2)',
                      boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(100, 150, 255, 0.5)';
                      e.target.style.boxShadow = '0 0 20px rgba(100, 130, 255, 0.2), inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                      e.target.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                  />
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(180, 190, 220, 0.9)' }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError();
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(30, 20, 50, 0.6)',
                      border: password && confirmPassword && password !== confirmPassword 
                        ? '1px solid rgba(239, 68, 68, 0.5)' 
                        : '1px solid rgba(100, 130, 255, 0.2)',
                      boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(100, 150, 255, 0.5)';
                      e.target.style.boxShadow = '0 0 20px rgba(100, 130, 255, 0.2), inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      if (password && confirmPassword && password !== confirmPassword) {
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      } else {
                        e.target.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                      }
                      e.target.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.2)';
                    }}
                  />
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p 
                    className="mt-1.5 text-xs flex items-center gap-1"
                    style={{ color: '#f87171' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Mật khẩu không khớp
                  </p>
                )}
                {password && confirmPassword && password === confirmPassword && (
                  <p 
                    className="mt-1.5 text-xs flex items-center gap-1"
                    style={{ color: '#34d399' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  boxShadow: '0 4px 25px rgba(139, 92, 246, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 35px rgba(139, 92, 246, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 25px rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 130, 255, 0.2)' }} />
              <span className="px-4 text-sm" style={{ color: 'rgba(150, 160, 200, 0.6)' }}>
                or sign up with
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 130, 255, 0.2)' }} />
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center py-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'rgba(30, 20, 50, 0.6)',
                  border: '1px solid rgba(100, 130, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(100, 150, 255, 0.4)';
                  e.currentTarget.style.background = 'rgba(40, 30, 60, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(30, 20, 50, 0.6)';
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2 text-sm" style={{ color: 'rgba(200, 210, 230, 0.9)' }}>
                  Google
                </span>
              </button>
              
              <button
                type="button"
                className="flex items-center justify-center py-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'rgba(30, 20, 50, 0.6)',
                  border: '1px solid rgba(100, 130, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(100, 150, 255, 0.4)';
                  e.currentTarget.style.background = 'rgba(40, 30, 60, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(30, 20, 50, 0.6)';
                }}
              >
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="ml-2 text-sm" style={{ color: 'rgba(200, 210, 230, 0.9)' }}>
                  GitHub
                </span>
              </button>
            </div>

            {/* Sign in link */}
            <p className="text-center mt-8" style={{ color: 'rgba(150, 160, 200, 0.7)' }}>
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-semibold transition-colors duration-200"
                style={{ color: 'rgba(160, 180, 255, 1)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(200, 210, 255, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 180, 255, 1)'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

