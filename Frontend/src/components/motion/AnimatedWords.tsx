"use client";

import { motion } from "framer-motion";

type AnimatedWordsProps = {
  text: string;
  className?: string;
  highlightFrom?: number;
};

export function AnimatedWords({ text, className = "", highlightFrom }: AnimatedWordsProps) {
  const words = text.split(" ");

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={`inline-block mr-[0.25em] ${
            highlightFrom !== undefined && i >= highlightFrom ? "gradient-text" : ""
          }`}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
