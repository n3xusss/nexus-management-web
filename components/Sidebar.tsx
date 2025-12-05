// app/global/components/Sidebar.tsx
'use client';

import { useAuth } from '../lib/stores/authStore';
import AdminSidebar from './role-based/AdminSidebar';
import MemberSidebar from './role-based/MemberSidebar';

export default function Sidebar() {
  const { user } = useAuth();

  // Show AdminSidebar for admin, MemberSidebar for member , we will handle manager later
  if (user?.role === 'admin') {
    return <AdminSidebar />;
  }

  return <MemberSidebar />;
}