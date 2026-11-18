import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

const APP_NAME = "AI Study Assistant";

/** Most specific patterns first. */
const TITLES: [pattern: string, title: string][] = [
    ["/", APP_NAME],
    ["/login", "Log in"],
    ["/register", "Create account"],
    ["/dashboard", "Dashboard"],
    ["/chat/*", "AI Chat"],
    ["/study-plans/:id", "Study plan"],
    ["/study-plans", "Study Plans"],
    ["/quizzes/result/:id", "Quiz results"],
    ["/quizzes/:id", "Quiz"],
    ["/quizzes", "Quizzes"],
    ["/notes/:id", "Note"],
    ["/notes", "Notes"],
    ["/flashcards/:id", "Study flashcards"],
    ["/flashcards", "Flashcards"],
    ["/progress", "Progress"],
    ["/activity", "Activity"],
    ["/gamification", "Gamification"],
    ["/profile", "Profile"],
    ["/settings", "Settings"],
];

/**
 * Sets document.title for every route ("Quizzes · AI Study Assistant"), so browser tabs, history and
 * screen readers announce which page is open (WCAG 2.4.2).
 */
export function usePageTitle(): void {
    const { pathname } = useLocation();

    useEffect(() => {
        const match = TITLES.find(([pattern]) => matchPath({ path: pattern, end: true }, pathname));
        const title = match ? match[1] : "Page not found";
        document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
    }, [pathname]);
}
