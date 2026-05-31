"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface CarStageProps {
  sideImg: string;
  topImg: string;
  showTop: boolean;
  alt: string;
}

export default function CarStage({
  sideImg,
  topImg,
  showTop,
  alt,
}: CarStageProps) {
  return (
    <div className="relative w-full h-full">
      {/* SIDE VIEW */}
      <AnimatePresence>
        {!showTop && (
          <motion.div
            key="side"
            className="absolute inset-0 flex items-end justify-center"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 1.06,
              y: -30,
              transition: { duration: 0.35, ease: [0.87, 0, 0.13, 1] },
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-[88%] max-w-[640px]">
              <Image
                src={sideImg}
                alt={`${alt} side view`}
                width={2400}
                height={1200}
                className="w-full h-auto object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP-DOWN VIEW */}
      <AnimatePresence>
        {showTop && (
          <motion.div
            key="top"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.88, rotateX: -15 }}
            animate={{
              opacity: 1,
              scale: 1.12,
              rotateX: 0,
              transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{ opacity: 0 }}
            style={{ perspective: 800 }}
          >
            <div className="relative w-[62%] max-w-[420px]">
              <Image
                src={topImg}
                alt={`${alt} top view`}
                width={2000}
                height={2000}
                className="w-full h-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}