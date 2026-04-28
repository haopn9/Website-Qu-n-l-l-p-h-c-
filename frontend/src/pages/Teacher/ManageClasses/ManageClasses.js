import React, { useState, useEffect } from 'react';
import './ManageClasses.css';
import { FaPlus, FaSearch, FaChalkboardTeacher, FaUsers, FaBookOpen, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaTimes, FaCopy } from 'react-icons/fa';

// ===== DỮ LIỆU GIẢ LẬP (Sẽ xóa dần khi có API) =====

const mockStudents = {
  1: [
    { userId: 101, userCode: 'SV001', fullName: 'Nguyễn Văn An', groupName: 'Nhóm 1' },
    { userId: 102, userCode: 'SV002', fullName: 'Trần Thị Bình', groupName: 'Nhóm 1' },
    { userId: 103, userCode: 'SV003', fullName: 'Lê Hoàng Cường', groupName: 'Nhóm 2' },
    { userId: 104, userCode: 'SV004', fullName: 'Phạm Minh Đức', groupName: 'Nhóm 2' },
    { userId: 105, userCode: 'SV005', fullName: 'Hoàng Thị Hoa', groupName: 'Nhóm 3' },
    { userId: 106, userCode: 'SV006', fullName: 'Võ Thanh Hùng', groupName: 'Chưa có nhóm' },
  ],
  2: [
    { userId: 201, userCode: 'SV010', fullName: 'Đỗ Quang Khải', groupName: 'Nhóm 1' },
    { userId: 202, userCode: 'SV011', fullName: 'Bùi Anh Tuấn', groupName: 'Nhóm 2' },
  ],
};

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('http://localhost:5186/api/LopHoc');
        if (res.ok) {
          const data = await res.json();
          // Map dữ liệu từ backend sang cấu trúc frontend đang dùng
          const mappedData = data.map(item => ({
            classId: item.maLop,
            classCode: item.maLopHoc,
            className: item.tenLop,
            semester: 'Chưa cập nhật',
            startDate: 'Chưa cập nhật',
            endDate: 'Chưa cập nhật',
            studentCount: 0,
            groupCount: 0,
            status: 'active',
            giangVien: item.giangVien
          }));
          setClasses(mappedData);
        }
      } catch (err) {
        console.error("Lỗi kết nối API:", err);
      }
    };
    fetchClasses();
  }, []);
  const [filterSemester, setFilterSemester] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    className: '', classCode: '', semester: 'HK2 2025-2026',
    startDate: '', endDate: ''
  });

  // ===== XỬ LÝ =====
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    // Payload theo DTO của Backend
    const payload = {
        TenLop: formData.className,
        MaLopHoc: formData.classCode,
        MaGiangVien: 1, // Fix cứng tạm do frontend chưa có chức năng chọn giảng viên
        MaHocKy: 1      // Fix cứng tạm
    };

    try {
        const res = await fetch('http://localhost:5186/api/LopHoc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            const data = await res.json();
            const newClass = {
                classId: data.maLop,
                className: formData.className,
                classCode: formData.classCode,
                semester: formData.semester,
                startDate: formData.startDate,
                endDate: formData.endDate,
                studentCount: 0, groupCount: 0, status: 'active'
            };
            setClasses([newClass, ...classes]);
            setIsCreateModalOpen(false);
            setFormData({ className: '', classCode: '', semester: 'HK2 2025-2026', startDate: '', endDate: '' });
            alert('Tạo lớp học thành công!');
        } else {
            alert('Có lỗi từ server khi tạo lớp!');
        }
    } catch (err) {
        console.error("Lỗi:", err);
        alert('Không thể kết nối đến API Backend!');
    }
  };

  const handleEditClass = (e) => {
    e.preventDefault();
    setClasses(classes.map(c => c.classId === selectedClass.classId ? { ...c, ...formData } : c));
    setIsEditModalOpen(false);
    alert('Cập nhật lớp học thành công!');
  };

  const handleDeleteClass = (classId) => {
    if (window.confirm('Bạn có chắc muốn xóa lớp học này?')) {
      setClasses(classes.filter(c => c.classId !== classId));
    }
  };

  const handleViewDetail = (cls) => {
    setSelectedClass(cls);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className, classCode: cls.classCode, semester: cls.semester,
      startDate: cls.startDate, endDate: cls.endDate
    });
    setIsEditModalOpen(true);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã lớp: ${code}`);
  };

  const handleRemoveStudent = (studentId) => {
    if (window.confirm('Xóa sinh viên khỏi lớp?')) {
      alert('Đã xóa sinh viên khỏi lớp!');
    }
  };

  // Filter
  const filteredClasses = classes.filter(c => {
    const matchSearch = c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.classCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSemester = filterSemester === 'all' || c.semester === filterSemester;
    return matchSearch && matchSemester;
  });

  // Stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalGroups = classes.reduce((sum, c) => sum + c.groupCount, 0);

  const semesters = [...new Set(classes.map(c => c.semester))];

  return (
    <div className="manage-classes-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý Lớp học</h2>
          <p className="page-subtitle">Tạo và quản lý các lớp học phần do bạn phụ trách</p>
        </div>
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <FaPlus /> Tạo lớp mới
        </button>
      </div>

      {/* THỐNG KÊ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FaChalkboardTeacher /></div>
          <div className="stat-info">
            <h4>Tổng lớp học</h4>
            <span className="stat-number">{totalClasses}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaBookOpen /></div>
          <div className="stat-info">
            <h4>Đang hoạt động</h4>
            <span className="stat-number">{activeClasses}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaUsers /></div>
          <div className="stat-info">
            <h4>Tổng sinh viên</h4>
            <span className="stat-number">{totalStudents}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaCalendarAlt /></div>
          <div className="stat-info">
            <h4>Tổng nhóm</h4>
            <span className="stat-number">{totalGroups}</span>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM + LỌC */}
      <div className="toolbar-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text" placeholder="Tìm kiếm lớp học..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="all">Tất cả học kỳ</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="data-table-wrapper">
        {filteredClasses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Không tìm thấy lớp học nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Tên môn học</th>
                <th>Học kỳ</th>
                <th>Sinh viên</th>
                <th>Nhóm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.classId}>
                  <td><span className="class-code-tag">{cls.classCode}</span></td>
                  <td><strong>{cls.className}</strong></td>
                  <td>{cls.semester}</td>
                  <td>{cls.studentCount}</td>
                  <td>{cls.groupCount}</td>
                  <td>
                    <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-ended'}`}>
                      {cls.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn view" title="Xem chi tiết" onClick={() => handleViewDetail(cls)}><FaEye /></button>
                      <button className="action-btn edit" title="Chỉnh sửa" onClick={() => handleOpenEdit(cls)}><FaEdit /></button>
                      <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteClass(cls.classId)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL TẠO LỚP MỚI */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo lớp học mới</h3>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mã lớp học *</label>
                    <input type="text" name="classCode" value={formData.classCode} onChange={handleFormChange} placeholder="VD: LTW01" required />
                  </div>
                  <div className="form-group">
                    <label>Tên môn học *</label>
                    <input type="text" name="className" value={formData.className} onChange={handleFormChange} placeholder="VD: Lập trình Web" required />
                  </div>
                  <div className="form-group">
                    <label>Học kỳ *</label>
                    <select name="semester" value={formData.semester} onChange={handleFormChange}>
                      <option value="HK2 2025-2026">HK2 2025-2026</option>
                      <option value="HK1 2025-2026">HK1 2025-2026</option>
                      <option value="HK1 2026-2027">HK1 2026-2027</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-save">Tạo lớp học</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA LỚP */}
      {isEditModalOpen && selectedClass && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa lớp học</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditClass}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mã lớp học</label>
                    <input type="text" name="classCode" value={formData.classCode} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Tên môn học</label>
                    <input type="text" name="className" value={formData.className} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Học kỳ</label>
                    <select name="semester" value={formData.semester} onChange={handleFormChange}>
                      <option value="HK2 2025-2026">HK2 2025-2026</option>
                      <option value="HK1 2025-2026">HK1 2025-2026</option>
                      <option value="HK1 2026-2027">HK1 2026-2027</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT LỚP + DANH SÁCH SINH VIÊN */}
      {isDetailModalOpen && selectedClass && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết lớp học</h3>
              <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="class-detail-header">
                <div className="class-code-display" title="Nhấn để sao chép" onClick={() => handleCopyCode(selectedClass.classCode)} style={{ cursor: 'pointer' }}>
                  <FaCopy style={{ marginRight: 8, fontSize: 14 }} />{selectedClass.classCode}
                </div>
                <div className="class-info">
                  <h4>{selectedClass.className}</h4>
                  <p>{selectedClass.semester} &nbsp;|&nbsp; {selectedClass.startDate} → {selectedClass.endDate}</p>
                </div>
              </div>

              <h4 style={{ marginBottom: 12, color: '#152259' }}>Danh sách sinh viên ({(mockStudents[selectedClass.classId] || []).length})</h4>

              {(mockStudents[selectedClass.classId] || []).length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có sinh viên trong lớp này</p>
                </div>
              ) : (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>MSSV</th>
                      <th>Họ và tên</th>
                      <th>Nhóm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mockStudents[selectedClass.classId] || []).map((sv, idx) => (
                      <tr key={sv.userId}>
                        <td>{idx + 1}</td>
                        <td><strong>{sv.userCode}</strong></td>
                        <td>{sv.fullName}</td>
                        <td>{sv.groupName}</td>
                        <td>
                          <button className="btn-sm danger" onClick={() => handleRemoveStudent(sv.userId)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsDetailModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;
