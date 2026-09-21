import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { Protected } from "./components/Protected";
import { Admin } from "./pages/Admin";
import { Catalogue } from "./pages/Catalogue";
import { CoursePage } from "./pages/Course";
import { Finder } from "./pages/Finder";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Schedule } from "./pages/Schedule";
import { SignIn } from "./pages/SignIn";
import { Student } from "./pages/Student";
import { Trainer } from "./pages/Trainer";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Catalogue />} />
        <Route path="courses/:code" element={<CoursePage />} />
        <Route path="finder" element={<Finder />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="student" element={<Protected roles={["student"]}><Student /></Protected>} />
        <Route path="trainer" element={<Protected roles={["trainer"]}><Trainer /></Protected>} />
        <Route path="admin" element={<Protected roles={["admin"]}><Admin /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
