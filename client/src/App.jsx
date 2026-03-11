import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KidProvider } from './context/KidContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ParentLayout from './components/layout/ParentLayout';
import KidLayout from './components/layout/KidLayout';

import Login           from './pages/Login';
import KidSelect       from './pages/KidSelect';
import ParentDashboard from './pages/ParentDashboard';
import KidHome         from './pages/KidHome';
import ModuleIntro     from './pages/ModuleIntro';
import LessonPlayer    from './pages/LessonPlayer';
import MiniGame        from './pages/MiniGame';
import ModuleComplete  from './pages/ModuleComplete';
import CoinStore       from './pages/CoinStore';
import NotFound        from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <KidProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<ParentLayout />}>
                <Route path="/"          element={<KidSelect />} />
                <Route path="/dashboard" element={<ParentDashboard />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireKid />}>
              <Route element={<KidLayout />}>
                <Route path="/play"                    element={<KidHome />} />
                <Route path="/play/store"              element={<CoinStore />} />
                <Route path="/play/:moduleSlug"        element={<ModuleIntro />} />
                <Route path="/play/:moduleSlug/lesson" element={<LessonPlayer />} />
                <Route path="/play/:moduleSlug/game"   element={<MiniGame />} />
                <Route path="/play/:moduleSlug/done"   element={<ModuleComplete />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </KidProvider>
    </AuthProvider>
  );
}
