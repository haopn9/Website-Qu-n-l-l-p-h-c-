import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
// Import icon riêng cho Giảng viên
import { FaHome, FaChalkboard, FaBookOpen, FaUsers, FaChartLine, FaUserEdit, FaSignOutAlt } from 'react-icons/fa';
import '../Student/StudentLayout.css'; // Tái sử dụng CSS

const TeacherLayout = () => {
  const [userInfo, setUserInfo] = useState({
    hoTen: 'Thầy Minh Khang',
    anhDaiDien: 'https://i.pravatar.cc/150?img=3',
    maSo: 'GV00123'
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

        {/* Avatar Giảng viên */}
        <div className="sidebar-profile">
          <div className="avatar-circle">
            <img src={userInfo.anhDaiDien || "https://i.pravatar.cc/150?img=3"} alt="Teacher Avatar" />
          </div>
          <h3 className="user-name">{userInfo.hoTen}</h3>
          <p className="user-code">{userInfo.maSo}</p>
        </div>

        {/* Menu Giảng viên */}
        <ul className="sidebar-menu">
          <li>
            <Link to="/teacher/dashboard" className="menu-item">
              <FaHome className="menu-icon" /> <span>Trang chính</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/manage-classes" className="menu-item">
              <FaChalkboard className="menu-icon" /> <span>Quản lý Lớp học</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/manage-topics" className="menu-item">
              <FaBookOpen className="menu-icon" /> <span>Quản lý Đề tài</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/manage-groups" className="menu-item">
              <FaUsers className="menu-icon" /> <span>Quản lý Nhóm học tập</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/tracking" className="menu-item">
              <FaChartLine className="menu-icon" /> <span>Giám sát & Đánh giá</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/profile" className="menu-item">
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

export default TeacherLayout;