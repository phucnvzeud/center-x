import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Courses from './pages/Courses';
import Branches from './pages/Branches';
import CourseForm from './pages/CourseForm';
import CourseDetail from './pages/CourseDetail';
import Sessions from './pages/Sessions';
import TeachersManagement from './pages/TeachersManagement';
import TeacherSchedule from './pages/TeacherSchedule';
import KindergartenDashboard from './pages/KindergartenDashboard';
import RegionList from './pages/RegionList';
import RegionForm from './pages/RegionForm';
import SchoolList from './pages/SchoolList';
import SchoolForm from './pages/SchoolForm';
import ClassList from './pages/ClassList';
import ClassForm from './pages/ClassForm';
import ClassDetail from './pages/ClassDetail';
import Notifications from './pages/Notifications';
import { NotificationProvider } from './context/NotificationContext';
import NotificationIcon from './components/NotificationIcon';
import KindergartenNavBar from './components/KindergartenNavBar';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <NotificationProvider>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="header-top">
              <div className="logo">
                <span className="logo-icon">🏫</span>
                <h1>Language Center Management</h1>
              </div>
              <div className="header-actions">
                <NotificationIcon />
                <button className="menu-toggle" onClick={toggleMenu}>
                  <span className="hamburger-icon">
                    <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
                  </span>
                </button>
              </div>
            </div>
            <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
              <ul>
                <li><Link to="/" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                <li><Link to="/teachers" onClick={() => setMenuOpen(false)}>Teachers</Link></li>
                <li><Link to="/teachers/manage" onClick={() => setMenuOpen(false)}>Manage Teachers</Link></li>
                <li><Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link></li>
                <li><Link to="/kindergarten" onClick={() => setMenuOpen(false)}>Kindergarten Classes</Link></li>
                <li><Link to="/branches" onClick={() => setMenuOpen(false)}>Branches</Link></li>
              </ul>
            </nav>
          </header>
          
          <KindergartenNavBar />
          
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/teachers/manage" element={<TeachersManagement />} />
              <Route path="/teachers/:teacherId/schedule" element={<TeacherSchedule />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/new" element={<CourseForm />} />
              <Route path="/courses/edit/:courseId" element={<CourseForm />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/sessions" element={<Sessions />} />
              <Route path="/kindergarten" element={<KindergartenDashboard />} />
              <Route path="/kindergarten/regions" element={<RegionList />} />
              <Route path="/kindergarten/regions/new" element={<RegionForm />} />
              <Route path="/kindergarten/regions/edit/:regionId" element={<RegionForm />} />
              <Route path="/kindergarten/regions/:regionId/schools" element={<SchoolList />} />
              <Route path="/kindergarten/schools" element={<SchoolList />} />
              <Route path="/kindergarten/schools/new" element={<SchoolForm />} />
              <Route path="/kindergarten/schools/edit/:schoolId" element={<SchoolForm />} />
              <Route path="/kindergarten/schools/:schoolId/classes" element={<ClassList />} />
              <Route path="/kindergarten/classes" element={<ClassList />} />
              <Route path="/kindergarten/classes/new" element={<ClassForm />} />
              <Route path="/kindergarten/classes/edit/:classId" element={<ClassForm />} />
              <Route path="/kindergarten/classes/:classId" element={<ClassDetail />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </main>
          
          <footer className="app-footer">
            <p>&copy; 2024 Language Center Management System</p>
          </footer>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;