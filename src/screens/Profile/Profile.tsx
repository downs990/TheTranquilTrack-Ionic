import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Dumbbell, BarChart2, Wifi, Home, NotebookPen, UserPen, ChartNoAxesColumnIncreasing, PersonStanding } from 'lucide-react';
import { Switch } from "../../components/ui/switch";
import { useNavigate } from "react-router-dom";

export const Profile = (): JSX.Element => {
  const percentage = 75;
  const navigate = useNavigate();

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[844px]">
        <div className="relative h-[844px] bg-[url(/2.jpg)] bg-cover bg-[50%_50%]">
          {/* Toggle Switch - aligned with left square */}
          <div className="absolute top-6 left-6">
            <Switch  />
          </div>

          <div className="absolute bottom-28 left-0 right-0 px-6">
            {/* Progress Text */}
            <div className="mb-4 text-center">
              <div className="text-white text-2xl font-semibold">Personal Records</div>
              <div className="text-[#E6FE58] text-base">PR Goals</div>
            </div>

            {/* Username Section */}
            <div className="flex justify-center mb-4">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl py-2 px-6">
                 
                <UserPen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Squares Container */}
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Left Square - Circular Progress */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl p-4">
                  <div className="w-24 h-24 mx-auto mb-2">
                    <CircularProgressbar 
                      value={percentage} 
                      text={`${percentage}%`}
                      styles={{
                        path: { 
                          stroke: `url(#progressGradient)`,
                          strokeLinecap: 'round',
                        },
                        text: { fill: '#FFFFFF', fontSize: '16px' },
                        trail: { stroke: 'rgba(255, 255, 255, 0.2)' }
                      }}
                    />
                    <svg style={{ height: 0 }}>
                      <defs>
                        <linearGradient id="progressGradient" gradientTransform="rotate(45)">
                          <stop offset="0%" stopColor="#E6FE58" />
                          <stop offset="100%" stopColor="#D4EC46" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-white opacity-80">Distance Walked</div>
                    <div className="text-xl font-bold text-[#E6FE58]">10 miles</div>
                  </div>
                </div>
                
                {/* Right Square - Stats */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl p-5">
                  <div className="flex flex-col items-center">
                    <Dumbbell className="w-8 h-8 mb-3 text-[#E6FE58]" />
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="text-sm text-white opacity-80">Dumbbell Curls</div>
                        <div className="text-xl font-bold text-[#E6FE58]">40 LBS</div>
                      </div>
                      <div>
                        <div className="text-sm text-white opacity-80">Reps</div>
                        <div className="text-xl font-bold text-[#E6FE58]">32</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Square - Bench Press */}
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

              {/* Bottom Square - Stair Master */}
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

              {/* Bottom Square - Jumping Jacks */}
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
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg">
            <div className="flex justify-around items-center py-4 px-6">
              {/* <div className="flex flex-col items-center">
                <BarChart2 className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">Stats</span>
              </div> */}
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
              <div className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate('/workout-records')}
                >
                <NotebookPen className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">Records</span>
              </div>
              {/* <div className="flex flex-col items-center">
                <User className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">Profile</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};