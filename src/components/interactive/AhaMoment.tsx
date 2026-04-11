"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AhaMomentProps {
  children: React.ReactNode;
}

export default function AhaMoment({ children }: AhaMomentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border-2 border-accent bg-accent-light p-6 space-y-3 text-center"
    >
      <motion.div
        className="flex justify-center"
        initial={{ rotate: -20 }}
        animate={{ rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
      >
        <Sparkles className="h-7 w-7 text-accent" />
      </motion.div>

      <div className="text-base font-medium text-foreground leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
