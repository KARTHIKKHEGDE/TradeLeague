import { ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export default function Layout({ children, showNavbar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  );
}