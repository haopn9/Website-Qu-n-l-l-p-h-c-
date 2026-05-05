import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTrash, FaEdit, FaBuilding, FaChalkboardTeacher, FaUsers, FaCheck, FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import './styles/SystemSettings.css';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptDetails, setDeptDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');

  // Thêm Khoa
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Sửa Khoa
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');

  // Lớp HC
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [editingClassCode, setEditingClassCode] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Sinh viên
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      fetchDeptDetails(selectedDeptId);
    } else {
      setDeptDetails(null);
      setEditingClassCode(null);
    }
  }, [selectedDeptId]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:5186/api/khoa');
      if (res.ok) setDepartments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeptDetails = async (id) => {
    try {
      const res = await fetch(`http://localhost:5186/api/khoa/${id}`);
      if (res.ok) setDeptDetails(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // KHOA
  // ==========================================
  const handleAddDept = async () => {
    if (!newDeptName || !newDeptCode) return alert('Vui lòng nhập tên và ký hiệu khoa');
    try {
      const res = await fetch('http://localhost:5186/api/khoa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tenKhoa: newDeptName, kyHieuKhoa: newDeptCode })
      });
      if (res.ok) {
        fetchDepartments();
        setNewDeptName('');
        setNewDeptCode('');
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Lỗi thêm khoa');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const startEditDept = (dept) => {
    setEditingDeptId(dept.maKhoa);
    setEditDeptName(dept.tenKhoa);
    setEditDeptCode(dept.kyHieuKhoa || '');
  };

  const handleUpdateDept = async () => {
    if (!editDeptName || !editDeptCode) return alert('Vui lòng nhập tên và ký hiệu khoa');
    try {
      const res = await fetch(`http://localhost:5186/api/khoa/${editingDeptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tenKhoa: editDeptName, kyHieuKhoa: editDeptCode })
      });
      if (res.ok) {
        fetchDepartments();
        if (selectedDeptId === editingDeptId) fetchDeptDetails(editingDeptId);
        setEditingDeptId(null);
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Lỗi cập nhật khoa');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khoa này?')) return;
    try {
      const res = await fetch(`http://localhost:5186/api/khoa/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (selectedDeptId === id) setSelectedDeptId(null);
        fetchDepartments();
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Không thể xóa khoa');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  // ==========================================
  // LỚP HÀNH CHÍNH
  // ==========================================
  const handleAddClass = async () => {
    if (!newClassCode || !newClassName) return alert('Vui lòng nhập mã và tên lớp');
    try {
      const res = await fetch('http://localhost:5186/api/lopsinhvien', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ maLopSinhVien: newClassCode, tenLopSinhVien: newClassName, maKhoa: selectedDeptId })
      });
      if (res.ok) {
        fetchDeptDetails(selectedDeptId);
        fetchDepartments();
        setNewClassCode('');
        setNewClassName('');
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Lỗi thêm lớp');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClass = async (maLop) => {
    if (!editClassName) return alert('Vui lòng nhập tên lớp');
    try {
      const res = await fetch(`http://localhost:5186/api/lopsinhvien/${maLop}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ maLopSinhVien: maLop, tenLopSinhVien: editClassName, maKhoa: selectedDeptId })
      });
      if (res.ok) {
        fetchDeptDetails(selectedDeptId);
        setEditingClassCode(null);
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Lỗi cập nhật lớp');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lớp này?')) return;
    try {
      const res = await fetch(`http://localhost:5186/api/lopsinhvien/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchDeptDetails(selectedDeptId);
        fetchDepartments();
      } else {
        const err = await res.json();
        alert(err.thongBao || 'Lớp đang có sinh viên, không thể xóa');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Lọc và sắp xếp dữ liệu
  const filteredClasses = useMemo(() => {
    if (!deptDetails?.lopHanhChinhs) return [];
    let list = [...deptDetails.lopHanhChinhs];
    if (classFilter) {
      list = list.filter(c => c.maLop.toLowerCase().includes(classFilter.toLowerCase()));
    }
    // Sắp xếp theo mã lớp (VD: D20, D21, D22...)
    return list.sort((a, b) => a.maLop.localeCompare(b.maLop));
  }, [deptDetails, classFilter]);

  const filteredStudents = useMemo(() => {
    if (!deptDetails?.sinhViens) return [];
    let list = [...deptDetails.sinhViens];
    
    if (studentClassFilter !== 'all') {
      list = list.filter(s => s.lop === studentClassFilter);
    }
    if (studentSearch) {
      list = list.filter(s => s.maSo.includes(studentSearch) || s.hoTen.toLowerCase().includes(studentSearch.toLowerCase()));
    }
    // Sắp xếp sinh viên theo mã lớp rồi đến mã SV
    return list.sort((a, b) => {
      if (a.lop === b.lop) return a.maSo.localeCompare(b.maSo);
      return (a.lop || '').localeCompare(b.lop || '');
    });
  }, [deptDetails, studentClassFilter, studentSearch]);

  const getGenderText = (val) => {
    if (val === true) return <span style={{ color: '#2563eb', fontWeight: '500' }}>Nam</span>;
    if (val === false) return <span style={{ color: '#db2777', fontWeight: '500' }}>Nữ</span>;
    return <span style={{ color: '#94a3b8' }}>-</span>;
  };

  return (
    <div style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Quản lý Khoa & Lớp sinh viên</h2>
        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Quản lý cơ cấu phòng ban, lớp hành chính và danh sách nhân sự</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 160px)' }}>
        {/* =========================================
            CỘT TRÁI - Danh sách Khoa 
            ========================================= */}
        <div style={{ width: '380px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <FaBuilding color="#3b82f6" /> Danh sách Khoa
            </h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" placeholder="Mã Khoa" value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} style={{ width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <input type="text" placeholder="Tên Khoa mới" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <button onClick={handleAddDept} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px' }}><FaPlus /></button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
            {departments.map(dept => (
              <div
                key={dept.maKhoa}
                onClick={() => setSelectedDeptId(dept.maKhoa)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedDeptId === dept.maKhoa ? '#3b82f6' : '#e2e8f0'}`,
                  background: selectedDeptId === dept.maKhoa ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  {editingDeptId === dept.maKhoa ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="text" value={editDeptCode} onChange={e => setEditDeptCode(e.target.value)} style={{ width: '80px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="Mã" />
                        <input type="text" value={editDeptName} onChange={e => setEditDeptName(e.target.value)} style={{ flex: 1, padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="Tên khoa" />
                      </div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                        <button onClick={handleUpdateDept} style={{ background: '#10b981', color: 'white', padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Lưu</button>
                        <button onClick={() => setEditingDeptId(null)} style={{ background: '#6b7280', color: 'white', padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 'bold', color: selectedDeptId === dept.maKhoa ? '#1d4ed8' : '#334155' }}>
                        {dept.kyHieuKhoa ? `[${dept.kyHieuKhoa}] ` : ''}{dept.tenKhoa}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {dept.soLuongLop} Lớp HC • {dept.soLuongGiangVien} GV
                      </div>
                    </>
                  )}
                </div>
                {editingDeptId !== dept.maKhoa && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                    <button onClick={(e) => { e.stopPropagation(); startEditDept(dept); }} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '2px' }}><FaEdit /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.maKhoa); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}><FaTrash /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* =========================================
            CỘT PHẢI - Chi tiết 
            ========================================= */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {deptDetails ? (
            <>
              {/* Header Tabs */}
              <div style={{ padding: '20px 20px 0 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Khoa {deptDetails.tenKhoa} {deptDetails.kyHieuKhoa ? `(${deptDetails.kyHieuKhoa})` : ''}</h2>
                <div style={{ display: 'flex', gap: '30px' }}>
                  <button onClick={() => setActiveTab('classes')} style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '15px', fontWeight: 'bold', color: activeTab === 'classes' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'classes' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}>
                    <FaUsers style={{ marginRight: '5px' }} /> Lớp Hành Chính ({deptDetails.lopHanhChinhs.length})
                  </button>
                  <button onClick={() => setActiveTab('teachers')} style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '15px', fontWeight: 'bold', color: activeTab === 'teachers' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'teachers' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}>
                    <FaChalkboardTeacher style={{ marginRight: '5px' }} /> Giảng Viên ({deptDetails.giangViens.length})
                  </button>
                  <button onClick={() => setActiveTab('students')} style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '15px', fontWeight: 'bold', color: activeTab === 'students' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'students' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}>
                    <FaUsers style={{ marginRight: '5px' }} /> Sinh Viên ({deptDetails.sinhViens.length})
                  </button>
                </div>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                
                {/* -----------------------------
                    TAB: LỚP HÀNH CHÍNH
                    ----------------------------- */}
                {activeTab === 'classes' && (
                  <div>
                    {/* Toolbar thêm lớp */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <input type="text" placeholder="Mã lớp (VD: D23_TH01)" value={newClassCode} onChange={e => setNewClassCode(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '180px' }} />
                      <input type="text" placeholder="Tên lớp đầy đủ" value={newClassName} onChange={e => setNewClassName(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1 }} />
                      <button onClick={handleAddClass} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>+ Thêm lớp mới</button>
                    </div>

                    {/* Toolbar lọc */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                      <FaFilter color="#64748b" />
                      <input type="text" placeholder="Lọc theo khóa/mã lớp (VD: D20, D21...)" value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '250px', fontSize: '13px' }} />
                    </div>

                    {/* Bảng Lớp */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600', width: '25%' }}>Mã Lớp</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Tên Lớp</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600', width: '15%', textAlign: 'center' }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClasses.map((cls, idx) => (
                            <tr key={cls.maLop} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                              {editingClassCode === cls.maLop ? (
                                <>
                                  <td style={{ padding: '10px 15px', fontFamily: 'monospace', fontWeight: 'bold' }}>{cls.maLop}</td>
                                  <td style={{ padding: '10px 15px' }}>
                                    <input type="text" value={editClassName} onChange={e => setEditClassName(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                  </td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                                    <button onClick={() => handleUpdateClass(cls.maLop)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', marginRight: '10px' }} title="Lưu"><FaCheck size={16}/></button>
                                    <button onClick={() => setEditingClassCode(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }} title="Hủy"><FaTimes size={16}/></button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b' }}>{cls.maLop}</td>
                                  <td style={{ padding: '12px 15px', color: '#334155' }}>{cls.tenLop}</td>
                                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <button onClick={() => { setEditingClassCode(cls.maLop); setEditClassName(cls.tenLop); }} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', marginRight: '15px' }} title="Sửa"><FaEdit /></button>
                                    <button onClick={() => handleDeleteClass(cls.maLop)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Xóa"><FaTrash /></button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          {filteredClasses.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>Không tìm thấy lớp hành chính nào</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* -----------------------------
                    TAB: GIẢNG VIÊN
                    ----------------------------- */}
                {activeTab === 'teachers' && (
                  <div>
                    <div style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px' }}>
                      Danh sách Giảng viên thuộc khoa (Quản lý gán/hủy quyền ở tab Nhân sự).
                    </div>
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Mã GV</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Họ và Tên</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Giới tính</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptDetails.giangViens.map((gv, idx) => (
                            <tr key={gv.maGiangVien} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 15px', fontFamily: 'monospace', color: '#64748b' }}>{gv.maSo}</td>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#1e293b' }}>{gv.hoTen}</td>
                              <td style={{ padding: '12px 15px' }}>{getGenderText(gv.gioiTinh)}</td>
                              <td style={{ padding: '12px 15px', color: '#3b82f6' }}>{gv.email}</td>
                            </tr>
                          ))}
                          {deptDetails.giangViens.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>Chưa có giảng viên nào</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* -----------------------------
                    TAB: SINH VIÊN
                    ----------------------------- */}
                {activeTab === 'students' && (
                  <div>
                    {/* Bộ lọc Sinh viên */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaFilter color="#64748b" />
                        <select 
                          value={studentClassFilter} 
                          onChange={e => setStudentClassFilter(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        >
                          <option value="all">-- Tất cả Lớp Hành Chính --</option>
                          {deptDetails.lopHanhChinhs.map(c => (
                            <option key={c.maLop} value={c.maLop}>{c.maLop} - {c.tenLop}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <FaSearch color="#64748b" />
                        <input 
                          type="text" 
                          placeholder="Tìm theo Mã SV hoặc Tên..." 
                          value={studentSearch} 
                          onChange={e => setStudentSearch(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Mã SV</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Họ và Tên</th>
                            <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Lớp Hành Chính</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((sv, idx) => (
                            <tr key={sv.maSinhVien} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 15px', fontFamily: 'monospace', color: '#64748b' }}>{sv.maSo}</td>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#1e293b' }}>{sv.hoTen}</td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>
                                  {sv.lop || 'Chưa gán'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>Không tìm thấy sinh viên nào</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <FaBuilding size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
              <p>Chọn một khoa ở danh sách bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagement;
