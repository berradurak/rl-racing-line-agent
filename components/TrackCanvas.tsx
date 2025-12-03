import React, { useRef, useEffect } from 'react';
import { CarState, TrackConfig } from '../types';

interface TrackCanvasProps {
  car: CarState;
  track: TrackConfig;
  width: number;
  height: number;
}

export const TrackCanvas: React.FC<TrackCanvasProps> = ({ car, track, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a'; // Match bg
    ctx.fillRect(0, 0, width, height);

    // Transform logic (Center camera on car or fit track?)
    // Let's Center the Track in the middle of canvas for simplicity
    // Calculate track bounds to scale
    const padding = 50;
    const scaleX = (width - padding * 2) / 300; // Assuming track is roughly 300 units wide
    const scaleY = (height - padding * 2) / 200;
    const scale = Math.min(scaleX, scaleY);
    
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);

    // Draw Track Boundary
    // We only have centerline + width. We can draw a thick stroke.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Outer/Inner visual trick: Draw wide grey line, then narrower dark line
    ctx.beginPath();
    track.centerLine.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    // Draw Tarmac
    ctx.strokeStyle = '#334155'; // Slate 700
    ctx.lineWidth = track.width + 2; // Border
    ctx.stroke();

    ctx.strokeStyle = '#1e293b'; // Slate 800 (Track Surface)
    ctx.lineWidth = track.width;
    ctx.stroke();

    // Draw Centerline (dashed)
    ctx.beginPath();
    track.centerLine.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.heading);
    
    // Car Body
    ctx.fillStyle = '#3b82f6'; // Blue 500
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 10;
    ctx.fillRect(-6, -3, 12, 6); // simple box car

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, -2.5, 2, 2);
    ctx.fillRect(4, 0.5, 2, 2);

    ctx.restore();

    ctx.restore();
  }, [car, track, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded-xl border border-slate-700 shadow-lg" />;
};