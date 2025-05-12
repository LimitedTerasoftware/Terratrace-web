import React, { useEffect, useRef, useState } from 'react';

interface ChartData {
  name: string;
  Pending: number;
  Accepted: number;
  Rejected: number;
}

interface Props {
  data: ChartData[];
  timeFrame: '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
}

interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
}

const SurveyProgressChart: React.FC<Props> = ({ data, timeFrame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);

  

  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      drawChart(ctx, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [data, timeFrame]);
  
  const generateTimeLabels = (timeFrame: string, count: number): string[] => {
    const today = new Date();
    const labels: string[] = [];
    
    if (timeFrame === '1W') {
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (timeFrame === '1M') {
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        labels.push(`Week ${Math.floor(i + 1)}`);
      }
    } else {
      // Default labels for other time frames
      for (let i = 0; i < count; i++) {
        labels.push(`Point ${i + 1}`);
      }
    }
    
    return labels;
  };
  
  const drawChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Clear canvas and points
    ctx.clearRect(0, 0, width, height);
    pointsRef.current = [];
    
    const dataPoints = timeFrame === '1W' ? 7 : 4;
    const xLabels = generateTimeLabels(timeFrame, dataPoints);
    
    const values = Array.from({ length: dataPoints }, () => 
      Math.floor(Math.random() * 60) + 40
    );
    
    // Add a vertical marker around the 3M point (to match image)
    const markerPosition = width * 0.3;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw vertical marker
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1;
    ctx.moveTo(markerPosition, 10);
    ctx.lineTo(markerPosition, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add date on top of the marker
    ctx.font = '10px Arial';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText('Nov 10, 2025', markerPosition, 20);
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'right';
    const yLabels = [0, 30, 60, 90, 120];
    yLabels.forEach(label => {
      const y = height - padding.bottom - ((label / 120) * chartHeight);
      ctx.fillText(label.toString(), padding.left - 5, y + 4);
    });
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    xLabels.forEach((label, i) => {
      const x = padding.left + ((i / (dataPoints - 1)) * chartWidth);
      ctx.fillText(label, x, height - padding.bottom + 20);
    });
    
    // Store points for tooltip detection
    values.forEach((value, i) => {
      const x = padding.left + ((i / (dataPoints - 1)) * chartWidth);
      const y = height - padding.bottom - ((value / 120) * chartHeight);
      pointsRef.current.push({
        x,
        y,
        value,
        label: xLabels[i]
      });
    });
    
    // Draw smooth curve
    ctx.beginPath();
    ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);
    
    for (let i = 0; i < pointsRef.current.length - 1; i++) {
      const current = pointsRef.current[i];
      const next = pointsRef.current[i + 1];
      
      const cp1x = current.x + (next.x - current.x) / 3;
      const cp1y = current.y;
      const cp2x = current.x + 2 * (next.x - current.x) / 3;
      const cp2y = next.y;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
    
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.fillStyle = gradient;
    ctx.fill();
    
  
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-pointer"
    />
  );
};

export default SurveyProgressChart;