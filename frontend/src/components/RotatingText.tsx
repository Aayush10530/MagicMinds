import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
  texts: string[];
  className?: string;
  interval?: number;
  shouldStop?: boolean;
}

const RotatingText: React.FC<RotatingTextProps> = ({ 
  texts, 
  className = "", 
  interval = 2000,
  shouldStop = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If shouldStop is true and we're at the last item, don't start the timer
    if (shouldStop && currentIndex === texts.length - 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // If shouldStop is true and we've reached the end, stop
        if (shouldStop && nextIndex >= texts.length - 1) {
          return texts.length - 1; // Stay at the last item
        }
        return nextIndex % texts.length;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval, shouldStop, currentIndex]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={className}
      >
        {texts[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
};

export default RotatingText; 