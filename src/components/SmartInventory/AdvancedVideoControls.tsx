import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Move, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

interface AdvancedVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  className?: string;
}

interface VideoTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

const AdvancedVideoControls: React.FC<AdvancedVideoControlsProps> = ({ 
  videoRef, 
  className = '' 
}) => {
  const [transform, setTransform] = useState<VideoTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apply transform to video element
  const applyTransform = useCallback((newTransform: VideoTransform) => {
    if (videoRef.current) {
      const { scale, translateX, translateY, rotation } = newTransform;
      videoRef.current.style.transform = `
        scale(${scale}) 
        translate(${translateX}px, ${translateY}px) 
        rotate(${rotation}deg)
      `;
      videoRef.current.style.transformOrigin = 'center center';
    }
    setTransform(newTransform);
  }, [videoRef]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    const newScale = Math.min(transform.scale * 1.2, 5);
    applyTransform({ ...transform, scale: newScale });
  }, [transform, applyTransform]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(transform.scale / 1.2, 0.5);
    applyTransform({ ...transform, scale: newScale });
  }, [transform, applyTransform]);

  // Pan controls
  const panUp = useCallback(() => {
    const newTranslateY = transform.translateY - 20;
    applyTransform({ ...transform, translateY: newTranslateY });
  }, [transform, applyTransform]);

  const panDown = useCallback(() => {
    const newTranslateY = transform.translateY + 20;
    applyTransform({ ...transform, translateY: newTranslateY });
  }, [transform, applyTransform]);

  const panLeft = useCallback(() => {
    const newTranslateX = transform.translateX - 20;
    applyTransform({ ...transform, translateX: newTranslateX });
  }, [transform, applyTransform]);

  const panRight = useCallback(() => {
    const newTranslateX = transform.translateX + 20;
    applyTransform({ ...transform, translateX: newTranslateX });
  }, [transform, applyTransform]);

  // Rotation controls
  const rotateClockwise = useCallback(() => {
    const newRotation = (transform.rotation + 90) % 360;
    applyTransform({ ...transform, rotation: newRotation });
  }, [transform, applyTransform]);

  const rotateCounterClockwise = useCallback(() => {
    const newRotation = (transform.rotation - 90 + 360) % 360;
    applyTransform({ ...transform, rotation: newRotation });
  }, [transform, applyTransform]);

  // Reset all transformations
  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, translateX: 0, translateY: 0, rotation: 0 });
  }, [applyTransform]);

  // Fit to container
  const fitToContainer = useCallback(() => {
    if (!videoRef.current || !containerRef.current) return;
    
    const video = videoRef.current;
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    
    const scaleX = containerRect.width / video.videoWidth;
    const scaleY = containerRect.height / video.videoHeight;
    const optimalScale = Math.min(scaleX, scaleY);
    
    applyTransform({ 
      scale: optimalScale, 
      translateX: 0, 
      translateY: 0, 
      rotation: 0 
    });
  }, [videoRef, applyTransform]);

  // Mouse drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    applyTransform({
      ...transform,
      translateX: transform.translateX + deltaX,
      translateY: transform.translateY + deltaY
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, transform, applyTransform]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch/gesture support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      e.preventDefault();
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    applyTransform({
      ...transform,
      translateX: transform.translateX + deltaX,
      translateY: transform.translateY + deltaY
    });
    
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, dragStart, transform, applyTransform]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, transform.scale * delta));
    
    applyTransform({ ...transform, scale: newScale });
  }, [transform, applyTransform]);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    
    // Wheel event
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleWheel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isControlsVisible) return;
      
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'ArrowUp':
          e.preventDefault();
          panUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          panDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          panLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          panRight();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetTransform();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          fitToContainer();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isControlsVisible, zoomIn, zoomOut, panUp, panDown, panLeft, panRight, resetTransform, fitToContainer]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => setIsControlsVisible(false)}
    >
      {/* Advanced Controls Overlay */}
      {isControlsVisible && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Zoom Controls - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-auto">
            <button
              onClick={zoomIn}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={zoomOut}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>
          </div>

          {/* Pan Controls - Left Side */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-auto">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={panUp}
                className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                title="Pan Up (↑)"
              >
                <ArrowUp size={16} />
              </button>
              <div className="flex gap-1">
                <button
                  onClick={panLeft}
                  className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                  title="Pan Left (←)"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={panRight}
                  className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                  title="Pan Right (→)"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              <button
                onClick={panDown}
                className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                title="Pan Down (↓)"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>

          {/* Rotation & Reset Controls - Bottom Right */}
          <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-auto">
            <button
              onClick={rotateCounterClockwise}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Rotate Counter-Clockwise"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={rotateClockwise}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Rotate Clockwise"
            >
              <RotateCw size={16} />
            </button>
            <button
              onClick={fitToContainer}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Fit to Container (F)"
            >
              <Maximize size={16} />
            </button>
            <button
              onClick={resetTransform}
              className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              title="Reset View (R)"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Transform Info - Bottom Left */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-2 rounded-lg text-xs pointer-events-auto">
            <div>Zoom: {(transform.scale * 100).toFixed(0)}%</div>
            <div>Position: {transform.translateX.toFixed(0)}, {transform.translateY.toFixed(0)}</div>
            <div>Rotation: {transform.rotation}°</div>
          </div>
        </div>
      )}

      {/* Drag Instructions */}
      {isControlsVisible && !isDragging && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-black/50 text-white px-4 py-2 rounded-lg text-sm pointer-events-none
                        opacity-60 transition-opacity">
          <div className="text-center">
            <Move size={20} className="mx-auto mb-1" />
            <div>Click & drag to pan</div>
            <div className="text-xs mt-1">Scroll to zoom • Hover for controls</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedVideoControls;