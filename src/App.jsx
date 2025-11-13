import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';
import ManageBeaches from './pages/ManageBeaches';
import ManageBookings from './pages/ManageBookings';
// import EditBooking from './pages/EditBooking';
import ManageFinance from './pages/ManageFinance';
import ManageAdmins from './pages/ManageAdmins';
import ManageIntegrations from './pages/ManageIntegrations';
import BookingDetail from './pages/BookingDetail';
import AddNewBeach from './pages/AddNewBeach';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/signin" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/manage-beaches" element={<PrivateRoute><ManageBeaches /></PrivateRoute>} />
        <Route path="/add-new-beach" element={<PrivateRoute><AddNewBeach /></PrivateRoute>} />
        <Route path="/edit-beach/:id" element={<PrivateRoute><AddNewBeach /></PrivateRoute>} />
        {/* <Route path="/editbooking/:id" element={<PrivateRoute><EditBooking /></PrivateRoute>} /> */}
        <Route path="/manage-bookings" element={<PrivateRoute><ManageBookings /></PrivateRoute>} />
        <Route path="/bookings/:id" element={<PrivateRoute><BookingDetail /></PrivateRoute>} />
        <Route path="/manage-finance" element={<PrivateRoute><ManageFinance /></PrivateRoute>} />
        <Route path="/manage-admins" element={<PrivateRoute><ManageAdmins /></PrivateRoute>} />
        <Route path="/manage-integrations" element={<PrivateRoute><ManageIntegrations /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
      <ToastContainer position="top-right" newestOnTop pauseOnFocusLoss autoClose={3000} />
    </Router>
  );
}

export default App;
