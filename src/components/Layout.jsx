import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import TimeStatusWidget from './TimeStatusWidget';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Register Patient', href: '/add-patient', icon: UserPlus },
  { name: 'Enrollment Queue', href: '/enrollment-queue', icon: BarChart3 },
  { name: 'Enrolled Patients', href: '/enrolled-patients', icon: Users },
  { name: 'Care Plans', href: '/care-plan', icon: FileText },
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Communication', href: '/communication', icon: MessageSquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-64 max-w-xs bg-white h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold" style={{color: '#1E2A3A'}}>CCM System</h1>
            <button onClick={() => setSidebarOpen(false)} className="p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? {backgroundColor: '#1E2A3A'} : {}}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r" style={{backgroundColor: '#1E2A3A'}}>
          <div className="flex items-center justify-center h-16 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">CCM System</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-white/60 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-white/60 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 bg-white border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold" style={{color: '#1E2A3A'}}>CCM System</h1>
            <div className="flex items-center gap-4">
              <TimeStatusWidget />
              <button onClick={() => setSidebarOpen(true)} className="p-1">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        <main className="p-6">
          <div className="hidden lg:flex items-center justify-end mb-6 -mt-2 gap-4">
            <TimeStatusWidget />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}