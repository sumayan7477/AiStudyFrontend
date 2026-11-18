import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import Home from "../pages/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import Dashboard from "../pages/Dashboard";
import Chat from "../pages/Chat";
import StudyPlans from "../pages/StudyPlans";
import StudyPlanDetails from "../pages/StudyPlans/Details";

import Quizzes from "../pages/Quizzes";
import Quiz from "../pages/Quizzes/Quiz";
import QuizResult from "../pages/Quizzes/Result";

import Notes from "../pages/Notes";
import NoteDetails from "../pages/Notes/Details";

import Flashcards from "../pages/Flashcards";
import FlashcardDetails from "../pages/Flashcards/Details";

import Progress from "../pages/Progress";
import Gamification from "../pages/Gamification";
import Activity from "../pages/Activity";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

import NotFound from "../pages/NotFound";

export default function AppRoutes() {
    return (
        <Routes>

            {/* Public Website */}
            <Route element={<MainLayout />}>
                <Route index element={<Home />} />
            </Route>

            {/* Authentication */}
            <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>
            </Route>

            {/* Protected Dashboard */}
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/profile" element={<Profile />} />

                    <Route path="/chat" element={<Chat />} />

                    <Route path="/study-plans" element={<StudyPlans />} />
                    <Route path="/study-plans/:id" element={<StudyPlanDetails />} />

                    <Route path="/quizzes" element={<Quizzes />} />
                    <Route path="/quizzes/:id" element={<Quiz />} />
                    <Route path="/quizzes/result/:id" element={<QuizResult />} />

                    <Route path="/notes" element={<Notes />} />
                    <Route path="/notes/:id" element={<NoteDetails />} />

                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/flashcards/:id" element={<FlashcardDetails />} />

                    <Route path="/progress" element={<Progress />} />

                    <Route path="/gamification" element={<Gamification />} />

                    <Route path="/activity" element={<Activity />} />

                    <Route path="/settings" element={<Settings />} />

                </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />

        </Routes>
    );
}