import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnrolledPatients from './pages/EnrolledPatients';
import EnrollmentQueue from './pages/EnrollmentQueue';
import PatientDetail from './pages/PatientDetail';
import CarePlan from './pages/CarePlan';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Communication from './pages/Communication';
import AddPatient from './pages/AddPatient';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import DisenrollPatient from './pages/DisenrollPatient';
import PatientHub from './pages/PatientHub';


const queryClient = new QueryClient();

function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={
            token ? <Navigate to="/" /> : <Login />
          } />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/enrollment-queue" element={<EnrollmentQueue />} />
              <Route path="/add-patient" element={<AddPatient />} />
              <Route path="/enrolled-patients" element={<EnrolledPatients />} />
              <Route path="/patient/:id" element={<PatientHub />} />
              <Route path="/patient-hub/:id" element={<PatientHub />} />

              <Route path="/care-plan/:patientId?" element={<CarePlan />} />
              <Route path="/enrollment/disenroll/:enrollmentId" element={<DisenrollPatient />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;