import React, { useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface ProfessionalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal' | 'pink';
  delay?: number;
  className?: string;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  color,
  delay = 0,
  className = ''
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    onClick();
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        icon: 'text-blue-600',
        text: 'text-blue-800',
        gradient: 'gradient-bg-blue'
      },
      green: {
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100',
        icon: 'text-green-600',
        text: 'text-green-800',
        gradient: 'gradient-bg-green'
      },
      purple: {
        bg: 'bg-purple-50',
        hover: 'hover:bg-purple-100',
        icon: 'text-purple-600',
        text: 'text-purple-800',
        gradient: 'gradient-bg-purple'
      },
      orange: {
        bg: 'bg-orange-50',
        hover: 'hover:bg-orange-100',
        icon: 'text-orange-600',
        text: 'text-orange-800',
        gradient: 'gradient-bg-orange'
      },
      indigo: {
        bg: 'bg-indigo-50',
        hover: 'hover:bg-indigo-100',
        icon: 'text-indigo-600',
        text: 'text-indigo-800',
        gradient: 'gradient-bg-blue'
      },
      teal: {
        bg: 'bg-teal-50',
        hover: 'hover:bg-teal-100',
        icon: 'text-teal-600',
        text: 'text-teal-800',
        gradient: 'gradient-bg-green'
      },
      pink: {
        bg: 'bg-pink-50',
        hover: 'hover:bg-pink-100',
        icon: 'text-pink-600',
        text: 'text-pink-800',
        gradient: 'gradient-bg-purple'
      }
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const colors = getColorClasses(color);

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      className={`
        professional-card
        relative
        p-6
        ${colors.bg}
        ${colors.hover}
        rounded-xl
        text-center
        group
        overflow-hidden
        border
        border-gray-200
        hover:border-gray-300
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        transition-all
        duration-300
        ease-out
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animation: 'textSlideUp 0.5s ease-out forwards'
      }}
      title={description}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20
          }}
        />
      ))}

      {/* Icon with professional animation */}
      <div className="relative mb-4">
        <div className={`
          professional-card-icon
          w-16
          h-16
          mx-auto
          rounded-full
          flex
          items-center
          justify-center
          ${colors.gradient}
          shadow-lg
          group-hover:shadow-xl
          transition-all
          duration-300
        `}>
          <Icon className={`w-8 h-8 text-white`} />
        </div>
        
        {/* Subtle glow effect */}
        <div className={`
          absolute
          inset-0
          w-16
          h-16
          mx-auto
          rounded-full
          ${colors.gradient}
          opacity-0
          group-hover:opacity-20
          blur-xl
          transition-opacity
          duration-300
        `} />
      </div>

      {/* Title */}
      <h3 className={`
        text-lg
        font-semibold
        ${colors.text}
        mb-2
        group-hover:text-gray-900
        transition-colors
        duration-300
      `}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
        {description}
      </p>

      {/* Subtle border animation */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 transition-colors duration-300" />
    </button>
  );
};

export default ProfessionalCard;
