import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaUsers, FaTasks,
  FaComments, FaUserPlus, FaUserCog, FaEye, FaBook, FaCalendarAlt, FaSave
} from 'react-icons/fa';
import './styles/GroupManagement.css';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classList, setClassList] = useState([]);
  const [studentList, setStudentList] = useState([]);

  const [newGroup, setNewGroup] = useState({
    tenNhom: '',
    maLop: '',
    maNhomTruong: '',
    soThanhVienToiDa: 5
  });

  const [newTopic, setNewTopic] = useState({
    tenDeTai: '',
    moTa: '',
    sanPhamKyVong: '',
    ngayBatDau: '',
    ngayKetThuc: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, classesRes, usersRes] = await Promise.all([
        fetch('http://localhost:5186/api/nhom'),
        fetch('http://localhost:5186/api/lophoc'),
        fetch('http://localhost:5186/api/nguoidung')
      ]);

      if (classesRes.ok) {
        const classes = await classesRes.json();
        setClassList(classes.map((c) => ({ MaLop: c.maLop, TenLop: c.tenLop })));
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        setStudentList(
          users
            .filter((u) => u.maVaiTro === 3 && u.dangHoatDong)
            .map((u) => ({ MaNguoiDung: u.maNguoiDung, HoTen: u.hoTen }))
        );
      }

      if (groupsRes.ok) {
        const grps = await groupsRes.json();
        setGroups(grps.map((g) => ({
          ...g,
          id: g.maNhom,
          tenNhomTruong: g.nhomTruong || 'Chưa có',
          soThanhVien: g.soThanhVienHienTai || 0,
          soLuongTask: g.soLuongTask || 0,
          soLuongHoanThanh: g.soLuongHoanThanh || 0,
          soLuongTinNhan: g.soLuongTinNhan || 0,
          thanhVien: g.thanhVien || [],
          trangThai: g.trangThai || 'active'
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.tenNhom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tenNhomTruong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.tenDeTai && group.tenDeTai.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClass === 'all' || group.maLop === parseInt(selectedClass, 10);
    const matchesStatus = selectedStatus === 'all' || group.trangThai === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const deleteGroup = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm này?')) return;

    try {
      const response = await fetch(`http://localhost:5186/api/nhom/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        alert('Xóa thành công');
      } else {
        alert('Lỗi xóa nhóm');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewGroupDetail = (group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  const handleAddGroup = async () => {
    if (!newGroup.tenNhom || !newGroup.maLop || !newGroup.maNhomTruong) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5186/api/nhom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenNhom: newGroup.tenNhom,
          maLop: parseInt(newGroup.maLop, 10),
          soThanhVienToiDa: parseInt(newGroup.soThanhVienToiDa || 5, 10)
        })
      });

      if (!response.ok) {
        alert('Lỗi tạo nhóm');
        return;
      }

      const data = await response.json();
      await fetch(`http://localhost:5186/api/nhom/${data.maNhom}/nhomtruong`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maSinhVien: parseInt(newGroup.maNhomTruong, 10) })
      });

      alert('Tạo nhóm thành công!');
      fetchData();
      setNewGroup({ tenNhom: '', maLop: '', maNhomTruong: '', soThanhVienToiDa: 5 });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.tenDeTai) {
      alert('Vui lòng nhập tên đề tài!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5186/api/nhom/${selectedGroup.id}/detai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenDeTai: newTopic.tenDeTai,
          moTa: newTopic.moTa,
          sanPhamKyVong: newTopic.sanPhamKyVong,
          ngayBatDau: newTopic.ngayBatDau || null,
          ngayKetThuc: newTopic.ngayKetThuc || null
        })
      });

      if (response.ok) {
        alert('Đã thêm đề tài cho nhóm!');
        fetchData();
        setNewTopic({ tenDeTai: '', moTa: '', sanPhamKyVong: '', ngayBatDau: '', ngayKetThuc: '' });
        setShowTopicModal(false);
      } else {
        alert('Lỗi thêm đề tài');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openTopicModal = (group) => {
    setSelectedGroup(group);
    setNewTopic({ tenDeTai: '', moTa: '', sanPhamKyVong: '', ngayBatDau: '', ngayKetThuc: '' });
    setShowTopicModal(true);
  };

  const formatDate = (value) => {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="group-management">
      <div className="group-header-gradient">
        <div className="header-content">
          <h2>Quản lý nhóm học tập</h2>
          <p>Quản lý danh sách nhóm, đề tài và theo dõi tiến độ làm việc nhóm</p>
        </div>
      </div>

      <div className="group-toolbar">
        <button className="btn-create-group" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Tạo nhóm mới
        </button>

        <div className="group-filters">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm nhóm, nhóm trưởng, đề tài..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>

          <select className="filter-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="all">Tất cả lớp học</option>
            {classList.map((lop) => (
              <option key={lop.MaLop} value={lop.MaLop}>{lop.TenLop}</option>
            ))}
          </select>

          <select className="filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã kết thúc</option>
          </select>
        </div>
      </div>

      <div className="groups-container">
        {filteredGroups.map((group) => {
          const progressPercent = group.soLuongTask ? Math.round((group.soLuongHoanThanh / group.soLuongTask) * 100) : 0;

          return (
            <div key={group.id} className="group-card">
              <div className="group-card-header">
                <div className="group-name">
                  <h3>{group.tenNhom}</h3>
                  <span className="class-badge">{group.tenLop}</span>
                </div>
                <span className={`status-badge ${group.trangThai}`}>
                  {group.trangThai === 'inactive' ? 'Đã kết thúc' : 'Đang hoạt động'}
                </span>
              </div>

              <div className="group-card-body">
                <div className="group-leader">
                  <FaUserCog className="icon-leader" />
                  <span><strong>Nhóm trưởng:</strong> {group.tenNhomTruong}</span>
                </div>

                {group.tenDeTai ? (
                  <div className="group-topic">
                    <div className="topic-header">
                      <FaBook className="topic-icon" />
                      <span className="topic-title">{group.tenDeTai}</span>
                    </div>
                    <div className="topic-date">
                      <FaCalendarAlt /> {formatDate(group.ngayBatDauDeTai)} → {formatDate(group.ngayKetThucDeTai)}
                    </div>
                  </div>
                ) : (
                  <div className="group-topic empty">
                    <FaBook className="topic-icon" />
                    <span>Chưa có đề tài</span>
                    <button className="btn-add-topic" onClick={() => openTopicModal(group)}>
                      <FaPlus /> Thêm đề tài
                    </button>
                  </div>
                )}

                <div className="group-stats">
                  <div className="stat">
                    <FaUsers />
                    <span>{group.soThanhVien} thành viên</span>
                  </div>
                  <div className="stat">
                    <FaTasks />
                    <span>{group.soLuongHoanThanh}/{group.soLuongTask} việc</span>
                  </div>
                  <div className="stat">
                    <FaComments />
                    <span>{group.soLuongTinNhan} tin nhắn</span>
                  </div>
                </div>

                <div className="progress-wrapper">
                  <div className="progress-label">
                    <span>Tiến độ nhóm</span>
                    <span className="progress-value">{progressPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="group-card-footer">
                <button className="btn-action view" onClick={() => viewGroupDetail(group)}>
                  <FaEye /> Chi tiết
                </button>
                <button className="btn-action edit">
                  <FaUserPlus /> Thêm TV
                </button>
                <button className="btn-action edit">
                  <FaEdit />
                </button>
                <button className="btn-action delete" onClick={() => deleteGroup(group.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="empty-state">
          <FaUsers className="empty-icon" />
          <h3>Không tìm thấy nhóm nào</h3>
          <p>Hãy thử thay đổi bộ lọc hoặc tạo nhóm mới</p>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo nhóm mới</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên nhóm</label>
                <input type="text" value={newGroup.tenNhom} onChange={(e) => setNewGroup({ ...newGroup, tenNhom: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Lớp học</label>
                <select value={newGroup.maLop} onChange={(e) => setNewGroup({ ...newGroup, maLop: e.target.value })}>
                  <option value="">Chọn lớp học</option>
                  {classList.map((lop) => (
                    <option key={lop.MaLop} value={lop.MaLop}>{lop.TenLop}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nhóm trưởng</label>
                <select value={newGroup.maNhomTruong} onChange={(e) => setNewGroup({ ...newGroup, maNhomTruong: e.target.value })}>
                  <option value="">Chọn nhóm trưởng</option>
                  {studentList.map((sv) => (
                    <option key={sv.MaNguoiDung} value={sv.MaNguoiDung}>{sv.HoTen}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số thành viên tối đa</label>
                <input
                  type="number"
                  value={newGroup.soThanhVienToiDa}
                  onChange={(e) => setNewGroup({ ...newGroup, soThanhVienToiDa: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
              <button className="btn-save" onClick={handleAddGroup}>
                <FaSave /> Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopicModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm đề tài cho {selectedGroup.tenNhom}</h3>
              <button className="modal-close" onClick={() => setShowTopicModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên đề tài</label>
                <input type="text" value={newTopic.tenDeTai} onChange={(e) => setNewTopic({ ...newTopic, tenDeTai: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea rows="3" value={newTopic.moTa} onChange={(e) => setNewTopic({ ...newTopic, moTa: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Sản phẩm kỳ vọng</label>
                <textarea rows="2" value={newTopic.sanPhamKyVong} onChange={(e) => setNewTopic({ ...newTopic, sanPhamKyVong: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Ngày bắt đầu</label>
                  <input type="date" value={newTopic.ngayBatDau} onChange={(e) => setNewTopic({ ...newTopic, ngayBatDau: e.target.value })} />
                </div>
                <div className="form-group half">
                  <label>Hạn hoàn thành</label>
                  <input type="date" value={newTopic.ngayKetThuc} onChange={(e) => setNewTopic({ ...newTopic, ngayKetThuc: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTopicModal(false)}>Hủy bỏ</button>
              <button className="btn-save" onClick={handleAddTopic}>
                <FaSave /> Thêm đề tài
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupDetail && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowGroupDetail(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết nhóm: {selectedGroup.tenNhom}</h3>
              <button className="modal-close" onClick={() => setShowGroupDetail(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Thông tin chung</h4>
                <div className="info-grid">
                  <div className="info-item"><label>Lớp:</label><span>{selectedGroup.tenLop}</span></div>
                  <div className="info-item"><label>Nhóm trưởng:</label><span>{selectedGroup.tenNhomTruong}</span></div>
                  <div className="info-item"><label>Số thành viên:</label><span>{selectedGroup.soThanhVien}</span></div>
                  <div className="info-item"><label>Trạng thái:</label><span>{selectedGroup.trangThai === 'inactive' ? 'Đã kết thúc' : 'Đang hoạt động'}</span></div>
                </div>
              </div>

              {selectedGroup.tenDeTai && (
                <div className="detail-section">
                  <h4>Đề tài</h4>
                  <div className="info-grid">
                    <div className="info-item"><label>Tên đề tài:</label><span>{selectedGroup.tenDeTai}</span></div>
                    <div className="info-item"><label>Mô tả:</label><span>{selectedGroup.moTaDeTai || 'Chưa cập nhật'}</span></div>
                    <div className="info-item"><label>Sản phẩm:</label><span>{selectedGroup.sanPhamKyVong || 'Chưa cập nhật'}</span></div>
                    <div className="info-item"><label>Thời gian:</label><span>{formatDate(selectedGroup.ngayBatDauDeTai)} → {formatDate(selectedGroup.ngayKetThucDeTai)}</span></div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Danh sách thành viên</h4>
                <table className="member-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Lớp</th>
                      <th>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.thanhVien.map((member, index) => (
                      <tr key={member.maNguoiDung}>
                        <td>{index + 1}</td>
                        <td>{member.maSo}</td>
                        <td>{member.hoTen}</td>
                        <td>{member.lopSinhVien || 'Chưa cập nhật'}</td>
                        <td>{member.vaiTroTrongNhom === 'leader' ? 'Nhóm trưởng' : 'Thành viên'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
