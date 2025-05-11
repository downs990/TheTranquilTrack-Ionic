import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const AddExerciseType = (): JSX.Element => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number>(3);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);

  useEffect(() => {
    if (countdown > 0 && isCountingDown) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isCountingDown]);

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[100vh]">
        <div className="relative h-[100vh] bg-[url(/5.png)] bg-cover bg-[50%_50%]">
        
          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="p-2 text-white hover:text-[#E6FE58]"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-white text-xl font-semibold ml-4">Add New Exercise</h1>
            </div>
          </div>


          {/* TODO: Figure out how to make this div a smaller height. It's trying to take up the whole screen.
                    - you can see it's size by giving it a background property   bg-[url(/5.png)]
                    ------------------------------------------------------------------------------------------
          */}
          <div className="absolute inset-0 flex items-center justify-center mt-20">
            <AnimatePresence>
              {countdown > 0 ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-[#E6FE58] text-8xl font-bold"
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white text-2xl"
                > 
                  Perform a single rep of <br/> the new exercise!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
              {/*----------------------------------------------------------------------------------------- */}


        </div>
      </div>
    </div>
  );
};