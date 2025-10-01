"use client";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-cool-gradient p-6 md:p-10 shadow-soft">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-3xl"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">TBSL — The Brass Score Library</h1>
        <p className="mt-2 text-base text-gray-700">Upload, browse, and download your brass scores with a modern, calm interface.</p>
      </motion.div>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden>
        <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-10 right-6 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      </div>
    </section>
  );
}
