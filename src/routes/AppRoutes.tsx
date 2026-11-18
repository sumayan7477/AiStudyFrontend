import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { RouteBoundary } from "../components/layout/RouteOutlet";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Pages are loaded on demand (route-based code splitting); layouts and route guards stay in the main bundle.
// The import paths are unchanged, so each resolves to the same file as before.
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));

// Explicit path: "../pages/Dashboard" would resolve to the old static stub pages/Dashboard.tsx.
const Dashboard = lazy(() => import("../pages/Dashboard/index"));
const Chat = lazy(() => import("../pages/Chat"));
const StudyPlans = lazy(() => import("../pages/StudyPlans"));
const StudyPlanDetails = lazy(() => import("../pages/StudyPlans/Details"));

const Quizzes = lazy(() => import("../pages/Quizzes"));
const Quiz = lazy(() => import("../pages/Quizzes/Quiz"));
const QuizResult = lazy(() => import("../pages/Quizzes/Result"));

const Notes = lazy(() => import("../pages/Notes"));
const NoteDetails = lazy(() => import("../pages/Notes/Details"));

const Flashcards = lazy(() => import("../pages/Flashcards"));
const FlashcardDetails = lazy(() => import("../pages/Flashcards/Details"));

const Progress = lazy(() => import("../pages/Progress"));
const Gamification = lazy(() => import("../pages/Gamification"));
const Activity = lazy(() => import("../pages/Activity"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));

const NotFound = lazy(() => import("../pages/NotFound"));

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
                    <Route path="/chat/:sessionId" element={<Chat />} />

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

            <Route path="*" element={<RouteBoundary><NotFound /></RouteBoundary>} />

        </Routes>
    );
}