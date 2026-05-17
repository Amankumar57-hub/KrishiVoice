import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, Truck, Mic } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', labelHi: 'होम', path: '/' },
  { icon: Search, label: 'Search', labelHi: 'खोज', path: '/search' },
  null, // center mic placeholder
  { icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड', path: '/dashboard' },
  { icon: Truck, label: 'Transport', labelHi: 'परिवहन', path: '/transport' },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuthContext();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      {/* Safe area for modern phones */}
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map((item, i) => {
          // Center mic button
          if (item === null) {
            return (
              <div key="center" className="flex-1 flex items-center justify-center relative">
                {/* Elevated center button */}
                <div className="absolute -top-5">
                  <a
                    href="#voice-section"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('voice-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        // Navigate to home and scroll
                        window.location.href = '/#voice-section';
                      }
                    }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg border-4 border-white active:scale-95 transition-transform"
                  >
                    <Mic size={22} className="text-white" />
                  </a>
                </div>
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={user || item.path === '/' || item.path === '/search' || item.path === '/transport' ? item.path : '/login'}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95"
            >
              <Icon
                size={20}
                className={active ? 'text-green-600' : 'text-gray-400'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[9px] font-bold leading-none ${active ? 'text-green-600' : 'text-gray-400'}`}>
                {item.labelHi}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-green-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Bottom safe area padding for notched phones */}
      <div className="h-safe-area-inset-bottom bg-white" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
