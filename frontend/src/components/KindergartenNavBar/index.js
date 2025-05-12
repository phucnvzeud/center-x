import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './KindergartenNavBar.css';

const KindergartenNavBar = () => {
  const location = useLocation();
  
  // Check if the current route is part of the kindergarten section
  const isKindergartenRoute = location.pathname.startsWith('/kindergarten');
  
  if (!isKindergartenRoute) {
    return null;
  }
  
  return (
    <nav className="kindergarten-navbar">
      <div className="kindergarten-navbar-container">
        <div className="kindergarten-navbar-logo">
          <NavLink to="/kindergarten">
            Kindergarten
          </NavLink>
        </div>
        
        <div className="kindergarten-navbar-links">
          <NavLink 
            to="/kindergarten/regions"
            className={({ isActive }) => 
              isActive || location.pathname.includes('/regions') ? "kinder-nav-link active" : "kinder-nav-link"
            }
          >
            Regions
          </NavLink>
          
          <NavLink 
            to="/kindergarten/schools"
            className={({ isActive }) => 
              isActive || location.pathname.includes('/schools') ? "kinder-nav-link active" : "kinder-nav-link"
            }
          >
            Schools
          </NavLink>
          
          <NavLink 
            to="/kindergarten/classes"
            className={({ isActive }) => 
              isActive || location.pathname.includes('/classes') ? "kinder-nav-link active" : "kinder-nav-link"
            }
          >
            Classes
          </NavLink>
        </div>
        
        <div className="kindergarten-navbar-actions">
          <NavLink to="/kindergarten/classes/new" className="kinder-nav-button">
            + New Class
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default KindergartenNavBar; 