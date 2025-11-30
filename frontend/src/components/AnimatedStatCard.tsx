import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  delay = 0,
  trend,
  trendValue
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isVisible, value]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        icon: 'text-blue-600',
        text: 'text-blue-800',
        accent: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        icon: 'text-green-600',
        text: 'text-green-800',
        accent: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        icon: 'text-yellow-600',
        text: 'text-yellow-800',
        accent: 'text-yellow-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        icon: 'text-red-600',
        text: 'text-red-800',
        accent: 'text-red-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        icon: 'text-purple-600',
        text: 'text-purple-800',
        accent: 'text-purple-600'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        icon: 'text-indigo-600',
        text: 'text-indigo-800',
        accent: 'text-indigo-600'
      }
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const colors = getColorClasses(color);

  return (
    <div
      className={`
        ${colors.bg}
        ${colors.border}
        rounded-xl
        p-6
        border-l-4
        shadow-lg
        hover:shadow-xl
        transition-all
        duration-500
        ease-out
        transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      style={{
        transitionDelay: `${delay}ms`,
        borderLeftColor: colors.accent.replace('text-', '')
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.text} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${colors.text} mb-2`}>
            {typeof value === 'number' ? animatedValue.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs ${colors.accent} font-medium`}>
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center text-xs ${getTrendColor(trend)} font-medium mt-1`}>
              <span className="mr-1">{getTrendIcon(trend)}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className={`
          ${colors.iconBg}
          p-3
          rounded-full
          transform
          transition-all
          duration-300
          hover:scale-110
          hover:rotate-12
        `}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
      
      {/* Subtle progress bar */}
      <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.accent.replace('text-', 'bg-')} rounded-full transition-all duration-2000 ease-out`}
          style={{
            width: isVisible ? '100%' : '0%',
            transitionDelay: `${delay + 500}ms`
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedStatCard;
