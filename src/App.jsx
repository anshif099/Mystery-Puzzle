import React, { useEffect, useState } from "react";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import LandingView from "./components/landing/LandingView";
import AuthView from "./components/auth/AuthView";
import AdminDashboard from "./components/admin/AdminDashboard";
import CompanyAdminDashboard from "./components/company/CompanyAdminDashboard";
import PlayPortal from "./components/play/PlayPortal";
import { logoutGoogleSession } from "./services/challengeService";
import { clearSession, readSession, writeSession } from "./services/session";

const readRoute = () => ({
  path: window.location.pathname,
  params: new URLSearchParams(window.location.search),
});

const initialDashboardView = (session) => {
  if (session?.role === "super_admin") {
    return "admin";
  }
  if (session?.role === "company_admin") {
    return "company_admin";
  }
  return localStorage.getItem("puzzle_view") || "landing";
};

function App() {
  const [session, setSession] = useState(() => readSession());
  const [route, setRoute] = useState(() => readRoute());
  const [view, setView] = useState(() => initialDashboardView(readSession()));

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (view === "landing" || view === "auth") {
      localStorage.setItem("puzzle_view", view);
    }
  }, [view]);

  const navigate = (path, search = "") => {
    const url = `${path}${search}`;
    if (`${window.location.pathname}${window.location.search}` === url) {
      return;
    }
    window.history.pushState({}, "", url);
    setRoute(readRoute());
  };

  const navigateHome = () => {
    navigate("/");
    setView("landing");
  };

  const handleAuthSuccess = (authSession) => {
    const nextSession = writeSession({
      ...authSession,
      loggedAt: Date.now(),
    });
    setSession(nextSession);
    navigate("/");
    if (authSession.role === "super_admin") {
      setView("admin");
      return;
    }
    if (authSession.role === "company_admin") {
      setView("company_admin");
    }
  };

  const handleLogout = async () => {
    await logoutGoogleSession();
    clearSession();
    setSession(null);
    setView("landing");
    navigate("/");
  };

  const handleHeaderSetView = (nextView) => {
    if (route.path !== "/") {
      navigate("/");
    }
    setView(nextView);
  };

  if (route.path === "/play") {
    const companyId = route.params.get("companyId") || "";
    const campaignId = route.params.get("campaignId") || "";
    const campaignKey = route.params.get("campaign") || "";

    return (
      <PlayPortal
        companyId={companyId}
        campaignId={campaignId}
        campaignKey={campaignKey}
        session={session}
        onUserSession={(userSession) => {
          if (!userSession) {
            clearSession();
            setSession(null);
            return;
          }
          const nextSession = writeSession({
            ...userSession,
            loggedAt: Date.now(),
          });
          setSession(nextSession);
        }}
        onNavigateHome={navigateHome}
      />
    );
  }

  const effectiveView = (() => {
    if (session?.role === "super_admin") {
      return "admin";
    }
    if (session?.role === "company_admin") {
      return "company_admin";
    }
    if (view === "admin" || view === "company_admin") {
      return "landing";
    }
    return view;
  })();

  return (
    <div className="min-h-screen font-sans selection:bg-mint/30 overflow-x-hidden">
      {effectiveView !== "admin" && effectiveView !== "company_admin" && (
        <Header onAuthClick={() => setView("auth")} setView={handleHeaderSetView} />
      )}

      <main className="transition-opacity duration-300">
        {effectiveView === "landing" ? (
          <LandingView onAuthClick={() => setView("auth")} />
        ) : effectiveView === "auth" ? (
          <AuthView onAuthSuccess={handleAuthSuccess} />
        ) : effectiveView === "admin" ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <CompanyAdminDashboard session={session} onLogout={handleLogout} />
        )}
      </main>

      {effectiveView !== "admin" && effectiveView !== "company_admin" && <Footer />}
    </div>
  );
}

export default App;
