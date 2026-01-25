
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Car, Plus, Calendar,
  Menu, X, LogOut, User, ChevronRight, Settings } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationProvider from '@/components/NotificationProvider';

const NAV_ITEMS = [
{
  name: 'Dashboard',
  page: 'Dashboard',
  icon: LayoutDashboard
},
{
  name: 'Novo Pedido',
  page: 'NewOrder',
  icon: Plus
},
{
  name: 'Agendamentos',
  page: 'Schedules',
  icon: Calendar
},
{
  name: 'Calculadora IPVA',
  page: 'IPVACalculator',
  icon: Car
},
{
  name: 'Configurações',
  page: 'Settings',
  icon: Settings
}];


export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Hide layout for public pages
  const publicPages = ['Tracking', 'Pedido'];
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50">
        <div className="h-full px-6 flex items-center justify-between max-w-[1400px] mx-auto">
          {/* Logo */}
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="text-2xl font-bold">
              <span className="text-slate-800">GRUPO</span>
              <span className="text-blue-600">TORIBA </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;

                return (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                  <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ${isActive ? 'text-blue-600 bg-blue-50' : ''}`}>

                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>);

              })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>

              {isMobileMenuOpen ?
                <X className="w-5 h-5" /> :

                <Menu className="w-5 h-5" />
                }
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex hover:bg-slate-100">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-700 max-w-[100px] truncate">
                    {user?.full_name || user?.email || 'Usuário'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 bg-white border-b shadow-lg z-40 md:hidden">

            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;

                return (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <div className={`
                      flex items-center justify-between p-3 rounded-lg transition-colors
                      ${isActive ?
                    'bg-emerald-50 text-emerald-700' :
                    'hover:bg-slate-50 text-slate-700'}
                    `}>
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>);

              })}
              
              <div className="pt-2 mt-2 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 w-full text-red-600 rounded-lg hover:bg-red-50">

                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </nav>
          </motion.div>
          }
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 min-h-screen bg-slate-50">
        {children}
      </main>
      </div>
      </NotificationProvider>);

}
