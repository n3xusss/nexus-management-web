'use client';

import { useAuth } from '../lib/stores/authStore';
import AdminSidebar from './role-based/AdminSidebar';
import MemberSidebar from './role-based/MemberSidebar';
import ManagerSidebar from './role-based/ManagerSidebar';
export default function Sidebar() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminSidebar />;
  }

  if (user?.role === 'manager') {
    return <ManagerSidebar />;
  }

  return <MemberSidebar />;
}