import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Dumbbell, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkoutRecord {
  id: string;
  date: string;
  name: string;
  duration: string;
  exercises: { name: string; sets: number; reps: number; weight?: number }[];
}

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
    ],
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
    ],
  },
];

export const WorkoutRecords = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(workoutRecords[0]?.id ?? null);

  const filtered = workoutRecords.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.date.includes(searchQuery)
  );

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
              <p className="text-white/60 text-xs uppercase tracking-widest">History</p>
              <p className="text-white font-black text-xl leading-tight">Workout Records</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">

          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#C0C7D4" }} />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid #EDF0F5", color: "#1A1A2E", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            />
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell className="w-10 h-10 mb-3" style={{ color: "#C0C7D4" }} />
              <p className="text-sm" style={{ color: "#9BA3B2" }}>No records match your search</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(workout => (
              <div
                key={workout.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <button
                  className="w-full px-4 pt-4 pb-3 flex items-start justify-between text-left"
                  onClick={() => setExpanded(prev => prev === workout.id ? null : workout.id)}
                >
                  <div className="flex-1">
                    <p className="font-black text-base leading-tight" style={{ color: "#1A1A2E" }}>{workout.name}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" style={{ color: "#C0C7D4" }} />
                        <span className="text-xs" style={{ color: "#9BA3B2" }}>{workout.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: "#C0C7D4" }} />
                        <span className="text-xs" style={{ color: "#9BA3B2" }}>{workout.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 ml-3 shrink-0">
                    {expanded === workout.id
                      ? <ChevronUp className="w-4 h-4" style={{ color: "#00B4D8" }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: "#C0C7D4" }} />
                    }
                  </div>
                </button>

                {expanded === workout.id && (
                  <div className="px-4 pb-4 pt-2 space-y-1" style={{ borderTop: "1px solid #F0F4F8" }}>
                    {workout.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#E8F7FB" }}>
                          <Dumbbell className="w-3.5 h-3.5" style={{ color: "#0077A8" }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm" style={{ color: "#1A1A2E" }}>{ex.name}</p>
                          <p className="text-xs" style={{ color: "#9BA3B2" }}>
                            {ex.sets} sets × {ex.reps} reps{ex.weight ? ` · ${ex.weight} lbs` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
