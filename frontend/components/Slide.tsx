// "use client";

// import { motion } from "framer-motion";
// import { CarData } from "./types";
// import CarStage from "./Carstage"

// interface SlideProps {
//   data: CarData;
//   showTop: boolean;
//   isExiting: boolean;
//   isEntering: boolean;
//   exitDir: number; // 1 = exit down, -1 = exit up
// }

// // Stagger container for text elements
// const textContainer = {
//   hidden: {},
//   show: {
//     transition: { staggerChildren: 0.06, delayChildren: 0.1 },
//   },
//   exit: {
//     transition: { staggerChildren: 0.04, staggerDirection: -1 },
//   },
// };

// const textItem = {
//   hidden: { opacity: 0, y: 14 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
//   },
//   exit: {
//     opacity: 0,
//     y: -12,
//     transition: { duration: 0.28, ease: [0.87, 0, 0.13, 1] },
//   },
// };

// export default function Slide({
//   data,
//   showTop,
//   isExiting,
//   isEntering,
//   exitDir,
// }: SlideProps) {
//   return (
//     <motion.div
//       className="absolute inset-0 flex flex-col overflow-hidden"
//       initial={{ y: isEntering ? "-100%" : "0%" }}
//       animate={{ y: "0%" }}
//       exit={{ y: exitDir > 0 ? "100%" : "-100%" }}
//       transition={{ duration: 0.72, ease: [0.87, 0, 0.13, 1] }}
//       style={{ zIndex: isEntering ? 2 : 1 }}
//     >
//       {/* ── HERO AREA ── */}
//       <div
//         className="relative flex-1 overflow-hidden"
//         style={{
//           background: `linear-gradient(180deg,
//             ${data.bgTop} 0%,
//             ${data.bgMid} 28%,
//             ${data.bgBot} 62%,
//             #eeeeee 100%
//           )`,
//           transition: "background 0.6s ease",
//         }}
//       >
//         {/* Navbar spacer */}
//         <div className="h-[7.5%] min-h-[44px]" />

//         {/* Meta row: crest | title | price */}
//         <motion.div
//           className="flex items-start px-[5%] pt-[2%] relative z-10"
//           variants={textContainer}
//           initial="hidden"
//           animate={isExiting ? "exit" : "show"}
//         >
//           {/* Porsche crest */}
//           <motion.div variants={textItem} className="flex-shrink-0 mt-1">
//             <PorscheCrest />
//           </motion.div>

//           {/* Title block */}
//           <motion.div
//             variants={textItem}
//             className="flex-1 text-center px-[2%]"
//           >
//             <h1
//               className="font-bold leading-tight tracking-[-0.03em] text-[#1a1a1a]"
//               style={{ fontSize: "clamp(18px, 2.8vw, 36px)" }}
//             >
//               {data.model}
//             </h1>
//             <p
//               className="font-light leading-snug tracking-[-0.02em] mt-[0.15em]"
//               style={{
//                 fontSize: "clamp(14px, 2.2vw, 28px)",
//                 color: "transparent",
//                 WebkitTextStroke: "1px rgba(30,30,30,0.3)",
//               }}
//             >
//               {data.variant}
//             </p>
//           </motion.div>

//           {/* Price block */}
//           <motion.div variants={textItem} className="flex-shrink-0 text-right">
//             <p
//               className="font-bold leading-tight tracking-[-0.03em] text-[#1a1a1a]"
//               style={{ fontSize: "clamp(16px, 2.4vw, 32px)" }}
//             >
//               {data.price}
//             </p>
//             <p
//               className="text-[#999] mt-[3px]"
//               style={{ fontSize: "clamp(9px, 0.9vw, 12px)" }}
//             >
//               {data.location}
//             </p>
//           </motion.div>
//         </motion.div>

//         {/* Thin center vertical line */}
//         <motion.div
//           className="absolute left-1/2 -translate-x-1/2 w-px bg-black/15 z-10"
//           style={{ top: "11%", height: "26%" }}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: isExiting ? 0 : 1 }}
//           transition={{ duration: 0.4, delay: isExiting ? 0 : 0.25 }}
//         />

//         {/* Car stage */}
//         <div className="absolute bottom-0 left-[6%] right-[2%] top-[22%] z-10">
//           <CarStage
//             sideImg={data.sideImg}
//             topImg={data.topImg}
//             showTop={showTop}
//             alt={data.model}
//           />
//         </div>

//         {/* Floor gradient overlay */}
//         <div
//           className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
//           style={{
//             height: "36%",
//             background:
//               "linear-gradient(to top, #eeeeee 0%, rgba(238,238,238,0) 100%)",
//           }}
//         />
//       </div>

//       {/* ── STATS BAR ── */}
//       <motion.div
//         className="relative flex items-center flex-shrink-0 bg-[#e2e2e2]"
//         style={{ height: "15%", minHeight: 64, padding: "0 5%" }}
//         variants={textContainer}
//         initial="hidden"
//         animate={isExiting ? "exit" : "show"}
//       >
//         {/* Index */}
//         <motion.span
//           variants={textItem}
//           className="absolute left-[5%] font-medium text-[#aaa] tracking-[0.05em]"
//           style={{ fontSize: "clamp(9px, 0.95vw, 12px)" }}
//         >
//           {data.index}
//         </motion.span>

//         {/* Stats */}
//         <motion.div
//           variants={textItem}
//           className="flex mx-auto"
//           style={{ gap: "clamp(20px, 3.5vw, 48px)" }}
//         >
//           {[
//             { value: data.year, label: "Year" },
//             { value: data.mileage, label: "Mileage" },
//             { value: data.hp, label: "Horsepower" },
//           ].map(({ value, label }) => (
//             <div key={label}>
//               <p
//                 className="font-bold text-[#1a1a1a] tracking-[-0.03em] leading-none"
//                 style={{ fontSize: "clamp(16px, 2.1vw, 26px)" }}
//               >
//                 {value}
//               </p>
//               <p
//                 className="text-[#aaa] tracking-[0.04em] mt-[4px]"
//                 style={{ fontSize: "clamp(8px, 0.8vw, 11px)" }}
//               >
//                 {label}
//               </p>
//             </div>
//           ))}
//         </motion.div>

//         {/* Full details */}
//         <motion.div variants={textItem} className="absolute right-[5%]">
//           <button
//             className="flex items-center gap-2 font-medium text-[#1a1a1a] border-b border-[#1a1a1a] pb-[2px] hover:opacity-60 transition-opacity"
//             style={{ fontSize: "clamp(9px, 1vw, 13px)" }}
//           >
//             Full details
//             <span className="text-[1.1em]">→</span>
//           </button>
//         </motion.div>
//       </motion.div>
//     </motion.div>
//   );
// }

// function PorscheCrest() {
//   return (
//     <svg
//       width="28"
//       height="34"
//       viewBox="0 0 32 39"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <path
//         d="M16 1L30 7V21C30 29 23 36 16 38C9 36 2 29 2 21V7L16 1Z"
//         fill="none"
//         stroke="#1a1a1a"
//         strokeWidth="1.4"
//       />
//       <line x1="16" y1="1" x2="16" y2="38" stroke="#1a1a1a" strokeWidth="0.8" />
//       <line x1="2" y1="20" x2="30" y2="20" stroke="#1a1a1a" strokeWidth="0.8" />
//       <rect x="2" y="7" width="14" height="13" fill="#1a1a1a" opacity="0.07" />
//       <rect x="16" y="20" width="14" height="9" fill="#1a1a1a" opacity="0.12" />
//       <rect x="20" y="7" width="4" height="13" fill="#cc0000" opacity="0.75" />
//       <rect x="24" y="7" width="6" height="13" fill="#cc0000" opacity="0.5" />
//       <path d="M6,18 Q7,12 10,10 Q11,14 9,18 Z" fill="#1a1a1a" opacity="0.45" />
//     </svg>
//   );
// }