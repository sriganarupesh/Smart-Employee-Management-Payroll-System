import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'hr'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'hr', 'employee'] },
    { id: 'leaves', label: 'Leaves', icon: Calendar, roles: ['admin', 'hr', 'employee'] },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
    { id: 'performance', label: 'Performance', icon: TrendingUp, roles: ['admin', 'hr', 'employee'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-10">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-blue-600">HR Management System</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transition-transform duration-300 pt-16 lg:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
