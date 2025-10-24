import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  CheckSquare,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Leaf,
  LogOut,
  Bell,
  Menu,
  Sun,
  Moon,
  Users,
  X,
  Check,
  Trash2,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks' },
    { icon: MessageSquare, label: 'Team Chat', href: '/dashboard/chat' },
    { icon: Calendar, label: 'Leaves', href: '/dashboard/leaves' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  // Add Role Management for admins
  if (user?.role === 'admin') {
    menuItems.push({ icon: Users, label: 'Role Management', href: '/dashboard/roles' });
  }

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 p-6 border-b border-green-700">
        <Leaf className="w-6 h-6 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">AskEva</h1>
          <p className="text-xs text-green-100">Manager Suite</p>
        </div>
      </Link>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-green-500 text-white'
                  : 'text-green-100 hover:bg-green-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-green-700 space-y-3">
        <div className="text-xs text-green-100">
          <p className="font-medium">{user?.name}</p>
          <p className="text-green-200">{user?.role}</p>
        </div>
      </div>
    </div>
  );

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-green-600 dark:bg-green-900 flex-col">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="bg-green-600 dark:bg-green-900 h-full text-white">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {menuItems.find((item) => isActive(item.href))?.label || 'Dashboard'}
              </h2>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Role Badge */}
              {user?.role && (
                <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : user.role === 'manager'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 border-2 border-white dark:border-gray-800"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[500px] p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-7"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                          <Bell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-gray-700">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              !notification.read ? 'bg-teal-50 dark:bg-teal-900/10' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatNotificationTime(notification.createdAt)}
                                  </p>
                                  <div className="flex gap-1">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification._id)}
                                        className="h-6 px-2 text-xs"
                                        title="Mark as read"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => clearNotification(notification._id)}
                                      className="h-6 px-2 text-xs hover:text-red-600 dark:hover:text-red-400"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {user?.profilePhoto && (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="hidden sm:inline text-gray-700 dark:text-gray-300">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
