import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all your components
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Policies from './components/Policies';
import Settings from './components/Settings';
import ParentChat from './components/ParentChat';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* The new root route that renders your Home.jsx landing page */}
        <Route path="/" element={<Home />} />
        
        {/* Public Auth Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Public Parent Chat Route */}
        <Route path="/chat/:studentId" element={<ParentChat />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="policies" element={<Policies />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}