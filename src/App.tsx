import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { useAuth } from './lib/auth';
import Batches from './pages/Batches';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Login from './pages/Login';
import Organizations from './pages/Organizations';
import Reports from './pages/Reports';
import Users from './pages/Users';

export default function App() {
  const { email } = useAuth();

  if (!email) return <Login />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
