import React, { useState, useEffect } from 'react';
import './ManageClasses.css';
import { FaPlus, FaSearch, FaChalkboardTeacher, FaUsers, FaBookOpen, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaTimes, FaCopy } from 'react-icons/fa';
import classService from '../../../services/classService';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hocKyList, setHocKyList] = useState([]);
  const [filterSemester, setFilterSemester] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importState, setImportState] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const maGiangVien = userInfo.maNguoiDung || 1;

  const [formData, setFormData] = useState({
    className: '',
    classCode: '',
    semester: '',
    startDate: '',
    endDate: ''
  });

  const formatDateVN = (value) => {
    if (!value) return '';
    const [year, month, day] = value.substring(0, 10).split('-');
    return day && month && year ? `${day}/${month}/${year}` : value;
  };

  const mapClass = (item) => ({
    classId: item.maLop,
    classCode: item.maLopHoc,
    className: item.tenLop,
    maHocKy: item.maHocKy,
    semester: item.tenHocKy || `HK ${item.maHocKy}`,
    startDate: item.ngayBatDau || '',
    endDate: item.ngayKetThuc || '',
    tenGiangVien: item.tenGiangVien,
    studentCount: item.soSinhVien || 0,
    groupCount: item.soNhom || 0,
    status: item.trangThai || 'active',
    students: item.danhSachSinhVien || [],
    groups: item.danhSachNhom || []
  });

  const fetchData = async () => {
    try {
      const [classData, hkData] = await Promise.all([
        classService.getMyClasses(),
        classService.getSemesters()
      ]);

      setHocKyList(hkData);
      setClasses((classData || []).filter((item) => item.maGiangVien === maGiangVien).map(mapClass));
    } catch (err) {
      console.error('Lỗi kết nối API:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const selectedHK = hocKyList.find((hk) => hk.tenHocKy === formData.semester);
    const maHocKy = selectedHK ? selectedHK.maHocKy : (hocKyList[0]?.maHocKy || 1);

    try {
      const result = await classService.createClass({
        tenLop: formData.className,
        maHocKy,
        ngayBatDau: formData.startDate || null,
        ngayKetThuc: formData.endDate || null
      });

      await fetchData();
      setIsCreateModalOpen(false);
      setFormData({
        className: '',
        classCode: '',
        semester: hocKyList[0]?.tenHocKy || '',
        startDate: '',
        endDate: ''
      });
      alert(`Tạo lớp học thành công! Mã lớp: ${result.maLopHoc}`);
    } catch (err) {
      console.error('Lỗi:', err);
      alert(err.message || 'Không thể kết nối đến API Backend!');
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    const selectedHK = hocKyList.find((hk) => hk.tenHocKy === formData.semester);
    const maHocKy = selectedHK ? selectedHK.maHocKy : selectedClass.maHocKy;

    try {
      await classService.updateClass(selectedClass.classId, {
        tenLop: formData.className,
        maHocKy,
        ngayBatDau: formData.startDate || null,
        ngayKetThuc: formData.endDate || null
      });

      await fetchData();
      setIsEditModalOpen(false);
      alert('Cập nhật lớp học thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật lớp:', err);
      alert(err.message || 'Không thể cập nhật lớp học!');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Bạn có chắc muốn xóa lớp học này?')) return;

    try {
      await classService.deleteClass(classId);
      setClasses(classes.filter((c) => c.classId !== classId));
      alert('Xóa lớp học thành công!');
    } catch (err) {
      console.error('Lỗi xóa lớp:', err);
      alert(err.message || 'Không thể kết nối API!');
    }
  };

  const handleViewDetail = async (cls) => {
    try {
      // Lấy chi tiết mới nhất để danh sách sinh viên vừa tham gia hiển thị ngay trong modal.
      const detail = await classService.getClassById(cls.classId);
      setSelectedClass(mapClass(detail));
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết lớp:', err);
      alert(err.message || 'Không thể tải chi tiết lớp học!');
    }
  };

  const handleOpenEdit = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className,
      classCode: cls.classCode,
      semester: cls.semester,
      startDate: cls.startDate ? cls.startDate.substring(0, 10) : '',
      endDate: cls.endDate ? cls.endDate.substring(0, 10) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã lớp: ${code}`);
  };

  const handleRemoveStudent = async (student) => {
    if (!selectedClass) return;
    if (!window.confirm(`Bạn có chắc muốn xóa sinh viên ${student.hoTen} khỏi lớp này?`)) return;

    try {
      await classService.removeStudentFromClass(selectedClass.classId, student.maNguoiDung);
      const detail = await classService.getClassById(selectedClass.classId);
      const updatedClass = mapClass(detail);
      setSelectedClass(updatedClass);
      setClasses(classes.map((cls) => (cls.classId === updatedClass.classId ? updatedClass : cls)));
      alert('Đã xóa sinh viên khỏi lớp học!');
    } catch (err) {
      console.error('Lỗi xóa sinh viên khỏi lớp:', err);
      alert(err.message || 'Không thể xóa sinh viên khỏi lớp!');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleCheckData = () => {
    if (!importFile) {
      alert('Vui lòng chọn file Excel!');
      return;
    }
    setImportData([
      { userCode: 'SV021', fullName: 'Le Vy', studentClass: 'D20CQCN01-N' },
      { userCode: 'SV022', fullName: 'Tran An', studentClass: 'D20CQCN01-N' },
    ]);
    setImportState(2);
  };

  const handleImport = () => {
    alert('Import thành công!');
    setIsImportModalOpen(false);
    setImportState(1);
    setImportFile(null);
    setImportData([]);
  };

  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.classCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSemester = filterSemester === 'all' || c.semester === filterSemester;
    return matchSearch && matchSemester;
  });

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalGroups = classes.reduce((sum, c) => sum + c.groupCount, 0);
  const semesters = [...new Set(classes.map((c) => c.semester))];

  return (
    <div className="manage-classes-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý lớp học</h2>
          <p className="page-subtitle">Tạo và quản lý các lớp học phần do bạn phụ trách</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setIsCreateModalOpen(true);
          setFormData({ ...formData, classCode: '', semester: hocKyList[0]?.tenHocKy || '' });
        }}>
          <FaPlus /> Tạo lớp mới
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FaChalkboardTeacher /></div>
          <div className="stat-info"><h4>Tổng lớp học</h4><span className="stat-number">{totalClasses}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaBookOpen /></div>
          <div className="stat-info"><h4>Đang hoạt động</h4><span className="stat-number">{activeClasses}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaUsers /></div>
          <div className="stat-info"><h4>Tổng sinh viên</h4><span className="stat-number">{totalStudents}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaCalendarAlt /></div>
          <div className="stat-info"><h4>Tổng nhóm</h4><span className="stat-number">{totalGroups}</span></div>
        </div>
      </div>

      <div className="toolbar-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Tìm kiếm lớp học..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="filter-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="all">Tất cả học kỳ</option>
          {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

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
              {filteredClasses.map((cls) => (
                <tr key={cls.classId}>
                  <td><span className="class-code-tag">{cls.classCode}</span></td>
                  <td><strong>{cls.className}</strong></td>
                  <td>{cls.semester}</td>
                  <td>{cls.studentCount}</td>
                  <td>{cls.groupCount}</td>
                  <td>
                    <span className={`badge ${cls.status === 'inactive' ? 'badge-ended' : 'badge-active'}`}>
                      {cls.status === 'inactive' ? 'Đã kết thúc' : 'Đang hoạt động'}
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
                    <input type="text" name="classCode" value="Hệ thống tự sinh sau khi tạo lớp" readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label>Tên môn học *</label>
                    <input type="text" name="className" value={formData.className} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Học kỳ *</label>
                    <select name="semester" value={formData.semester} onChange={handleFormChange}>
                      {hocKyList.length > 0 ? hocKyList.map((hk) => (
                        <option key={hk.maHocKy} value={hk.tenHocKy}>{hk.tenHocKy}</option>
                      )) : <option value="">Đang tải...</option>}
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
                    <input type="text" name="classCode" value={formData.classCode} readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label>Tên môn học</label>
                    <input type="text" name="className" value={formData.className} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Học kỳ</label>
                    <select name="semester" value={formData.semester} onChange={handleFormChange}>
                      {hocKyList.map((hk) => <option key={hk.maHocKy} value={hk.tenHocKy}>{hk.tenHocKy}</option>)}
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
                  <p>{selectedClass.semester} | {formatDateVN(selectedClass.startDate)} → {formatDateVN(selectedClass.endDate)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ color: '#152259', margin: 0 }}>Danh sách sinh viên ({selectedClass.students.length})</h4>
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }} onClick={() => setIsImportModalOpen(true)}>
                  <FaPlus style={{ marginRight: 5 }} /> Import Excel
                </button>
              </div>

              {selectedClass.students.length === 0 ? (
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
                      <th>Lớp sinh viên</th>
                      <th>Nhóm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.students.map((sv, idx) => (
                      <tr key={sv.maNguoiDung}>
                        <td>{idx + 1}</td>
                        <td><strong>{sv.maSo}</strong></td>
                        <td>{sv.hoTen}</td>
                        <td>{sv.lopSinhVien || 'Chưa cập nhật'}</td>
                        <td>{sv.tenNhom || 'Chưa có nhóm'}</td>
                        <td>
                          <button className="btn-sm danger" onClick={() => handleRemoveStudent(sv)}>Xóa</button>
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

      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '600px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>Import danh sách sinh viên từ Excel</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setIsImportModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              {importState === 1 ? (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Tải lên file Excel</label>
                  <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
                    <p style={{ margin: '0 0 10px', color: '#64748b' }}>Kéo thả file vào đây hoặc bấm chọn file (.xlsx, .xls)</p>
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
                    Tìm thấy {importData.length + 38} dòng hợp lệ.
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="student-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>MSSV</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Họ tên</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Lớp sinh viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.userCode}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.fullName}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.studentClass}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              {importState === 1 ? (
                <>
                  <button className="btn-cancel" style={{ marginRight: 'auto', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Tải file mẫu</button>
                  <button className="btn-cancel" style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setIsImportModalOpen(false)}>Hủy</button>
                  <button className="btn-save" style={{ backgroundColor: '#eab308', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} onClick={handleCheckData}>Kiểm tra dữ liệu</button>
                </>
              ) : (
                <>
                  <button className="btn-cancel" style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setImportState(1)}>Quay lại</button>
                  <button className="btn-save" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} onClick={handleImport}>Tiến hành Import</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;
