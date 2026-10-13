import React from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Users2,
  GitBranch,
  PlayCircle,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  Code2,
  Palette,
  CheckSquare,
  Cpu,
  ChevronRight,
  Workflow,
  Lock,
  Globe,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                NEXORA <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold uppercase tracking-wider">Enterprise</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Issue Tracking & Project Management Platform</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#home" className="hover:text-blue-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-blue-400 transition-colors">Workflow</a>
            <a href="#teams" className="hover:text-blue-400 transition-colors">Teams</a>
            <a href="#about" className="hover:text-blue-400 transition-colors">About</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all flex items-center gap-1.5"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section id="home" className="relative pt-20 pb-28 overflow-hidden">
          {/* Subtle Glow Backgrounds */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise Issue Tracking & Project Management Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
              Build Better <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">Together.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Empower your enterprise with seamless collaboration. Manage client requirements, balance cross-functional teams, mandate clickable prototypes, and drive project execution with formal authorization.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                Sign In to Platform
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* KPI Stat Cards (Matching Step 3 in Infographic) */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-3xl font-extrabold text-blue-400">12+</div>
                <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Total Teams</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Frontend, Backend, QA & DevOps</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-3xl font-extrabold text-indigo-400">18+</div>
                <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Active Projects</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Real-time sprint deliverables</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-3xl font-extrabold text-emerald-400">8+</div>
                <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Completed Projects</div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% verified deliverable sign-offs</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-3xl font-extrabold text-amber-400">6+</div>
                <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Total Clients</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Enterprise accounts managed</div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE (Matching the 12-Step Infographic) */}
        <section id="workflow" className="py-20 bg-slate-900/50 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                End-to-End Enterprise Flow
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                From Requirement to Delivery Sign-Off
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                A structured, auditable 12-stage workflow connecting Clients, Project Managers, Engineering Squads, and Executives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1: Client Request */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      01
                    </span>
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">Client Requirement File</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Client uploads business scope, expected features, proposed budget cap, and timeline deadline.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: SUBMITTED
                </div>
              </div>

              {/* Step 2: PM Squad Assignment */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      02
                    </span>
                    <Users2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Team Allocation</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Project Manager checks squad capacity (Team 1, 2, 3), assigns project, and sets prototype deadline.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: PROTOTYPE_IN_PROGRESS
                </div>
              </div>

              {/* Step 3: Prototype Submission */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                      03
                    </span>
                    <Palette className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">Team Submits Prototype</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Assigned team submits interactive Figma link, wireframe specs, and feature breakdown to PM.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: SUBMITTED_TO_MANAGER
                </div>
              </div>

              {/* Step 4: PM Forwards to Client */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/30">
                      04
                    </span>
                    <GitBranch className="w-5 h-5 text-sky-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">PM Review & Forward</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    PM reviews prototype, verifies compliance with client scope, and approves it for client sign-off.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: AWAITING_CLIENT_APPROVAL
                </div>
              </div>

              {/* Step 5: Client Decision */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      05
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Client Decision</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Client reviews prototype live in sandbox, clicking Accept to approve or Reject with revisions.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: PROTOTYPE_APPROVED
                </div>
              </div>

              {/* Step 6: Confirm & Start Development */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                      06
                    </span>
                    <PlayCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">Confirm & Start (Notify Team)</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    PM triggers Stage 7 gate: confirms project start, locks dates, and dispatches instant notifications to squad.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: IN_DEVELOPMENT
                </div>
              </div>

              {/* Step 7: Cross-Functional Execution */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      07
                    </span>
                    <Code2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">Sprint Execution</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Developers code, UI Designers refine assets, and QA Testers execute test cases on Kanban boards.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  Roles: Dev, Designer, Tester
                </div>
              </div>

              {/* Step 8: Completion Deliverable */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center border border-teal-500/30">
                      08
                    </span>
                    <FileCheck2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">Final Delivery Sign-Off</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Automated PDF audit reports, client delivery sign-off, budget reconciliations, and archiving.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  State: COMPLETED
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAMS SHOWCASE SECTION */}
        <section id="teams" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Dynamic Squads
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                  Engineering Teams & Roles
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  View squad allocation, member roles (Developer, UI Designer, Tester, Project Leader), and project assignments.
                </p>
              </div>

              <button
                onClick={onLogin}
                className="self-start md:self-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Users2 className="w-4 h-4" />
                Manage Teams in Console
              </button>
            </div>

            {/* Squads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Squad 1: Frontend Team */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      TEAM-FE
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Active (3 Projects)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Frontend Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Specialized in responsive React, TypeScript, Tailwind design systems & high-performance UI components.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Squad Members (5 Members):</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-blue-300 rounded border border-slate-700">Rohit Yadav (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Rahul Sharma (Developer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-purple-300 rounded border border-slate-700">Priya Singh (UI Designer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">Amit Kumar (Tester)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad 2: Backend Team */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      TEAM-BE
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Active (2 Projects)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Backend Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Core backend microservices, Spring Boot 3, high-throughput REST APIs, MySQL persistence & WebSocket pub/sub.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Squad Members (4 Members):</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-blue-300 rounded border border-slate-700">Siddharth Roy (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Neha Gupta (Developer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Rahul Verma (Developer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">Riya Sen (Tester)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad 3: UI/UX Team */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      TEAM-UI
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Active (2 Projects)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">UI/UX Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Design thinking, clickable Figma prototypes, user research, wireframing and design token governance.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Squad Members (3 Members):</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-blue-300 rounded border border-slate-700">Chloe Bennett (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-purple-300 rounded border border-slate-700">Priya Patel (UI Designer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-purple-300 rounded border border-slate-700">Ananya Joshi (UI Designer)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad 4: Testing Team */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      TEAM-QA
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Active (1 Project)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Testing Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated end-to-end testing, integration tests, performance benchmarking, regression & bug reporting.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Squad Members (4 Members):</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-blue-300 rounded border border-slate-700">David Kim (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">Amit Verma (Tester)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">Sneha Patel (Tester)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">Vikram Sen (Tester)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad 5: DevOps Team (Empty / Available) */}
              <div className="p-6 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      TEAM-OPS
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      Empty / Available (0 Projects)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">DevOps Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Currently available for assignment! CI/CD pipelines, Docker containerization, Kubernetes orchestration & cloud deployment.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Squad Members (2 Members):</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-blue-300 rounded border border-slate-700">Arjun Nair (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Mayank Tiwari (Developer)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad 6: Team 3 — Innovation Squad */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-500/60 hover:border-blue-400 transition-all flex flex-col justify-between shadow-xl shadow-blue-500/10">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                      TEAM-03
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Active (1 Project)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Team 3 — Full-Stack & Innovation</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Specialized squad for fast prototype creation, client-mandated wireframes, and enterprise execution.
                  </p>
                  
                  {/* Members list */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-blue-200">Complete Cross-Functional Squad:</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-blue-900/60 text-blue-200 rounded border border-blue-700">Aarav Mehta (Project Leader)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700">Marcus Reed (Developer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-900/50 text-purple-200 rounded border border-purple-700">Chloe Bennett (UI Designer)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-900/50 text-amber-200 rounded border border-amber-700">David Kim (Tester)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ENTERPRISE FEATURES SECTION */}
        <section id="features" className="py-20 bg-slate-900/40 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                Built for High-Velocity Enterprise Delivery
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Visual Analytics & 3 Graphs</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Real-time visualization of Team Workload, Team Status (Active vs Empty), and Projects by Team with interactive Recharts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Interactive Prototypes</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Teams submit live clickable prototypes directly to PM. Clients review and accept/reject before code is written.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Stage 7 Gate Governance</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Strict authorization barriers prevent unapproved development, keeping sprint deadlines and budgets accountable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & SECURITY SECTION */}
        <section id="about" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 text-center max-w-4xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Enterprise Grade Isolation & Security
              </h2>
              <p className="text-slate-300 text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
                Role-based access control guarantees strict privacy. Clients view only their authorized projects. Project Managers coordinate cross-team deliverables. Engineering squads execute tasks without cross-squad data exposure.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={onLogin}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  Enter Platform
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-400">NEXORA Platform</span>
            <span>• Enterprise Issue Tracking & Project Management</span>
          </div>
          <div>
            © {new Date().getFullYear()} Nexora Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
