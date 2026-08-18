import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/logo-all-white.png';
import { IconParties, IconAccounts, IconTransactions, IconMenu } from './icons';
import { useEnvironment, ENVIRONMENTS } from '../context/EnvironmentContext';

const navItems = [
  { to: '/parties', label: 'Parties', Icon: IconParties },
  { to: '/accounts', label: 'Accounts', Icon: IconAccounts },
  { to: '/transactions', label: 'Transactions', Icon: IconTransactions },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(true);
  const { environment, setEnvironment } = useEnvironment();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={`shrink-0 bg-primary text-neutral-300 flex flex-col transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div className={`flex items-center gap-2 px-3 py-6 ${collapsed ? 'justify-center' : ''}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
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
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:bg-white/10 hover:text-neutral-100'
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
        <div className="flex justify-end border-b border-neutral-200 bg-white px-8 py-3">
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            Environment
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
