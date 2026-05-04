import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaChalkboardTeacher, FaUserGraduate, FaBookOpen,
  FaUsersCog, FaTasks, FaArrowUp, FaEye
} from 'react-icons/fa';
import './styles/Dashboard.css';
import adminService from '../../services/adminService';
import classService from '../../services/classService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalGroups: 0,
    activeGroups: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalMessages: 0,
  });

  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, classesData] = await Promise.all([
          adminService.getDashboardStats(),
          classService.getAllClasses()
        ]);

        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalTeachers: statsData.totalTeachers || 0,
          totalStudents: statsData.totalStudents || 0,
          totalClasses: statsData.totalClasses || 0,
          totalGroups: statsData.totalGroups || 0,
          activeGroups: statsData.activeGroups || 0,
          pendingTasks: statsData.pendingTasks || 0,
          overdueTasks: statsData.overdueTasks || 0,
          totalMessages: statsData.totalMessages || 0,
        });

        setRecentClasses(
          (classesData || []).slice(0, 3).map((classItem) => ({
            id: classItem.maLop,
            name: classItem.tenLop,
            code: classItem.maLopHoc,
            teacher: classItem.tenGiangVien,
            students: classItem.soSinhVien || 0,
            groups: classItem.soNhom || 0,
            status: classItem.trangThai === 'inactive' ? 'inactive' : 'active'
          }))
        );
      } catch (err) {
        setError('Không thể tải dữ liệu: ' + (err.message || 'Lỗi server'));
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header-modern">
        <div className="header-content">
          <h2>Trang chủ</h2>
          <p>Chào mừng! Đây là tổng quan về hệ thống quản lý lớp học.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaUsers /></div>
          <div className="stat-info">
            <h3>Tổng người dùng</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <span className="stat-change positive"><FaArrowUp /> từ bảng NguoiDung</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaChalkboardTeacher /></div>
          <div className="stat-info">
            <h3>Giảng viên</h3>
            <p className="stat-number">{stats.totalTeachers}</p>
            <span className="stat-change">MaVaiTro = 2</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaUserGraduate /></div>
          <div className="stat-info">
            <h3>Sinh viên</h3>
            <p className="stat-number">{stats.totalStudents}</p>
            <span className="stat-change">MaVaiTro = 3</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaBookOpen /></div>
          <div className="stat-info">
            <h3>Lớp học</h3>
            <p className="stat-number">{stats.totalClasses}</p>
            <span className="stat-change">từ bảng LopHoc</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon info"><FaUsersCog /></div>
          <div className="stat-info">
            <h3>Nhóm học tập</h3>
            <p className="stat-number">{stats.totalGroups}</p>
            <span className="stat-change">{stats.activeGroups} nhóm đang hoạt động</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FaTasks /></div>
          <div className="stat-info">
            <h3>Công việc</h3>
            <p className="stat-number">{stats.pendingTasks}</p>
            <span className="stat-change negative">{stats.overdueTasks} trễ hạn</span>
          </div>
        </div>
      </div>

      <div className="classes-grid-modern">
        {recentClasses.map((classItem) => (
          <div key={classItem.id} className="class-card-modern">
            <div className="class-card-header">
              <div className="class-title">
                <h3>{classItem.name}</h3>
                <span className="class-code">{classItem.code}</span>
              </div>
              <span className={`status-badge-modern ${classItem.status}`}>
                {classItem.status === 'active' ? 'Đang hoạt động' : 'Kết thúc'}
              </span>
            </div>

            <div className="class-card-body">
              <div className="class-info-row">
                <FaChalkboardTeacher className="info-icon" />
                <span>{classItem.teacher}</span>
              </div>
              <div className="class-stats-modern">
                <div className="stat-item">
                  <FaUsers className="stat-icon" />
                  <span>{classItem.students} sinh viên</span>
                </div>
                <div className="stat-item">
                  <FaUsersCog className="stat-icon" />
                  <span>{classItem.groups} nhóm</span>
                </div>
              </div>
            </div>

            <div className="class-card-footer">
              <Link to={`/admin/classes/${classItem.id}`} className="action-btn view">
                <FaEye /> Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <Link to="/admin/classes" className="btn-view-all">
          Xem tất cả lớp học
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
