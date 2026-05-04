import React, { useState, useEffect } from 'react';
import './ManageGroups.css';
import { FaPlus, FaSearch, FaUsers, FaUserFriends, FaCrown, FaRandom, FaUserMinus, FaTimes, FaChalkboard } from 'react-icons/fa';

const ManageGroups = () => {
  const [groups, setGroups] = useState([]);
  const [lopHocList, setLopHocList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isAssignLeaderModalOpen, setIsAssignLeaderModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [transferRequests, setTransferRequests] = useState([
    { id: 1, studentName: 'Phung Thanh Tung', studentCode: 'SV014', adminClass: 'D21CQCN01-N', subjectClass: 'Lập trình Web', oldGroup: 'Nhóm 1', newGroup: 'Nhóm 2', reason: 'Muốn làm chung với bạn', status: 'pending', response: '' },
    { id: 2, studentName: 'Truong Bao Ngoc', studentCode: 'SV015', adminClass: 'D21CQCN02-N', subjectClass: 'Lập trình Web', oldGroup: 'Nhóm 2', newGroup: 'Nhóm 3', reason: 'Không phù hợp đề tài', status: 'approved', response: 'Đồng ý' }
  ]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [formData, setFormData] = useState({ groupName: '', maxMembers: 5, classId: '' });
  const [randomForm, setRandomForm] = useState({ classId: '', membersPerGroup: 4 });
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const maGiangVien = userInfo.maNguoiDung || 1;

  const fetchData = async () => {
    try {
      const lopRes = await fetch('http://localhost:5186/api/lophoc');
      if (!lopRes.ok) return;

      const lopData = await lopRes.json();
      const myLops = lopData.filter((l) => l.maGiangVien === maGiangVien);
      setLopHocList(myLops);

      const nhomPromises = myLops.map((lop) =>
        fetch(`http://localhost:5186/api/nhom?maLop=${lop.maLop}`).then((r) => r.json())
      );
      const nhomResults = await Promise.all(nhomPromises);

      const allNhoms = nhomResults.flat().map((n) => ({
        groupId: n.maNhom,
        groupName: n.tenNhom,
        maxMembers: n.soThanhVienToiDa,
        classId: n.maLop,
        className: n.tenLop,
        leaderId: n.maNhomTruong,
        leaderName: n.nhomTruong !== 'Chưa có' ? n.nhomTruong : null,
        members: (n.thanhVien || []).map((member) => ({
          userId: member.maNguoiDung,
          userCode: member.maSo,
          fullName: member.hoTen,
          role: member.vaiTroTrongNhom
        }))
      }));
      setGroups(allNhoms);
    } catch (err) {
      console.error('Lỗi tải dữ liệu nhóm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'maxMembers' ? parseInt(value, 10) : value });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      alert('Vui lòng chọn lớp!');
      return;
    }

    try {
      const res = await fetch('http://localhost:5186/api/nhom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenNhom: formData.groupName,
          maLop: parseInt(formData.classId, 10),
          soThanhVienToiDa: formData.maxMembers
        })
      });
      if (res.ok) {
        await fetchData();
        setIsCreateModalOpen(false);
        setFormData({ groupName: '', maxMembers: 5, classId: '' });
        alert('Tạo nhóm thành công!');
      } else {
        alert('Lỗi khi tạo nhóm!');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối API!');
    }
  };

  const handleRandomAssign = () => {
    if (!randomForm.classId) {
      alert('Vui lòng chọn lớp!');
      return;
    }
    alert('Tính năng phân nhóm ngẫu nhiên cần backend xử lý tiếp.');
    setIsRandomModalOpen(false);
  };

  const handleAssignLeader = async () => {
    if (!selectedLeaderId || !selectedGroup) return;

    try {
      const res = await fetch(`http://localhost:5186/api/nhom/${selectedGroup.groupId}/nhomtruong`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maSinhVien: parseInt(selectedLeaderId, 10) })
      });
      if (res.ok) {
        await fetchData();
        setIsAssignLeaderModalOpen(false);
        alert('Đã chỉ định nhóm trưởng!');
      } else {
        alert('Lỗi cập nhật nhóm trưởng!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = () => {
    alert('Cần API lấy sinh viên chưa có nhóm để thêm vào nhóm.');
    setIsAddMemberModalOpen(false);
  };

  const handleRemoveMember = (groupId, userId) => {
    alert(`UI đã sẵn chỗ xóa thành viên ${userId} khỏi nhóm ${groupId}. API bổ sung sau.`);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm này?')) return;

    try {
      const res = await fetch(`http://localhost:5186/api/nhom/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(groups.filter((g) => g.groupId !== groupId));
        alert('Xóa nhóm thành công!');
      } else {
        alert('Lỗi khi xóa nhóm!');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối API!');
    }
  };

  const openAssignLeader = (group) => {
    setSelectedGroup(group);
    setSelectedLeaderId(group.leaderId?.toString() || '');
    setIsAssignLeaderModalOpen(true);
  };

  const openAddMember = (group) => {
    setSelectedGroup(group);
    setSelectedStudentId('');
    setIsAddMemberModalOpen(true);
  };

  const filteredGroups = groups.filter((g) => {
    const matchSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || g.classId === parseInt(filterClass, 10);
    return matchSearch && matchClass;
  });

  const totalGroups = groups.length;
  const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
  const groupsWithLeader = groups.filter((g) => g.leaderId).length;
  const groupsWithoutLeader = groups.filter((g) => !g.leaderId).length;

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="manage-groups-container">
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2 className="page-title">Quản lý nhóm học tập</h2>
            <p className="page-subtitle">Tạo nhóm, phân công thành viên và chỉ định nhóm trưởng</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setIsTimeModalOpen(true)}>Thiết lập thời gian đăng ký nhóm</button>
            <button className="btn-secondary" onClick={() => setIsRandomModalOpen(true)}>
              <FaRandom /> Phân nhóm ngẫu nhiên
            </button>
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <FaPlus /> Tạo nhóm mới
            </button>
          </div>
        </div>

        <div className="tab-buttons" style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn-tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')} style={{ padding: '8px 16px', background: activeTab === 'manage' ? '#1e293b' : '#e2e8f0', color: activeTab === 'manage' ? '#fff' : '#475569', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Quản lý nhóm học tập</button>
          <button className={`btn-tab ${activeTab === 'transferRequests' ? 'active' : ''}`} onClick={() => setActiveTab('transferRequests')} style={{ padding: '8px 16px', background: activeTab === 'transferRequests' ? '#1e293b' : '#e2e8f0', color: activeTab === 'transferRequests' ? '#fff' : '#475569', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xử lý yêu cầu chuyển nhóm</button>
        </div>
      </div>

      {activeTab === 'manage' && (
        <>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon blue"><FaUsers /></div><div className="stat-info"><h4>Tổng nhóm</h4><span className="stat-number">{totalGroups}</span></div></div>
            <div className="stat-card"><div className="stat-icon green"><FaUserFriends /></div><div className="stat-info"><h4>Tổng thành viên</h4><span className="stat-number">{totalMembers}</span></div></div>
            <div className="stat-card"><div className="stat-icon orange"><FaCrown /></div><div className="stat-info"><h4>Có nhóm trưởng</h4><span className="stat-number">{groupsWithLeader}</span></div></div>
            <div className="stat-card"><div className="stat-icon purple"><FaChalkboard /></div><div className="stat-info"><h4>Chưa có trưởng</h4><span className="stat-number">{groupsWithoutLeader}</span></div></div>
          </div>

          <div className="toolbar-row">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Tìm kiếm nhóm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="all">Tất cả lớp</option>
              {lopHocList.map((lop) => (
                <option key={lop.maLop} value={lop.maLop}>{lop.tenLop}</option>
              ))}
            </select>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>Không tìm thấy nhóm nào</p>
            </div>
          ) : (
            <div className="groups-grid">
              {filteredGroups.map((group) => (
                <div className="group-card" key={group.groupId}>
                  <div className="group-card-top">
                    <h3>{group.groupName}</h3>
                    <span className="group-class-badge">{group.className}</span>
                  </div>

                  <div className="group-card-body">
                    <div className="group-info-row">
                      <div className="group-info-item">
                        <FaUsers className="info-icon" />
                        <span>Thành viên: <strong>{group.members.length}/{group.maxMembers}</strong></span>
                      </div>
                      {!group.leaderName && (
                        <span className="leader-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                          Chưa có trưởng nhóm
                        </span>
                      )}
                    </div>

                    <div className="member-list-mini">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0 }}>Danh sách thành viên</h4>
                        <button className="btn-sm primary" onClick={() => openAddMember(group)} style={{ padding: '3px 8px', borderRadius: '50%' }} title="Thêm sinh viên">
                          <FaPlus />
                        </button>
                      </div>
                      {group.members.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Chưa có thành viên</p>
                      ) : (
                        group.members.map((member) => (
                          <div className="member-item" key={member.userId}>
                            <div className="member-name">
                              <span>{member.fullName}</span>
                              <span className="member-code">{member.userCode}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`member-role-tag ${member.role}`}>
                                {member.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'}
                              </span>
                              <button className="btn-sm danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => handleRemoveMember(group.groupId, member.userId)}>
                                <FaUserMinus />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="group-card-actions">
                    <button className="btn-sm primary" onClick={() => alert('Đã chốt danh sách nhóm!')}>Chốt danh sách nhóm</button>
                    <button className="btn-sm warning" onClick={() => openAssignLeader(group)}>
                      <FaCrown /> Chỉ định trưởng
                    </button>
                    <button className="btn-sm danger" onClick={() => handleDeleteGroup(group.groupId)}>Xóa nhóm</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'transferRequests' && (
        <div className="transfer-requests-container" style={{ marginTop: '20px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>Họ tên SV</th>
                <th style={{ padding: '12px' }}>Mã số</th>
                <th style={{ padding: '12px' }}>Lớp hành chính</th>
                <th style={{ padding: '12px' }}>Lớp môn học</th>
                <th style={{ padding: '12px' }}>Nhóm hiện tại</th>
                <th style={{ padding: '12px' }}>Nhóm xin chuyển</th>
                <th style={{ padding: '12px' }}>Trạng thái</th>
                <th style={{ padding: '12px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {transferRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}><strong>{req.studentName}</strong></td>
                  <td style={{ padding: '12px' }}>{req.studentCode}</td>
                  <td style={{ padding: '12px' }}>{req.adminClass}</td>
                  <td style={{ padding: '12px' }}>{req.subjectClass}</td>
                  <td style={{ padding: '12px' }}>{req.oldGroup}</td>
                  <td style={{ padding: '12px' }}>{req.newGroup}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                      {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chưa xử lý'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn-sm primary" style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }} onClick={() => {
                      setSelectedRequest(req);
                      setTeacherResponse(req.response || '');
                      setIsRequestModalOpen(true);
                    }}>Xem chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo nhóm mới</h3>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên nhóm *</label>
                    <input type="text" name="groupName" value={formData.groupName} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Số thành viên tối đa *</label>
                    <input type="number" name="maxMembers" value={formData.maxMembers} onChange={handleFormChange} min="2" max="10" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Thuộc lớp *</label>
                    <select name="classId" value={formData.classId} onChange={handleFormChange}>
                      <option value="">-- Chọn lớp --</option>
                      {lopHocList.map((lop) => <option key={lop.maLop} value={lop.maLop}>{lop.tenLop} ({lop.maLopHoc})</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-save">Tạo nhóm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRandomModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRandomModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phân nhóm ngẫu nhiên</h3>
              <button className="close-btn" onClick={() => setIsRandomModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="random-assign-info">
                <h4>Cách hoạt động</h4>
                <p>Hệ thống sẽ tự động chia các sinh viên chưa có nhóm vào các nhóm mới dựa trên số lượng thành viên bạn chọn.</p>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Chọn lớp *</label>
                  <select value={randomForm.classId} onChange={(e) => setRandomForm({ ...randomForm, classId: e.target.value })}>
                    <option value="">-- Chọn lớp --</option>
                    {lopHocList.map((lop) => <option key={lop.maLop} value={lop.maLop}>{lop.tenLop} ({lop.maLopHoc})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số SV mỗi nhóm *</label>
                  <input type="number" value={randomForm.membersPerGroup} onChange={(e) => setRandomForm({ ...randomForm, membersPerGroup: parseInt(e.target.value, 10) })} min="2" max="10" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsRandomModalOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={handleRandomAssign}>Phân nhóm ngẫu nhiên</button>
            </div>
          </div>
        </div>
      )}

      {isAssignLeaderModalOpen && selectedGroup && (
        <div className="modal-overlay" onClick={() => setIsAssignLeaderModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉ định nhóm trưởng - {selectedGroup.groupName}</h3>
              <button className="close-btn" onClick={() => setIsAssignLeaderModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Chọn thành viên làm nhóm trưởng:</label>
                <select value={selectedLeaderId} onChange={(e) => setSelectedLeaderId(e.target.value)}>
                  <option value="">-- Chọn thành viên --</option>
                  {selectedGroup.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.userCode}) {m.userId === selectedGroup.leaderId ? '(Đang là trưởng)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsAssignLeaderModalOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={handleAssignLeader}>Xác nhận chỉ định</button>
            </div>
          </div>
        </div>
      )}

      {isAddMemberModalOpen && selectedGroup && (
        <div className="modal-overlay" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm sinh viên vào {selectedGroup.groupName}</h3>
              <button className="close-btn" onClick={() => setIsAddMemberModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                Số chỗ trống: <strong>{selectedGroup.maxMembers - selectedGroup.members.length}</strong>
              </p>
              <div className="form-group">
                <label>Chọn sinh viên:</label>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                  <option value="">-- Chọn sinh viên (API chưa hỗ trợ) --</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsAddMemberModalOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={handleAddMember}>Thêm vào nhóm</button>
            </div>
          </div>
        </div>
      )}

      {isRequestModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={() => setIsRequestModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xử lý yêu cầu chuyển nhóm</h3>
              <button className="close-btn" onClick={() => setIsRequestModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Sinh viên</label>
                <input type="text" value={`${selectedRequest.studentName} (${selectedRequest.studentCode})`} readOnly style={{ backgroundColor: '#f1f5f9' }} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nhóm hiện tại</label>
                  <input type="text" value={selectedRequest.oldGroup} readOnly style={{ backgroundColor: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Nhóm xin chuyển</label>
                  <input type="text" value={selectedRequest.newGroup} readOnly style={{ backgroundColor: '#f1f5f9' }} />
                </div>
              </div>
              <div className="form-group full-width" style={{ marginTop: '10px' }}>
                <label>Phản hồi của giảng viên</label>
                <textarea rows="2" maxLength="255" value={teacherResponse} onChange={(e) => setTeacherResponse(e.target.value)} disabled={selectedRequest.status !== 'pending'} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-cancel" onClick={() => setIsRequestModalOpen(false)}>Đóng</button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button className="btn-save" style={{ backgroundColor: '#ef4444' }} onClick={() => {
                    setTransferRequests((reqs) => reqs.map((r) => r.id === selectedRequest.id ? { ...r, status: 'rejected', response: teacherResponse } : r));
                    setIsRequestModalOpen(false);
                    alert('Đã từ chối yêu cầu.');
                  }}>Từ chối</button>
                  <button className="btn-save" style={{ backgroundColor: '#10b981' }} onClick={() => {
                    setTransferRequests((reqs) => reqs.map((r) => r.id === selectedRequest.id ? { ...r, status: 'approved', response: teacherResponse } : r));
                    setIsRequestModalOpen(false);
                    alert('Đã duyệt yêu cầu.');
                  }}>Đồng ý</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isTimeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTimeModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thiết lập thời gian đăng ký nhóm</h3>
              <button className="close-btn" onClick={() => setIsTimeModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Đã lưu thời gian đăng ký nhóm!'); setIsTimeModalOpen(false); }}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Lớp học</label>
                    <select className="sg-input" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      {lopHocList.map((lop) => <option key={lop.maLop} value={lop.maLop}>{lop.tenLop}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thời gian bắt đầu</label>
                    <input type="datetime-local" className="sg-input" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} required />
                  </div>
                  <div className="form-group">
                    <label>Thời gian kết thúc</label>
                    <input type="datetime-local" className="sg-input" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsTimeModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu thiết lập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGroups;
