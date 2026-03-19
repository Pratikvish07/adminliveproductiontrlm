import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/dashboard/Dashboard';
// Master
import District from '../pages/master/District.tsx';
import Block from '../pages/master/Block';
import Village from '../pages/master/Village';
import GramPanchayat from '../pages/master/GramPanchayat';
import MasterFilter from '../pages/master/MasterFilter';
// Staff
import AllUsers from '../pages/staff/AllUsers';
import StaffApproval from '../pages/staff/StaffApproval';
// SHG
import SHGList from '../pages/shg/SHGList';
import SHGDetails from '../pages/shg/SHGDetails';
// CRP
import CRPList from '../pages/crp/CRPList';
import CRPApproval from '../pages/crp/CRPApproval';
import CRPTracking from '../pages/crp/CRPTracking';
// Payment
import LoanTracking from '../pages/payment/LoanTracking';
import LoanApproval from '../pages/payment/LoanApproval';
import Payments from '../pages/payment/Payments';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Master */}
        <Route path="/master/district" element={<District />} />
        <Route path="/master/block" element={<Block />} />
        <Route path="/master/village" element={<Village />} />
        <Route path="/master/gram-panchayat" element={<GramPanchayat />} />
        <Route path="/master/filter" element={<MasterFilter />} />
        {/* Staff */}
        <Route path="/staff" element={<StaffApproval />} />
        <Route path="/staff/approval" element={<StaffApproval />} />
        <Route path="/staff/users" element={<AllUsers />} />
        {/* SHG */}
        <Route path="/shg/list" element={<SHGList />} />
        <Route path="/shg/details/:id" element={<SHGDetails />} />
        {/* CRP */}
        <Route path="/crp/list" element={<CRPList />} />
        <Route path="/crp/approval" element={<CRPApproval />} />
        <Route path="/crp/tracking" element={<CRPTracking />} />
        {/* Payment */}
        <Route path="/payment/loan-tracking" element={<LoanTracking />} />
        <Route path="/payment/loan-approval" element={<LoanApproval />} />
        <Route path="/payment/payments" element={<Payments />} />
      </Route>
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
