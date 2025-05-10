import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Dumbbell, Clock } from 'lucide-react';
import { Button } from "../../components/ui/button";

interface WorkoutRecord {
  id: string;
  date: string;
  name: string;
  duration: string;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }[];
}

export const WorkoutRecords = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const workoutRecords: WorkoutRecord[] = [
    {
      id: '1',
      date: '2025-03-15',
      name: 'Upper Body Strength',
      duration: '45 min',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 12, weight: 185 },
        { name: 'Shoulder Press', sets: 3, reps: 10, weight: 135 },
        { name: 'Pull-ups', sets: 3, reps: 8 },
      ]
    },
    {
      id: '2',
      date: '2025-03-14',
      name: 'Cardio Session',
      duration: '30 min',
      exercises: [
        { name: 'Jumping Jacks', sets: 3, reps: 50 },
        { name: 'Mountain Climbers', sets: 3, reps: 30 },
        { name: 'Burpees', sets: 3, reps: 15 },
      ]
    }
  ];

  const filteredWorkouts = workoutRecords.filter(workout => 
    workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.date.includes(searchQuery)
  );

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[754px]">
        <div className="relative h-[754px] bg-[url(/2.jpg)] bg-cover bg-[50%_50%]">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="p-2 text-white hover:text-[#E6FE58]"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-white text-xl font-semibold ml-4">Workout Records</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="absolute top-20 left-0 right-0 px-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by workout name or date"
                className="w-full bg-black/40 backdrop-blur-md rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-400 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Workout List */}
            <div className="space-y-4">
              {filteredWorkouts.map(workout => (
                <div
                  key={workout.id}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#E6FE58]" />
                      <span className="text-white">{workout.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#E6FE58]" />
                      <span className="text-white">{workout.duration}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-[#E6FE58] font-semibold text-lg mb-3">{workout.name}</h3>
                  
                  <div className="space-y-2">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Dumbbell className="w-4 h-4 text-white" />
                        <div className="flex-1">
                          <p className="text-white">{exercise.name}</p>
                          <p className="text-gray-400 text-sm">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight && ` @ ${exercise.weight} lbs`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};