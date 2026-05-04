import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaUsers, FaChalkboardTeacher, FaCalendarAlt } from 'react-icons/fa';
import './styles/ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hocKyList, setHocKyList] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, semestersRes] = await Promise.all([
        fetch('http://localhost:5186/api/lophoc'),
        fetch('http://localhost:5186/api/lophoc/hocky')
      ]);

      if (semestersRes.ok) {
        setHocKyList(await semestersRes.json());
      }

      if (classesRes.ok) {
        const cls = await classesRes.json();
        setClasses(cls.map((item) => ({
          ...item,
          id: item.maLop,
          trangThai: item.trangThai || 'active'
        })));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu lớp học:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      classItem.tenLop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.maLopHoc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === 'all' || classItem.maHocKy === parseInt(selectedSemester, 10);
    const matchesStatus = selectedStatus === 'all' || classItem.trangThai === selectedStatus;
    return matchesSearch && matchesSemester && matchesStatus;
  });

  const statusLabel = (status) => {
    if (status === 'inactive') return 'Đã kết thúc';
    if (status === 'sap-dien-ra') return 'Sắp diễn ra';
    return 'Đang hoạt động';
  };

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu từ bảng LopHoc...</div>;
  }

  return (
    <div className="management-tab">
      <div className="page-header-modern">
        <div className="header-content">
          <h2>Quản lý lớp và nhóm</h2>
          <p>Danh sách thống kê lớp học và nhóm</p>
        </div>
      </div>

      <div className="toolbar-modern" style={{ justifyContent: 'flex-end' }}>
        <div className="search-filter-group">
          <div className="search-box-modern">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên lớp, mã lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>

          <select
            className="filter-select-modern"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="all">Tất cả học kỳ</option>
            {hocKyList.map((hk) => (
              <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}</option>
            ))}
          </select>

          <select
            className="filter-select-modern"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="sap-dien-ra">Sắp diễn ra</option>
            <option value="inactive">Đã kết thúc</option>
          </select>
        </div>
      </div>

      <div className="classes-grid-modern">
        {filteredClasses.map((classItem) => (
          <div key={classItem.id} className="class-card-modern">
            <div className="class-card-header">
              <div className="class-title">
                <h3>{classItem.tenLop}</h3>
                <span className="class-code">{classItem.maLopHoc}</span>
              </div>
              <span className={`status-badge-modern ${classItem.trangThai}`}>
                {statusLabel(classItem.trangThai)}
              </span>
            </div>

            <div className="class-card-body">
              <div className="class-info-row">
                <FaChalkboardTeacher className="info-icon" />
                <span>{classItem.tenGiangVien}</span>
              </div>
              <div className="class-info-row">
                <FaCalendarAlt className="info-icon" />
                <span>{classItem.tenHocKy}</span>
              </div>
              <div className="class-stats-modern">
                <div className="stat-item">
                  <FaUsers className="stat-icon" />
                  <span>{classItem.soSinhVien || 0} sinh viên</span>
                </div>
                <div className="stat-item">
                  <FaUsers className="stat-icon" />
                  <span>{classItem.soNhom || 0} nhóm</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy lớp học nào trong bảng LopHoc</p>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
