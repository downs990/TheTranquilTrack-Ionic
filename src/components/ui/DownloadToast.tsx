import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck as CheckCircle, X, FolderOpen } from "lucide-react";

interface DownloadToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function DownloadToast({ message, onDismiss }: DownloadToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed bottom-24 left-4 right-4 z-[9999] rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{
            background: "#0F2830",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxWidth: "358px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(6,214,160,0.15)" }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: "#06D6A0" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-tight">Saved!</p>
            <div className="flex items-center gap-1 mt-0.5">
              <FolderOpen className="w-3 h-3 shrink-0" style={{ color: "#06D6A0" }} />
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
