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
import Audit from './pages/Audit';
import Diseases from './pages/Diseases';
import MarketRates from './pages/MarketRates';
import Orders from './pages/Orders';
import Vets from './pages/Vets';

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
        <Route path="/vets" element={<Vets />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/market-rates" element={<MarketRates />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
