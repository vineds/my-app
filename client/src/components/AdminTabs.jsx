import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/coupons', label: 'Coupons' }
];

export default function AdminTabs() {
  return (
    <div className="admin-tabs" data-testid="admin-tabs">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
          data-testid={`admin-tab-${tab.label.toLowerCase()}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
