import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = {
    admin: [
      { path: '/dashboard/analytics', label: 'Analytics' },
      { path: '/dashboard/admins', label: 'Manage Admins' },
      { path: '/dashboard/couriers', label: 'Manage Couriers' },
      { path: '/dashboard/sellers', label: 'Manage Sellers' },
      { path: '/dashboard/buyers', label: 'Manage Buyers' },
      { path: '/dashboard/categories', label: 'Manage Categories' },
      { path: '/dashboard/orders', label: 'Manage Orders' },
      { path: '/dashboard/products', label: 'Manage Products' },
      { path: '/dashboard/profile', label: 'My Profile' },
    ],
    seller: [
      { path: '/dashboard/analytics', label: 'Analytics' },
      { path: '/dashboard/seller-products', label: 'My Products' },
      { path: '/dashboard/seller-orders', label: 'My Orders' },
      { path: '/dashboard/profile', label: 'My Profile' },
    ],
    courier: [
      { path: '/dashboard/analytics', label: 'Analytics' },
      { path: '/dashboard/deliveries', label: 'My Deliveries' },
      { path: '/dashboard/profile', label: 'My Profile' },
    ],
  };

  if (!user || user.role === 'buyer') return null;

  return (
    <div className="drawer-side">
      <label htmlFor="sidebar" className="drawer-overlay"></label>
      <ul className="menu p-4 w-64 bg-base-100 h-full text-base-content">
        <li className="mb-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
        </li>
        {navItems[user.role]?.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? 'bg-primary text-white' : '')}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
        <li className="mt-auto">
          <button onClick={logout} className="flex items-center">
            <LogOut className="mr-2" size={20} /> Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;