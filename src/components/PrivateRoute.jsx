import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const PrivateRoute = () => {
  const { token } = useAuthStore();

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
