import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KidProvider } from './context/KidContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ParentLayout from './components/layout/ParentLayout';
import KidLayout from './components/layout/KidLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import OfflineBanner from './components/ui/OfflineBanner';
import InstallPrompt from './components/pwa/InstallPrompt';

// Route-level code splitting — each group loads as a separate chunk
const Login           = lazy(() => import('./pages/Login'));
const KidSelect       = lazy(() => import('./pages/KidSelect'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const KidHome         = lazy(() => import('./pages/KidHome'));
const ModuleIntro     = lazy(() => import('./pages/ModuleIntro'));
const LessonPlayer    = lazy(() => import('./pages/LessonPlayer'));
const MiniGame        = lazy(() => import('./pages/MiniGame'));
const ModuleComplete  = lazy(() => import('./pages/ModuleComplete'));
const CoinStore       = lazy(() => import('./pages/CoinStore'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const ClassroomDetail  = lazy(() => import('./pages/ClassroomDetail'));
const SchoolDashboard  = lazy(() => import('./pages/SchoolDashboard'));
const KidLeaderboard   = lazy(() => import('./pages/KidLeaderboard'));
const ParentClassrooms  = lazy(() => import('./pages/ParentClassrooms'));
const DailyChallenge    = lazy(() => import('./pages/DailyChallenge'));
const NotFound          = lazy(() => import('./pages/NotFound'));

// Ocean-themed loading fallback — matches app theme, no white flash
function OceanLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg,#8BD4F2 0%,#3BBFE8 60%,#E8C87A 88%,#D4A84B 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12, animation: 'float-soft 1.5s ease-in-out infinite' }}>🌊</div>
        <div style={{ fontSize: 18, color: '#fff', fontFamily: 'Fredoka, sans-serif', fontWeight: 700,
          textShadow: '0 2px 8px rgba(0,80,120,0.4)' }}>Loading...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <OfflineBanner />
      <AuthProvider>
        <KidProvider>
          <BrowserRouter>
            <Suspense fallback={<OceanLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Teacher routes */}
                <Route element={<ProtectedRoute requireRole="teacher" />}>
                  <Route element={<TeacherLayout />}>
                    <Route path="/teacher"                element={<TeacherDashboard />} />
                    <Route path="/teacher/classroom/:id"  element={<ClassroomDetail />} />
                    <Route path="/school"                 element={<SchoolDashboard />} />
                  </Route>
                </Route>

                {/* Parent routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<ParentLayout />}>
                    <Route path="/"            element={<KidSelect />} />
                    <Route path="/dashboard"   element={<ParentDashboard />} />
                    <Route path="/classrooms"  element={<ParentClassrooms />} />
                  </Route>
                </Route>

                {/* Kid play routes */}
                <Route element={<ProtectedRoute requireKid />}>
                  <Route element={<KidLayout />}>
                    <Route path="/play"                    element={<KidHome />} />
                    <Route path="/play/store"              element={<CoinStore />} />
                    <Route path="/play/daily"              element={<DailyChallenge />} />
                    <Route path="/play/leaderboard"        element={<KidLeaderboard />} />
                    <Route path="/play/:moduleSlug"        element={<ModuleIntro />} />
                    <Route path="/play/:moduleSlug/lesson" element={<LessonPlayer />} />
                    <Route path="/play/:moduleSlug/game"   element={<MiniGame />} />
                    <Route path="/play/:moduleSlug/done"   element={<ModuleComplete />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </KidProvider>
      </AuthProvider>
      <InstallPrompt />
    </>
  );
}
