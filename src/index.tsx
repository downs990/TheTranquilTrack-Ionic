import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Main } from "./screens/Main";
import { SignUp } from "./screens/SignUp";
import { Profile } from "./screens/Profile";
import { Devices } from "./screens/Devices";
import { WorkoutRecords } from "./screens/WorkoutRecords";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/workout-records" element={<WorkoutRecords />} />
        
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);