import React, { useState, useEffect } from 'react';
import { FaBuilding, FaChalkboardTeacher, FaBook, FaUsers, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './styles/GroupManagement.css';

const GroupManagement = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKhoas, setExpandedKhoas] = useState({});
  const [expandedGVs, setExpandedGVs] = useState({});
  const [expandedLops, setExpandedLops] = useState({});

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('http://localhost:5186/api/admin/khoa-giangvien-lophoc-nhom');
      if (res.ok) {
        const data = await res.json();
        setHierarchy(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleKhoa = (id) => setExpandedKhoas(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleGV = (id) => setExpandedGVs(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleLop = (id) => setExpandedLops(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return <div className="loading-state" style={{ padding: '2rem' }}>Đang tải cấu trúc dữ liệu...</div>;
  }

  return (
    <div className="group-management">
      <div className="group-header-gradient" style={{ marginBottom: '20px' }}>
        <div className="header-content">
          <h2>Quản lý lớp & nhóm</h2>
          <p>Xem danh sách phân cấp từ Khoa đến Nhóm học tập</p>
        </div>
      </div>

      <div className="hierarchy-container" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {hierarchy.length === 0 ? (
          <p>Không có dữ liệu.</p>
        ) : (
          hierarchy.map(khoa => (
            <div key={khoa.maKhoa} className="hierarchy-level khoa-level" style={{ marginBottom: '15px' }}>
              <div className="level-header" onClick={() => toggleKhoa(khoa.maKhoa)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px', background: '#f3f4f6', borderRadius: '8px', fontWeight: 'bold' }}>
                {expandedKhoas[khoa.maKhoa] ? <FaChevronDown style={{ marginRight: '10px' }}/> : <FaChevronRight style={{ marginRight: '10px' }}/>}
                <FaBuilding style={{ marginRight: '10px', color: '#3b82f6' }} />
                <span>Khoa {khoa.tenKhoa}</span>
              </div>
              
              {expandedKhoas[khoa.maKhoa] && khoa.giangViens && (
                <div className="level-content" style={{ paddingLeft: '30px', marginTop: '10px' }}>
                  {khoa.giangViens.length === 0 && <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Chưa có giảng viên</p>}
                  {khoa.giangViens.map(gv => (
                    <div key={gv.maNguoiDung} className="hierarchy-level gv-level" style={{ marginBottom: '10px' }}>
                      <div className="level-header" onClick={() => toggleGV(gv.maNguoiDung)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        {expandedGVs[gv.maNguoiDung] ? <FaChevronDown style={{ marginRight: '10px', fontSize: '0.8rem' }}/> : <FaChevronRight style={{ marginRight: '10px', fontSize: '0.8rem' }}/>}
                        <FaChalkboardTeacher style={{ marginRight: '10px', color: '#10b981' }} />
                        <span>{gv.hoTen} ({gv.maSo})</span>
                      </div>

                      {expandedGVs[gv.maNguoiDung] && gv.lopHocs && (
                        <div className="level-content" style={{ paddingLeft: '30px', marginTop: '10px' }}>
                          {gv.lopHocs.length === 0 && <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Chưa có lớp học</p>}
                          {gv.lopHocs.map(lop => (
                            <div key={lop.maLop} className="hierarchy-level lop-level" style={{ marginBottom: '10px' }}>
                              <div className="level-header" onClick={() => toggleLop(lop.maLop)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                                {expandedLops[lop.maLop] ? <FaChevronDown style={{ marginRight: '10px', fontSize: '0.8rem' }}/> : <FaChevronRight style={{ marginRight: '10px', fontSize: '0.8rem' }}/>}
                                <FaBook style={{ marginRight: '10px', color: '#f59e0b' }} />
                                <span>{lop.tenLop} ({lop.maLopHoc})</span>
                              </div>

                              {expandedLops[lop.maLop] && lop.nhoms && (
                                <div className="level-content" style={{ paddingLeft: '30px', marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                  {lop.nhoms.length === 0 && <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Chưa có nhóm</p>}
                                  {lop.nhoms.map(nhom => (
                                    <div key={nhom.maNhom} className="nhom-card" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', width: '250px', background: '#f9fafb' }}>
                                      <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUsers color="#6366f1"/> {nhom.tenNhom}</h5>
                                      <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}><strong>Đề tài:</strong> {nhom.tenDeTai || 'Chưa có'}</p>
                                      <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Thành viên:</strong> {nhom.soThanhVien}/{nhom.soThanhVienToiDa}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupManagement;
