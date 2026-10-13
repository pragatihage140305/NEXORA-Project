# Nexora — Enterprise Issue Tracking, Project Management & Automated Reporting Platform

Nexora is a complete, modern, responsive, enterprise-grade **Issue Tracking & Project Management Platform** built with **Java Spring Boot 3** and **React 18 / TypeScript / Tailwind CSS**.

---

## 🌟 Key Platform Capabilities

1. **Dedicated Authentication & Account Creation Page**:
   - **Sign In / Log In**: Work email & password input, plus instant 1-click demo role logins.
   - **Create New Account / Register**: Name, email, password, role selection (Client, Team Member, PM, Admin), job title, and department with backend BCrypt hashing and JWT session issuance.
   - **Modern Left Sidebar**: All navigation tabs (Dashboards, Projects, Teams & Workload, Sprint Issues, Timeline & Gantt, Reports & Analytics) relocated into an enterprise collapsible sidebar with live STOMP status and quick-switch capabilities.
   - **Minimalist Top Navbar**: Clean header containing **only the Project Name / Branding** on the left and **User Login Details & Profile Actions** (avatar, name, role badge, email, notifications bell, and logout button) on the right.

2. **Four Specialized Dashboards**:
   - **Admin Dashboard**: Organization-wide visibility, multi-project health, financial tracking (approved budgets vs recorded expenses), sprint issue breakdown, prototype approval status, live compliance audit trail.
   - **Client Dashboard**: Strictly scoped project portfolio, project submission with auto-generated Initial Project Assessment Report, interactive prototype review and approval/revision actions.
   - **Project Manager Dashboard**: Assigned projects tracking across the 10-stage lifecycle, milestone planning, dynamic team management, and the **Stage 7 Formal Development Authorization Gate**.
   - **Team Member Dashboard**: Personalized sprint assignments, drag-and-drop Kanban board, blocker reporting with mandatory reasons, effort time logging, and Stage 4 prototype submission.

2. **Dynamic Team Creation & Workload Optimization**:
   - **"+ Create New Team"**: Create unlimited engineering teams (no hardcoded limits).
   - Configurable job roles (Developers, Testers, UI/UX Designers, QA, DevOps, SRE).
   - Member addition, transfer, and removal with **active task safety validation**.
   - **Intelligent Workload Recommendation Algorithm**: Computes `remaining estimated hours / weekly available capacity`, skills matching, and active blockers to recommend optimal delivery teams with clear rationale.

3. **10-Stage Project Lifecycle & Governance Gates**:
   - `Stage 1: SUBMITTED` (Client submits project -> auto-generates Initial Assessment Report)
   - `Stage 2: UNDER_REVIEW` (PM accepts, rejects with reason, or requests info)
   - `Stage 3: PLANNING` (Define scope, milestones, and team assignments)
   - `Stage 4: PROTOTYPE_IN_PROGRESS` (Engineering creates clickable wireframes)
   - `Stage 5: AWAITING_CLIENT_APPROVAL` (PM reviews and submits to client)
   - `Stage 6: PROTOTYPE_APPROVED` / `PROTOTYPE_REVISION_REQUESTED` (Client approval cycle)
   - `Stage 7: FORMAL DEVELOPMENT AUTHORIZATION GATE`:
     - PM clicks **"Authorize Development & Notify Client"**
     - Strict backend verification: approved prototype version required, milestones defined, primary team assigned, start date set.
     - **Enforced on Backend**: Development tasks cannot enter `IN_PROGRESS` before valid client approval and Stage 7 authorization!
   - `Stage 8: IN_DEVELOPMENT` (Execution of sprint tasks, sprints, time tracking)
   - `Stage 9: TESTING_QA` (Defect tracking with **QA Verification Gate**: fixing a bug does NOT automatically mark QA passed)
   - `Stage 10: COMPLETED` (Deliverables verified, final closure report auto-generated)

4. **10 Standardized Automated Report Types**:
   - Initial Project Assessment Report
   - Project Planning Report
   - Budget and Cost Report
   - Team Workload Report
   - Prototype Review Report
   - Development Progress Report
   - Issue and Bug Report
   - Timeline and Deadline Report
   - Testing and QA Report
   - Final Project Closure Report
   - **Export Formats**: One-click **PDF** (rendered via OpenPDF) and **Excel** (rendered via Apache POI).

5. **Budget & Financial Management**:
   - Tracks client-proposed budget, approved budget, estimated development cost, hourly rates, and recorded expense ledger.

6. **Real-Time Synchronized Dashboards**:
   - Spring WebSocket with STOMP message broker. Scoped rooms for organization, projects, teams, and user notifications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 21, Spring Boot 3.2.4, Spring Security 6 (Stateless JWT + HttpOnly Cookies), Spring Data JPA, Spring WebSocket/STOMP, OpenPDF, Apache POI |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, SockJS |
| **Database** | Embedded zero-config H2 (file-based persistent mode) with out-of-the-box MySQL 8.0 profile support |
| **Security** | BCrypt password hashing, JWT signed with HMAC-SHA256, HttpOnly cookies, CORS policies, Role-Based Access Control (`@PreAuthorize`) |

---

## 🚀 Quick Start & How to Run

### Option 1: One-Click Executable (Embedded Full-Stack JAR)
The React frontend is pre-compiled and bundled inside the Spring Boot static resources:

```powershell
# Run the application (starts embedded Tomcat on http://localhost:8080)
java -jar backend/target/nexora-backend-1.0.0.jar
```
Or simply run:
```powershell
.\start.ps1
```

Open your browser at: **[http://localhost:8080](http://localhost:8080)**

---

### Option 2: Full Development Mode (Separate Frontend & Backend Dev Servers)

#### Terminal 1: Backend
```powershell
cd backend
mvn spring-boot:run
```

#### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Frontend dev server runs at: **[http://localhost:5173](http://localhost:5173)** (automatically proxies `/api` and `/ws` to port 8080).

---

## 🔑 Default Seeded Accounts

The application automatically seeds 4 primary role accounts and sample engineering personnel upon first startup:

| Role | Email | Password | Persona |
|---|---|---|---|
| **Admin** | `admin@nexora.com` | `admin123` | Sarah Jenkins (VP of Engineering) |
| **Project Manager** | `pm@nexora.com` | `pm123` | Alex Vance (Lead Technical PM) |
| **Client** | `client@nexora.com` | `client123` | Elena Rostova (Director of Technology) |
| **Team Member** | `member@nexora.com` | `member123` | Marcus Reed (Senior Full-Stack Engineer) |

> 💡 **Instant Role Switcher**: Use the quick pill switcher in the top bar of the application to test any role with a single click.

---

## 📁 Project Architecture

```
nexora-final/
├── backend/
│   ├── src/main/java/com/nexora/
│   │   ├── config/             # DataSeeder, WebConfig (SPA forwarding)
│   │   ├── controller/         # Auth, Project, Team, Issue, Report, Dashboard controllers
│   │   ├── model/              # User, Project, Team, TeamMember, TaskIssue, Prototype, Report, AuditLog
│   │   ├── model/enums/        # ProjectStage (10 stages), IssueStatus, IssueType, Priority, ReportType
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── security/           # JwtUtils, AuthTokenFilter, SecurityConfig, UserDetailsServiceImpl
│   │   ├── service/            # ProjectService, TeamService, IssueService, ReportService, AuditService
│   │   ├── service/dto/        # Typed DTOs and records
│   │   └── websocket/          # WebSocketConfig, RealtimeEventService (STOMP broker)
│   └── pom.xml                 # Maven build with Spring Boot 3, OpenPDF, Apache POI, H2/MySQL
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # AdminDashboard (Charts, Metrics, Audit log stream)
│   │   │   ├── client/         # ClientDashboard (Submissions, Prototype review/approval)
│   │   │   ├── pm/             # PmDashboard (Stage 7 gate), TeamManagement (Dynamic teams)
│   │   │   ├── member/         # TeamMemberDashboard (Kanban, Time logger, Blockers)
│   │   │   ├── issues/         # IssuesPage (Table/Kanban, QA verification gate)
│   │   │   ├── reports/        # ReportsPage (10 Report types, PDF/Excel download, Expenses)
│   │   │   ├── timeline/       # TimelinePage (Gantt-style milestone schedule)
│   │   │   └── common/         # Navbar, Badge, Modal, StatCard
│   │   ├── context/            # AuthContext, WebSocketContext
│   │   ├── services/           # api.ts (Axios with credentials)
│   │   └── types/              # index.ts (TypeScript models)
│   └── package.json
├── .env.example
├── start.ps1
└── README.md
```
