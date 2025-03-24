"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@tsparticles/react";
import { tsParticles } from "@tsparticles/engine";
import dynamic from "next/dynamic";

// Lazy-load components
const MatchResume = dynamic(() => import("@/components/MatchResume"), { ssr: false });
const GenerateResume = dynamic(() => import("@/components/GenerateResume"), { ssr: false });
const RoastResume = dynamic(() => import("@/components/RoastResume"), { ssr: false });
const LandingPage = dynamic(() => import("@/components/LandingPage"), { ssr: false });

export default function App() {
  const [activeTab, setActiveTab] = useState("landing");
  const [isMounted, setIsMounted] = useState(false);
  const [warpFlash, setWarpFlash] = useState(false);
  const [particleCount, setParticleCount] = useState(5); // Default particle count
  const [dotCount, setDotCount] = useState(30); // Default dot count
  const [dots, setDots] = useState([]);

  // Set particle and dot counts based on device capabilities after mounting
  useEffect(() => {
    setIsMounted(true);

    // Check if we're on the client side
    if (typeof window !== "undefined") {
      // Adjust particle count based on hardware concurrency
      const hardwareConcurrency = window.navigator.hardwareConcurrency || 4;
      setParticleCount(hardwareConcurrency < 4 ? 3 : 5);

      // Detect mobile devices and reduce dot count
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const newDotCount = isMobile ? 15 : 30; // Fewer dots on mobile
      setDotCount(newDotCount);

      // Generate dots with pre-calculated positions
      setDots(
        [...Array(newDotCount)].map(() => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          duration: 5 + Math.random() * 3,
        }))
      );
    }
  }, []);

  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
  }, [activeTab]);

  const particlesInit = useCallback(async () => {
    await tsParticles.load({
      id: "header-particles",
      options: particlesOptions,
    });
  }, []);

  const particlesOptions = {
    particles: {
      number: {
        value: particleCount, // Use dynamic particle count
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: ["#9333ea", "#3b82f6", "#facc15"],
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.5,
        random: true,
      },
      size: {
        value: 3,
        random: true,
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: "none",
        random: true,
        out_mode: "out",
      },
    },
    interactivity: {
      events: {
        onhover: {
          enable: false,
        },
      },
    },
  };

  const punchlineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const punchlineText = "Your resume’s a mess? We’ll fix, craft, or mock it—";

  const sectionVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.3, ease: "easeInOut" },
        scale: { duration: 0.3, ease: "easeInOut" },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        opacity: { duration: 0.3, ease: "easeInOut" },
        scale: { duration: 0.3, ease: "easeInOut" },
      },
    },
  };

  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const handleTabChange = debounce((tab) => {
    setWarpFlash(true);
    setActiveTab(tab);
  }, 300);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <AnimatePresence>
        {warpFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 z-50 pointer-events-none"
            onAnimationComplete={() => setWarpFlash(false)}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, rgba(147, 51, 234, 0.1), rgba(0, 0, 0, 0.8))",
          }}
        />
        {isMounted && (
          <>
            {dots.map((dot, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-twinkle"
                style={{
                  left: dot.left,
                  top: dot.top,
                  animationDuration: `${dot.duration}s`,
                }}
              />
            ))}
          </>
        )}
        <motion.div
          className="absolute w-16 h-16 bg-purple-700 rounded-full opacity-30 hidden md:block" // Hide on mobile
          style={{ left: "10%", top: "15%" }}
          animate={{
            x: [0, 30, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute w-20 h-20 border-2 border-dashed border-purple-400 rounded-full opacity-20"
            style={{ top: "-2px", left: "-2px" }}
          />
        </motion.div>
        <motion.div
          className="absolute w-12 h-12 bg-blue-600 rounded-full opacity-30 hidden md:block" // Hide on mobile
          style={{ right: "15%", bottom: "20%" }}
          animate={{
            x: [0, -25, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute w-16 h-16 border-2 border-dashed border-blue-400 rounded-full opacity-20"
            style={{ top: "-2px", left: "-2px" }}
          />
        </motion.div>
        <motion.div
          className="absolute w-24 h-24 bg-yellow-400 rounded-full opacity-20 hidden md:block" // Hide on mobile
          style={{ right: "5%", top: "5%" }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-6 bg-yellow-300 opacity-40"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 30}deg) translate(24px, -50%)`,
              }}
              animate={{
                scaleY: [1, 1.8, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      <div className="relative z-10">
        <header className="relative p-4 sm:p-6 z-20">
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              id="header-particles"
              init={particlesInit}
              options={particlesOptions}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between items-center relative z-10 space-y-4 sm:space-y-0">
            <motion.h1
              className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              whileHover={{
                scale: 1.05,
                textShadow: "0 0 20px rgba(147, 51, 234, 0.8)",
              }}
            >
              AirResume
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg text-gray-300 font-medium text-center sm:text-right"
              variants={punchlineVariants}
              initial="hidden"
              animate="visible"
            >
              {punchlineText.split("").map((char, index) => (
                <motion.span key={index} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
              <motion.span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
              >
                courtesy of xAI’s Grok.
              </motion.span>
            </motion.p>
          </div>
        </header>

        {activeTab !== "landing" && (
          <nav className="flex justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8 z-20 flex-wrap px-4">
            {["match", "generate", "roast"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => {
                  console.log(`Switching to tab: ${tab}`);
                  handleTabChange(tab);
                }}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md font-semibold transition-colors text-sm sm:text-base ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } m-1 touch-manipulation`} // Added touch-manipulation for better mobile touch
                whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
            <motion.button
              onClick={() => {
                console.log("Switching to landing");
                handleTabChange("landing");
              }}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-md font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm sm:text-base m-1 touch-manipulation"
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Home
            </motion.button>
          </nav>
        )}

        <main className="flex justify-center z-10 px-4 sm:px-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-full sm:max-w-4xl will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
              {activeTab === "landing" && <LandingPage setActiveTab={setActiveTab} />}
              {activeTab === "match" && <MatchResume />}
              {activeTab === "generate" && <GenerateResume />}
              {activeTab === "roast" && <RoastResume />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}