"use client";

import type { Variants } from "framer-motion";
import { motion, useAnimation } from "framer-motion";

const pathVariant: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const circleVariant: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

interface UserProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
  isLoggedIn?: boolean;
  onClick?: () => void;
}

const User = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  isLoggedIn = false,
  onClick,
  ...props
}: UserProps) => {
  const controls = useAnimation();

  return (
    <div
      className={`
        cursor-pointer select-none p-2 flex items-center justify-center rounded-full
        transition-all duration-300 ease-in-out backdrop-blur-md
        hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30
        ${isLoggedIn 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/30' 
          : 'bg-white/10 border-2 border-white/20'
        }
      `}
      style={{
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={() => {
        controls.start("animate");
      }}
      onMouseLeave={() => {
        controls.start("normal");
      }}
      onClick={onClick}
      title={isLoggedIn ? "Account Settings" : "Sign In"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isLoggedIn ? "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))" : "none",
        }}
        {...props}
      >
        <motion.circle
          cx="12"
          cy="8"
          r="5"
          animate={controls}
          variants={circleVariant}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M20 21a8 8 0 0 0-16 0"
          variants={pathVariant}
          transition={{
            delay: 0.2,
            duration: 0.4,
            ease: "easeInOut",
          }}
          animate={controls}
        />
      </svg>
      
      {/* Status indicator */}
      {isLoggedIn && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#10b981",
            border: "2px solid #ffffff",
            boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
          }}
        />
      )}
    </div>
  );
};

export { User }; 