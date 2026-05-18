import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import { Outlet } from 'react-router-dom';

import Home from './pages/Home';
import Search from './pages/Search';
import Transport from './pages/Transport';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterUsername from './pages/RegisterUsername';
import Dashboard from './pages/Dashboard';
import AddListing from './pages/AddListing';
import Profile from './pages/Profile';
import ListingDetail from './pages/ListingDetail';
import GlobalAssistant from './components/GlobalAssistant';
import MobileNav from './components/MobileNav';
import Privacy from './pages/Privacy';
import MandiAlertsManager from './components/MandiAlertsManager';


import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSetup from './pages/admin/AdminSetup';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminTransporters from './pages/admin/AdminTransporters';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminAuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
          <Routes>
            {/* TopNav Layout for Public and User Routes */}
            <Route element={<div className="flex flex-col min-h-screen"><TopNav /><div className="flex-1 pb-16 md:pb-0"><Outlet /></div><div className="hidden md:block"><Footer /></div></div>}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/username" element={<RegisterUsername />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
              <Route path="/edit-listing/:id" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>

            {/* Admin Routes (public: login & setup) */}
            <Route path="/1234/admin" element={<AdminLogin />} />
            <Route path="/1234/admin/setup" element={<AdminSetup />} />

            {/* Admin Protected Routes */}
            <Route path="/1234/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/1234/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
            <Route path="/1234/admin/listings" element={<AdminProtectedRoute><AdminListings /></AdminProtectedRoute>} />
            <Route path="/1234/admin/transporters" element={<AdminProtectedRoute><AdminTransporters /></AdminProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <MandiAlertsManager />
          <GlobalAssistant />
          <MobileNav />
        </div>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;

