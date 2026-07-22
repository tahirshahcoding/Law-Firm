"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  width?: "w-full" | "w-auto";
  staggerChildren?: boolean;
  delay?: number;
}

export const ScrollReveal = ({ children, width = "w-full", staggerChildren = false, delay = 0 }: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerChildren ? 0.15 : 0,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      filter: "blur(8px)",
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 70,
        damping: 20,
        mass: 1,
        delay: staggerChildren ? 0 : delay,
      } 
    },
  };

  if (staggerChildren) {
    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className={width}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={width}
    >
      {children}
    </motion.div>
  );
};

export const RevealItem = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      filter: "blur(8px)",
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 70,
        damping: 20,
        mass: 1
      } 
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
