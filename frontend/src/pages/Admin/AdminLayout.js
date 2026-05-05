import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaBookOpen,
  FaSignOutAlt, FaUserEdit, FaCog
} from 'react-icons/fa';
import '../Student/StudentLayout.css'; // Tái sử dụng CSS giống Teacher & Student

const AdminLayout = () => {
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({
    hoTen: 'Nguyễn Việt Anh',
    anhDaiDien: 'https://i.pravatar.cc/150?img=8',
    maSo: 'Quản trị viên'
  });

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      setUserInfo(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="student-layout-container">
      <aside className="sidebar">

        {/* Avatar Admin */}
        <div className="sidebar-profile">
          <div className="avatar-circle">
            <img src={userInfo.anhDaiDien || "https://i.pravatar.cc/150?img=8"} alt="Admin Avatar" />
          </div>
          <h3 className="user-name">{userInfo.hoTen}</h3>
          <p className="user-code">{userInfo.maSo}</p>
        </div>

        {/* Menu Admin */}
        <ul className="sidebar-menu">
          <li>
            <Link
              to="/admin/dashboard"
              className={`menu-item ${location.pathname === '/admin/dashboard' || location.pathname === '/admin' ? 'active' : ''}`}
            >
              <FaTachometerAlt className="menu-icon" /> <span>Trang chính</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/users"
              className={`menu-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
            >
              <FaUsers className="menu-icon" /> <span>Quản lý người dùng</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/departments"
              className={`menu-item ${location.pathname === '/admin/departments' ? 'active' : ''}`}
            >
              <FaBookOpen className="menu-icon" /> <span>Quản lý khoa & lớp sinh viên</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/course-classes"
              className={`menu-item ${location.pathname === '/admin/course-classes' ? 'active' : ''}`}
            >
              <FaBookOpen className="menu-icon" /> <span>Quản lý lớp môn học & nhóm học tập</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/settings"
              className={`menu-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}
            >
              <FaCog className="menu-icon" /> <span>Cấu hình hệ thống & học kỳ</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/profile"
              className={`menu-item ${location.pathname === '/admin/profile' ? 'active' : ''}`}
            >
              <FaUserEdit className="menu-icon" /> <span>Hồ sơ cá nhân</span>
            </Link>
          </li>
          <li>
            <Link to="/login" className="menu-item">
              <FaSignOutAlt className="menu-icon" /> <span>Đăng xuất</span>
            </Link>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;