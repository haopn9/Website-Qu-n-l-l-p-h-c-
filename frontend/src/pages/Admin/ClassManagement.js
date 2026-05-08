import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaUsers, FaChalkboardTeacher, FaCalendarAlt, FaBookOpen, FaCrown, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './styles/ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, semestersRes] = await Promise.all([
        fetch('http://localhost:5186/api/lophoc'),
        fetch('http://localhost:5186/api/lophoc/hocky')
      ]);

      if (semestersRes.ok) {
        const hkData = await semestersRes.json();
        setHocKyList(hkData);
        if (selectedSemester === 'all') {
          const currentHk = hkData.find(hk => hk.laHienTai);
          if (currentHk) setSelectedSemester(currentHk.maHocKy.toString());
        }
      }

      if (classesRes.ok) {
        const cls = await classesRes.json();
        setClasses(cls.map(item => ({ ...item, id: item.maLop, trangThai: item.trangThai || 'active' })));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (classItem) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5186/api/lophoc/${classItem.maLop}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedClass(data);
      } else {
        alert('Lỗi tải chi tiết lớp học');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredClasses = classes.filter(c => {
    const matchSearch = c.tenLop.toLowerCase().includes(searchTerm.toLowerCase()) || c.maLopHoc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSemester = selectedSemester === 'all' || c.maHocKy === parseInt(selectedSemester, 10);
    const matchStatus = selectedStatus === 'all' || c.trangThai === selectedStatus;
    return matchSearch && matchSemester && matchStatus;
  });

  const statusLabel = s => s === 'inactive' ? 'Đã kết thúc' : s === 'sap-dien-ra' ? 'Sắp diễn ra' : 'Đang hoạt động';
  const toggleGroup = id => setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) return <div className="loading-state">Đang tải dữ liệu...</div>;

  // =============================================
  // MÀN HÌNH CHI TIẾT LỚP
  // =============================================
  if (selectedClass) {
    const { danhSachSinhVien = [], danhSachNhom = [] } = selectedClass;
    return (
      <div style={{ padding: '20px', background: '#f1f5f9', minHeight: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <button onClick={() => setSelectedClass(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
            ← Quay lại
          </button>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>{selectedClass.tenLop}</h2>
            <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '13px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span>📋 Mã lớp: <b style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{selectedClass.maLopHoc}</b></span>
              <span><FaChalkboardTeacher style={{ marginRight: '4px' }} />{selectedClass.tenGiangVien}</span>
              <span><FaCalendarAlt style={{ marginRight: '4px' }} />{selectedClass.tenHocKy}</span>
              <span>⏱ Thời gian: <b style={{ color: '#334155' }}>{formatDate(selectedClass.ngayBatDau)} - {formatDate(selectedClass.ngayKetThuc)}</b></span>
              <span style={{ color: selectedClass.trangThai === 'active' ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>● {statusLabel(selectedClass.trangThai)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
          {[
            { label: 'Sinh viên', value: selectedClass.soSinhVien, color: '#3b82f6', icon: '👥' },
            { label: 'Nhóm', value: selectedClass.soNhom, color: '#8b5cf6', icon: '🗂️' },
            { label: 'Đề tài', value: selectedClass.danhSachDeTai?.length || 0, color: '#f59e0b', icon: '📚' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: s.color }}>{s.icon} {s.value}</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* DANH SÁCH SINH VIÊN */}
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUsers color="#3b82f6" /> Danh sách Sinh viên</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{danhSachSinhVien.length} sinh viên</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Mã SV</th>
                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Họ Tên</th>
                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Nhóm</th>
                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Chức vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachSinhVien.map((sv, idx) => (
                    <tr key={sv.maNguoiDung} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 15px', fontFamily: 'monospace', color: '#475569' }}>{sv.maSo}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '500' }}>{sv.hoTen}</td>
                      <td style={{ padding: '10px 15px' }}>
                        {sv.tenNhom ? <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{sv.tenNhom}</span> : <span style={{ color: '#94a3b8', fontSize: '12px' }}>Chưa có nhóm</span>}
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        {sv.laNhomTruong ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: '600', fontSize: '12px' }}><FaCrown size={12} /> Nhóm trưởng</span> : <span style={{ color: '#94a3b8', fontSize: '12px' }}>Thành viên</span>}
                      </td>
                    </tr>
                  ))}
                  {danhSachSinhVien.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Chưa có sinh viên nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DANH SÁCH NHÓM */}
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaBookOpen color="#8b5cf6" /> Danh sách Nhóm</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{danhSachNhom.length} nhóm</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '500px', padding: '10px' }}>
              {danhSachNhom.map(nhom => (
                <div key={nhom.maNhom} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                  {/* Nhóm header */}
                  <div
                    onClick={() => toggleGroup(nhom.maNhom)}
                    style={{ padding: '12px 15px', background: expandedGroups[nhom.maNhom] ? '#f5f3ff' : '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expandedGroups[nhom.maNhom] ? <FaChevronDown size={12} color="#8b5cf6" /> : <FaChevronRight size={12} color="#8b5cf6" />}
                        {nhom.tenNhom}
                      </div>
                      {nhom.tenDeTai ? (
                        <div style={{ fontSize: '13px', color: '#4338ca', marginTop: '4px', marginLeft: '20px', fontWeight: '500' }}>
                          <span style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', marginRight: '5px' }}>Đề tài</span>
                          {nhom.tenDeTai}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginLeft: '20px', fontStyle: 'italic' }}>
                          Chưa chọn đề tài
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: nhom.soThanhVienHienTai >= nhom.soThanhVienToiDa ? '#10b981' : '#f59e0b' }}>
                        {nhom.soThanhVienHienTai}/{nhom.soThanhVienToiDa}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>thành viên</div>
                    </div>
                  </div>

                  {/* Nhóm members (dropdown) */}
                  {expandedGroups[nhom.maNhom] && (
                    <div style={{ padding: '10px 15px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                      {nhom.thanhViens?.length > 0 ? nhom.thanhViens.map(tv => (
                        <div key={tv.maNguoiDung} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            <span style={{ fontFamily: 'monospace', color: '#64748b', marginRight: '8px' }}>{tv.maSo}</span>
                            {tv.hoTen}
                          </div>
                          {tv.laNhomTruong
                            ? <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><FaCrown size={10} /> Nhóm trưởng</span>
                            : <span style={{ fontSize: '11px', color: '#94a3b8' }}>Thành viên</span>}
                        </div>
                      )) : <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '10px' }}>Nhóm chưa có thành viên</div>}
                    </div>
                  )}
                </div>
              ))}
              {danhSachNhom.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Chưa có nhóm nào được tạo</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // MÀN HÌNH DANH SÁCH LỚP
  // =============================================
  return (
    <div className="management-tab">
      <div className="page-header-modern">
        <div className="header-content">
          <h2>Quản lý lớp môn học & nhóm</h2>
          <p>Bấm vào thẻ lớp để xem chi tiết sinh viên và nhóm</p>
        </div>
      </div>

      <div className="toolbar-modern" style={{ justifyContent: 'flex-end' }}>
        <div className="search-filter-group">
          <div className="search-box-modern">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Tìm theo tên lớp, mã lớp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><FaTimes /></button>}
          </div>

          <select className="filter-select-modern" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
            <option value="all">Tất cả học kỳ</option>
            {hocKyList.map(hk => <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}{hk.laHienTai ? ' ★' : ''}</option>)}
          </select>

          <select className="filter-select-modern" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="sap-dien-ra">Sắp diễn ra</option>
            <option value="inactive">Đã kết thúc</option>
          </select>
        </div>
      </div>

      <div className="classes-grid-modern">
        {filteredClasses.map(classItem => (
          <div key={classItem.id} className="class-card-modern" onClick={() => handleSelectClass(classItem)} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div className="class-card-header">
              <div className="class-title">
                <h3>{classItem.tenLop}</h3>
                <span className="class-code">{classItem.maLopHoc}</span>
              </div>
              <span className={`status-badge-modern ${classItem.trangThai}`}>{statusLabel(classItem.trangThai)}</span>
            </div>
            <div className="class-card-body">
              <div className="class-info-row"><FaChalkboardTeacher className="info-icon" /><span>{classItem.tenGiangVien}</span></div>
              <div className="class-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaCalendarAlt className="info-icon" /><span>{classItem.tenHocKy}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                  {formatDate(classItem.ngayBatDau)} - {formatDate(classItem.ngayKetThuc)}
                </div>
              </div>
              <div className="class-stats-modern">
                <div className="stat-item"><FaUsers className="stat-icon" /><span>{classItem.soSinhVien || 0} sinh viên</span></div>
                <div className="stat-item"><FaUsers className="stat-icon" /><span>{classItem.soNhom || 0} nhóm</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="empty-state"><p>Không tìm thấy lớp học nào phù hợp</p></div>
      )}
    </div>
  );
};

export default ClassManagement;
