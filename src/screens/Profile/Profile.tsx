import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Dumbbell, BarChart2, Wifi, Home, NotebookPen, UserPen, ChartNoAxesColumnIncreasing, PersonStanding, Plus, Play, Square } from 'lucide-react';
import { Switch } from "../../components/ui/switch";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const Profile = (): JSX.Element => {
  const percentage = 75;
  const navigate = useNavigate();
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const toggleWorkout = () => {
    setIsWorkoutActive(!isWorkoutActive);
  };

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[754px]">
        <div className="relative h-[754px] bg-[url(/2.jpg)] bg-cover bg-[50%_50%]">
          <div className="absolute bottom-28 left-0 right-0 px-6">
            

            <div className="flex justify-center mb-4">
            <div className="flex bg-black/40 backdrop-blur-md rounded-2xl py-2 px-6">
                <UserPen className="w-8 h-8 text-white " />
                <div className="text-white text-2xl ml-5 font-semibold"> Welcome, Courtney</div> 
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div 
                  className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl p-4 cursor-pointer hover:bg-black/50 transition-colors"
                  onClick={() => navigate('/add-exercise')}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <Plus className="w-8 h-8 text-white mb-2" />
                    <div className="text-center">
                      <div className="text-white font-semibold">Add New</div>
                      <div className="text-sm text-white opacity-80">Exercise Type</div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl p-4 cursor-pointer hover:bg-black/50 transition-colors"
                  onClick={toggleWorkout}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {isWorkoutActive ? (
                      <Square className="w-8 h-8 text-white mb-2 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white mb-2 fill-white" />
                    )}
                    <div className="text-center">
                      <div className="text-white font-semibold">{isWorkoutActive ? 'Stop' : 'Start'}</div>
                      <div className="text-sm text-white opacity-80">Workout</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 mb-2">
                <div className="text-[#E6FE58] text-lg font-semibold">Previous Workout:</div>
                <div className="text-white text-sm">March 15, 2025</div>
              </div>

              <div className="relative h-[280px]">
                <AnimatePresence mode="wait">
                  {isWorkoutActive ? (
                    <motion.div 
                      className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl p-8 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-white text-2xl font-semibold flex items-center">
                        Analyzing
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
                        >
                          ...
                        </motion.span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5">
                          <div className="flex items-center gap-4">
                            <Dumbbell className="w-8 h-8 text-white" />
                            <div className="flex-1 flex justify-around">
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Bench Press</div>
                                <div className="text-xl font-bold text-[#E6FE58]">201 lbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Reps</div>
                                <div className="text-xl font-bold text-[#E6FE58]">12</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5">
                          <div className="flex items-center gap-4">
                            <ChartNoAxesColumnIncreasing className="w-8 h-8 text-white" />
                            <div className="flex-1 flex justify-around">
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Steps Climbed</div>
                                <div className="text-xl font-bold text-[#E6FE58]">2,500</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Floors</div>
                                <div className="text-xl font-bold text-[#E6FE58]">25</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5">
                          <div className="flex items-center gap-4">
                            <PersonStanding className="w-8 h-8 text-white" />
                            <div className="flex-1 flex justify-around">
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Jumping Jacks</div>
                                <div className="text-xl font-bold text-[#E6FE58]">100</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-white opacity-80">Time</div>
                                <div className="text-xl font-bold text-[#E6FE58]">2:30</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg">
            <div className="flex justify-around items-center py-4 px-6">
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate('/devices')}
              >
                <Wifi className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">Devices</span>
              </div>
              <div className="flex flex-col items-center">
                <Home className="w-6 h-6 text-[#E6FE58]" />
                <span className="text-xs text-[#E6FE58] mt-1">Home</span>
              </div>
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate('/workout-records')}
              >
                <NotebookPen className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">Records</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};