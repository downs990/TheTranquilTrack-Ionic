import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Profile } from "./screens/Profile";
import { Devices } from "./screens/Devices";
import { WorkoutRecords } from "./screens/WorkoutRecords";
import { AddExerciseType } from "./screens/AddExerciseType";
import { Recordings } from "./screens/Recordings";
import { DeviceProvider } from "./lib/DeviceContext";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <DeviceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/workout-records" element={<WorkoutRecords />} />
          <Route path="/add-exercise" element={<AddExerciseType />} />
          <Route path="/recordings" element={<Recordings />} />
        </Routes>
      </BrowserRouter>
    </DeviceProvider>
  </StrictMode>,
);
