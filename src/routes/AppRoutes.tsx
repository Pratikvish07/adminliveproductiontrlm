import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/dashboard/Dashboard';
import Village from '../pages/master/Village';
import GramPanchayat from '../pages/master/GramPanchayat';
// Staff
import AllUsers from '../pages/staff/AllUsers';
import StaffApproval from '../pages/staff/StaffApproval';
// CRP
import CRPList from '../pages/crp/CRPList';
import CRPApproval from '../pages/crp/CRPApproval';
import CRPTracking from '../pages/crp/CRPTracking';
import SHGMemberList from '../pages/crp/SHGMemberList';
// Payment
import LoanTracking from '../pages/payment/LoanTracking';
import LoanApproval from '../pages/payment/LoanApproval';
import Payments from '../pages/payment/Payments';
import Reports from '../pages/reports/Reports';
import Settings from '../pages/settings/Settings';
import { ROLE_IDS } from '../utils/roleAccess';

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
        <Route
          path="/master/village"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF, ROLE_IDS.BLOCK_STAFF]}><Village /></ProtectedRoute>}
        />
        <Route
          path="/master/gram-panchayat"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF, ROLE_IDS.BLOCK_STAFF]}><GramPanchayat /></ProtectedRoute>}
        />
        {/* Staff */}
        <Route
          path="/staff"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN]}><StaffApproval /></ProtectedRoute>}
        />
        <Route
          path="/staff/approval"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN]}><StaffApproval /></ProtectedRoute>}
        />
        <Route
          path="/staff/users"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN]}><AllUsers /></ProtectedRoute>}
        />
        {/* CRP */}
        <Route
          path="/crp/list"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF, ROLE_IDS.BLOCK_STAFF]}><CRPList /></ProtectedRoute>}
        />
        <Route
          path="/crp/approval"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.BLOCK_STAFF]}><CRPApproval /></ProtectedRoute>}
        />
        <Route
          path="/crp/tracking"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF, ROLE_IDS.BLOCK_STAFF]}><CRPTracking /></ProtectedRoute>}
        />
        <Route
          path="/crp/:crpId/shg-members"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF, ROLE_IDS.BLOCK_STAFF]}><SHGMemberList /></ProtectedRoute>}
        />
        {/* Payment */}
        <Route path="/payment/loan-tracking" element={<LoanTracking />} />
        <Route path="/payment/loan-approval" element={<LoanApproval />} />
        <Route path="/payment/payments" element={<Payments />} />
        <Route
          path="/reports"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN, ROLE_IDS.DISTRICT_STAFF]}><Reports /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute allowedRoles={[ROLE_IDS.STATE_ADMIN]}><Settings /></ProtectedRoute>}
        />
      </Route>
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
