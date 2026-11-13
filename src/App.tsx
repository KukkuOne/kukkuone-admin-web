import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { useAuth } from './lib/auth';
import Batches from './pages/Batches';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Organizations from './pages/Organizations';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Audit from './pages/Audit';
import AlertThresholds from './pages/AlertThresholds';
import Diseases from './pages/Diseases';
import MarketRates from './pages/MarketRates';
import Orders from './pages/Orders';
import Vets from './pages/Vets';
import { ForgotPassword, SetPassword } from './pages/SetPassword';
import SignIn from './pages/SignIn';

export default function App() {
  const { email } = useAuth();

  // Signed out, every console path shows sign-in in place, so a deep link
  // opens where it pointed once the code is accepted. A set-password link
  // works either way.
  return (
    <Routes>
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={email ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="*" element={email ? <Console /> : <SignIn />} />
    </Routes>
  );
}

function Console() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/users" element={<Users />} />
        <Route path="/vets" element={<Vets />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/alert-thresholds" element={<AlertThresholds />} />
        <Route path="/market-rates" element={<MarketRates />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
