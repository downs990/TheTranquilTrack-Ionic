import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export const AddExerciseType = (): JSX.Element => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="flex justify-center w-full" style={{ background: "#F0F4F8" }}>
      <div className="w-[390px] h-[100vh] relative overflow-hidden flex flex-col" style={{ background: "#F0F4F8" }}>

        {/* Header */}
        <div className="shrink-0 px-5 pt-12 pb-5" style={{ background: "linear-gradient(135deg, #0077A8 0%, #0077A8 100%)" }}>
          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95"
              style={{ background: "rgba(255,255,255,0.2)" }}
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">Capture</p>
              <p className="text-white font-black text-xl leading-tight">New Exercise</p>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <AnimatePresence mode="wait">
            {countdown > 0 ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-44 h-44 rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: "white",
                    boxShadow: "0 0 0 12px rgba(0,180,216,0.12), 0 8px 40px rgba(0,119,168,0.2)",
                    border: "3px solid #00B4D8"
                  }}
                >
                  <span className="text-8xl font-black" style={{ color: "#0077A8" }}>{countdown}</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#9BA3B2" }}>Get ready</p>
              </motion.div>
            ) : (
              <motion.div
                key="go"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: "linear-gradient(135deg, #0077A8 0%, #00B4D8 100%)",
                    boxShadow: "0 8px 40px rgba(0,119,168,0.35)"
                  }}
                >
                  <span className="text-4xl font-black text-white">GO</span>
                </div>
                <p className="font-black text-2xl mb-2" style={{ color: "#1A1A2E" }}>Perform a rep now</p>
                <p className="text-sm" style={{ color: "#9BA3B2" }}>
                  Do one full repetition of the new exercise<br />so we can record the motion
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
