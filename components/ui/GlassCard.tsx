"use client";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

type GlassCardProps = React.PropsWithChildren<{
  className?: string;
}> & MotionProps & React.HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, children, ...motionProps }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.6 }}
      className={cn("glass-lift rounded-2xl p-4", className)}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
