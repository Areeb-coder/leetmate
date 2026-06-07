import React, { useState, useEffect, useRef } from 'react';
import { ASSISTANT_ICON_URL } from '../store/useStore';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, isOpen }) => {
  const [position, setPosition] = useState(() => ({
    x: window.innerWidth - 80,
    y: window.innerHeight - 150
  }));
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load position from chrome storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['buttonPos']).then((data) => {
        if (data.buttonPos) {
          setPosition(data.buttonPos);
        }
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Left-click only
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position relative to right and bottom boundaries
      const newX = Math.max(10, Math.min(window.innerWidth - 80, e.clientX - dragStart.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragStart.current.y));
      
      const pos = { x: newX, y: newY };
      setPosition(pos);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save to chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ buttonPos: position });
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  if (isOpen) return null;

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onClick={() => {
        if (!isDragging) {
          onClick();
        }
      }}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 999999
      }}
      className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 hover:neon-glow active:scale-95 transition-all duration-300 animate-bounce-slow"
    >
      <img 
        src={ASSISTANT_ICON_URL} 
        className="w-10 h-10 object-contain animate-pulse" 
        alt="Leetmate" 
      />
    </button>
  );
};
