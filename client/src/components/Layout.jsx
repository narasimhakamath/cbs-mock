import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/logo-all-white.svg';
import { IconParties, IconAccounts, IconMenu } from './icons';

const navItems = [
  { to: '/parties', label: 'Parties', Icon: IconParties },
  { to: '/accounts', label: 'Accounts', Icon: IconAccounts },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={`shrink-0 bg-black text-neutral-300 flex flex-col transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div className={`flex items-center gap-2 px-3 py-6 ${collapsed ? 'justify-center' : ''}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          {!collapsed && <img src={logo} alt="VAM" className="h-12 w-auto" />}
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-md text-sm transition-colors ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
                }`
              }
            >
              <Icon className={collapsed ? 'h-6 w-6 shrink-0' : 'h-5 w-5 shrink-0'} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {!collapsed && <div className="px-5 py-4 text-xs text-neutral-500">CBS Mock by VAM</div>}
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
