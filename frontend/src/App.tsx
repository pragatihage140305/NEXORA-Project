import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/home/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PmDashboard } from './components/pm/PmDashboard';
import { ClientDashboard } from './components/client/ClientDashboard';
import { TeamMemberDashboard } from './components/member/TeamMemberDashboard';
import { TeamManagement } from './components/pm/TeamManagement';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { IssuesPage } from './components/issues/IssuesPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { TimelinePage } from './components/timeline/TimelinePage';
import { Layers } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse mb-4">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Initializing Nexora Enterprise Platform...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Spring Boot 3 Backend & H2/MySQL Service</p>
      </div>
    );
  }

  // If user is not authenticated, display Landing Page by default or Auth Page when clicked
  if (!user) {
    if (showAuth) {
      return (
        <AuthPage
          initialMode={authInitialMode}
          onBackToHome={() => setShowAuth(false)}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => {
          setAuthInitialMode('login');
          setShowAuth(true);
        }}
        onRegister={() => {
          setAuthInitialMode('login');
          setShowAuth(true);
        }}
      />
    );
  }

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'ROLE_ADMIN':
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
      case 'ROLE_PM':
        return <PmDashboard onNavigateTab={setCurrentTab} />;
      case 'ROLE_CLIENT':
        return <ClientDashboard onNavigateTab={setCurrentTab} />;
      case 'ROLE_TEAM_MEMBER':
      default:
        return <TeamMemberDashboard />;
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'projects':
        return <ProjectsPage onNavigateTab={setCurrentTab} />;
      case 'teams':
        return <TeamManagement />;
      case 'issues':
        return <IssuesPage />;
      case 'timeline':
        return <TimelinePage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Left Sidebar (All navigation links relocated here) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar: ONLY Project Name and Login Details */}
        <Navbar
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Tab Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">NEXORA PLATFORM</span>
              <span>•</span>
              <span>Enterprise Issue Tracking & Project Management</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Spring Boot 3 + React + TypeScript</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono text-[11px]">Backend API :8080 Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainLayout />
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;
