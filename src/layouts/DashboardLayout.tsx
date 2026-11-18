import { useCallback, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import MobileSidebar from "../components/layout/MobileSidebar";
import Navbar from "../components/layout/Navbar";
import RouteOutlet from "../components/layout/RouteOutlet";

/**
 * App shell for signed-in pages. From the lg breakpoint (1024 px) the sidebar is a column; below it
 * the sidebar is hidden and opens as a drawer from the menu button, so phones and tablets get the
 * full width for the page.
 */
const DashboardLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    return (
        <div className="flex h-screen bg-gray-100">

            <a
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault(); // keep the URL unchanged
                    document.getElementById("main-content")?.focus();
                }}
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-indigo-700 focus:shadow"
            >
                Skip to main content
            </a>

            <Sidebar className="hidden lg:flex" />
            <MobileSidebar open={menuOpen} onClose={closeMenu} />

            <div className="flex min-w-0 flex-1 flex-col">

                <Navbar onMenuClick={() => setMenuOpen(true)} menuOpen={menuOpen} />

                <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 focus:outline-none sm:p-6">
                    <RouteOutlet />
                </main>

            </div>

        </div>
    );
};

export default DashboardLayout;
