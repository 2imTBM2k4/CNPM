import React from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { PlusCircle, UtensilsCrossed, ClipboardList, Store } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className='sidebar'>
      <nav className="sidebar-nav">
        <NavLink to='/add' className="sidebar-item">
          <PlusCircle size={20} />
          <span>Add Items</span>
        </NavLink>
        <NavLink to='/list' className="sidebar-item">
          <UtensilsCrossed size={20} />
          <span>Menu Items</span>
        </NavLink>
        <NavLink to='/orders' className="sidebar-item">
          <ClipboardList size={20} />
          <span>Orders</span>
        </NavLink>
        <NavLink to='/edit-restaurant' className="sidebar-item">
          <Store size={20} />
          <span>Restaurant</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
