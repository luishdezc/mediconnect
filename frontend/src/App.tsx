import React from 'react';
import Spinner from './components/ui/Spinner';
import { socketService } from './services/socketService';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage            from './pages/auth/LoginPage';
import RegisterPage         from './pages/auth/RegisterPage';
import PatientDashboard     from './pages/patient/PatientDashboard';
import DoctorSearch         from './pages/patient/DoctorSearch';
import AppointmentsPage     from './pages/patient/AppointmentsPage';
import MedicalRecordsPage   from './pages/patient/MedicalRecordsPage';
import DoctorDashboard      from './pages/doctor/DoctorDashboard';
import DoctorAppointments   from './pages/doctor/DoctorAppointments';
import DoctorPatientsPage   from './pages/doctor/DoctorPatients';
import SubscriptionPage     from './pages/doctor/SubscriptionPage';
import ChatPage             from './pages/shared/ChatPage';
import AdminDashboard       from './pages/admin/AdminDashboard';
import SetupAdminPage       from './pages/auth/SetupAdminPage';
import AvailabilityPage      from './pages/doctor/AvailabilityPage';
import DoctorProfile         from './pages/patient/DoctorProfile';
import MedicationsPage       from './pages/patient/MedicationsPage';
import PatientProfilePage    from './pages/patient/PatientProfile';
import DoctorCalendarPage    from './pages/doctor/DoctorCalendar';
import LandingPage           from './pages/auth/LandingPage';
import VideoPage             from './pages/shared/VideoPage';
import SettingsPage          from './pages/shared/SettingsPage';
import './styles/main.scss';

function RequireAuth({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

function RedirectIfAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

function OAuthCallback() {
  const { fetchMe } = useAuthStore();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role') || 'patient';
  useEffect(() => { fetchMe().then(() => { window.location.href = `/${role}/dashboard`; }); }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 48 }}>🏥</div>
      <p style={{ color: '#4a5568', fontSize: 16 }}>Iniciando sesión…</p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif', background: '#f7fafc' }}>
      <div style={{ fontSize: 72, fontWeight: 700, color: '#1a6b5c', fontFamily: 'Georgia,serif' }}>404</div>
      <h2 style={{ color: '#2d3748', margin: 0 }}>Página no encontrada</h2>
      <p style={{ color: '#718096', margin: 0 }}>La ruta que buscas no existe.</p>
      <a href="/" style={{ color: '#1a6b5c', fontWeight: 600, marginTop: 8 }}>← Volver al inicio</a>
    </div>
  );
}

function AppContent() {
  const { fetchMe, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe().then(() => {
        const { user } = useAuthStore.getState();
        if (user?._id) socketService.connect(user._id);
      });
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <Spinner size="full" label="Cargando MediConnect…" />;
  }

  return (
    <>
      <Routes>
        {/* Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login"         element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/register"      element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Patient */}
        <Route path="/patient/dashboard"    element={<RequireAuth roles={['patient']}><PatientDashboard /></RequireAuth>} />
        <Route path="/patient/doctors"      element={<RequireAuth roles={['patient']}><DoctorSearch /></RequireAuth>} />
        <Route path="/patient/appointments" element={<RequireAuth roles={['patient']}><AppointmentsPage /></RequireAuth>} />
        <Route path="/patient/records"      element={<RequireAuth roles={['patient']}><MedicalRecordsPage /></RequireAuth>} />
        <Route path="/patient/doctors/:id"  element={<RequireAuth roles={['patient']}><DoctorProfile /></RequireAuth>} />
        <Route path="/patient/chat"         element={<RequireAuth roles={['patient']}><ChatPage /></RequireAuth>} />

        {/* Doctor */}
        <Route path="/doctor/dashboard"     element={<RequireAuth roles={['doctor']}><DoctorDashboard /></RequireAuth>} />
        <Route path="/doctor/appointments"  element={<RequireAuth roles={['doctor']}><DoctorAppointments /></RequireAuth>} />
        <Route path="/doctor/patients"      element={<RequireAuth roles={['doctor']}><DoctorPatientsPage /></RequireAuth>} />
        <Route path="/doctor/chat"          element={<RequireAuth roles={['doctor']}><ChatPage /></RequireAuth>} />
        <Route path="/doctor/subscription"  element={<RequireAuth roles={['doctor']}><SubscriptionPage /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin/dashboard"         element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/users"             element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/doctors/pending"   element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />

        {/* Doctor availability */}
        <Route path="/doctor/availability" element={<RequireAuth roles={['doctor']}><AvailabilityPage /></RequireAuth>} />

        {/* Video calls - both roles */}
        <Route path="/doctor/video"  element={<RequireAuth roles={['doctor']}><VideoPage /></RequireAuth>} />
        <Route path="/patient/video" element={<RequireAuth roles={['patient']}><VideoPage /></RequireAuth>} />

        {/* Settings - all authenticated users */}
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

        {/* Patient profile */}
        <Route path="/patient/profile"      element={<RequireAuth roles={['patient']}><PatientProfilePage /></RequireAuth>} />
        <Route path="/patient/medications"  element={<RequireAuth roles={['patient']}><MedicationsPage /></RequireAuth>} />

        {/* Doctor calendar */}
        <Route path="/doctor/calendar" element={<RequireAuth roles={['doctor']}><DoctorCalendarPage /></RequireAuth>} />

        {/* Admin setup - first time only */}
        <Route path="/setup-admin" element={<SetupAdminPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#1a6b5c', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#e53e3e', secondary: '#fff' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
