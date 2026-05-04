import React, { useState } from 'react';
import './ManageTopics.css';
import { FaPlus, FaSearch, FaBookOpen, FaUsers, FaCheckCircle, FaClock, FaEdit, FaTrash, FaShareAlt, FaTimes, FaCalendarAlt, FaFileAlt, FaBullseye } from 'react-icons/fa';

// ===== DỮ LIỆU GIẢ LẬP =====
const mockTopics = [
  {
    topicId: 1, topicName: 'Xây dựng website bán hàng trực tuyến',
    description: 'Thiết kế và xây dựng một website thương mại điện tử cho phép người dùng duyệt sản phẩm, thêm vào giỏ hàng và thanh toán trực tuyến. Yêu cầu responsive design.',
    output: 'Website hoàn chỉnh + Báo cáo + Source code',
    startDate: '2026-02-01', endDate: '2026-05-15',
    className: 'Lập trình Web', classId: 1,
    assignedGroup: 'Nhóm 1', assignType: 'direct'
  },
  {
    topicId: 2, topicName: 'Ứng dụng quản lý thư viện',
    description: 'Phát triển hệ thống quản lý thư viện với các chức năng mượn trả sách, quản lý thành viên, tìm kiếm và thống kê. Sử dụng kiến trúc MVC.',
    output: 'Ứng dụng web + Tài liệu thiết kế + Demo',
    startDate: '2026-02-01', endDate: '2026-05-15',
    className: 'Lập trình Web', classId: 1,
    assignedGroup: 'Nhóm 2', assignType: 'direct'
  },
  {
    topicId: 3, topicName: 'Hệ thống quản lý sinh viên',
    description: 'Xây dựng hệ thống quản lý sinh viên bao gồm đăng ký môn học, xem điểm, quản lý thông tin cá nhân. Tích hợp xác thực và phân quyền người dùng.',
    output: 'Hệ thống + Báo cáo kỹ thuật',
    startDate: '2026-02-15', endDate: '2026-05-30',
    className: 'Lập trình Web', classId: 1,
    assignedGroup: null, assignType: 'free'
  },
  {
    topicId: 4, topicName: 'Thiết kế CSDL cho bệnh viện',
    description: 'Thiết kế cơ sở dữ liệu hoàn chỉnh cho hệ thống quản lý bệnh viện bao gồm bệnh nhân, bác sĩ, lịch khám, đơn thuốc và hóa đơn.',
    output: 'ERD + Mô hình quan hệ + Script SQL + Báo cáo',
    startDate: '2026-01-20', endDate: '2026-04-30',
    className: 'Cơ sở dữ liệu', classId: 2,
    assignedGroup: 'Nhóm 1', assignType: 'direct'
  },
  {
    topicId: 5, topicName: 'CSDL cho hệ thống đặt vé máy bay',
    description: 'Phân tích và thiết kế cơ sở dữ liệu cho hệ thống đặt vé máy bay trực tuyến, bao gồm quản lý chuyến bay, hành khách, đặt chỗ và thanh toán.',
    output: 'Mô hình dữ liệu + SQL Script + Dữ liệu mẫu',
    startDate: '2026-01-20', endDate: '2026-04-30',
    className: 'Cơ sở dữ liệu', classId: 2,
    assignedGroup: null, assignType: 'free'
  }
];

const mockGroups = [
  { groupId: 1, groupName: 'Nhóm 1', className: 'Lập trình Web', classId: 1 },
  { groupId: 2, groupName: 'Nhóm 2', className: 'Lập trình Web', classId: 1 },
  { groupId: 3, groupName: 'Nhóm 3', className: 'Lập trình Web', classId: 1 },
  { groupId: 4, groupName: 'Nhóm 1', className: 'Cơ sở dữ liệu', classId: 2 },
  { groupId: 5, groupName: 'Nhóm 2', className: 'Cơ sở dữ liệu', classId: 2 },
];

const ManageTopics = () => {
  const [topics, setTopics] = useState(mockTopics);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    topicName: '', description: '', output: '',
    startDate: '', endDate: '', classId: 1, className: 'Lập trình Web', attachment: null
  });

  // Assign state
  const [assignType, setAssignType] = useState('direct');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'classId') {
      const cls = name === 'classId' ? { 1: 'Lập trình Web', 2: 'Cơ sở dữ liệu' }[value] : '';
      setFormData({ ...formData, classId: parseInt(value), className: cls });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, attachment: e.target.files[0].name });
    }
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    const newTopic = {
      topicId: Date.now(), ...formData,
      assignedGroup: null, assignType: 'free'
    };
    setTopics([newTopic, ...topics]);
    setIsCreateModalOpen(false);
    setFormData({ topicName: '', description: '', output: '', startDate: '', endDate: '', classId: 1, className: 'Lập trình Web', attachment: null });
    alert('Tạo đề tài thành công!');
  };

  const handleEditTopic = (e) => {
    e.preventDefault();
    setTopics(topics.map(t => t.topicId === selectedTopic.topicId ? { ...t, ...formData } : t));
    setIsEditModalOpen(false);
    alert('Cập nhật đề tài thành công!');
  };

  const handleDeleteTopic = (topicId) => {
    if (window.confirm('Bạn có chắc muốn xóa đề tài này?')) {
      setTopics(topics.filter(t => t.topicId !== topicId));
    }
  };

  const handleOpenEdit = (topic) => {
    setSelectedTopic(topic);
    setFormData({
      topicName: topic.topicName, description: topic.description, output: topic.output,
      startDate: topic.startDate, endDate: topic.endDate, classId: topic.classId, className: topic.className, attachment: topic.attachment || null
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAssign = (topic) => {
    setSelectedTopic(topic);
    setAssignType(topic.assignType || 'free');
    setSelectedGroupId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignTopic = () => {
    if (assignType === 'direct' && selectedGroupId) {
      const group = mockGroups.find(g => g.groupId === parseInt(selectedGroupId));
      setTopics(topics.map(t =>
        t.topicId === selectedTopic.topicId
          ? { ...t, assignedGroup: group?.groupName || null, assignType: 'direct' }
          : t
      ));
      alert(`Đã giao đề tài cho ${group?.groupName}!`);
    } else if (assignType === 'free') {
      setTopics(topics.map(t =>
        t.topicId === selectedTopic.topicId
          ? { ...t, assignType: 'free', assignedGroup: null }
          : t
      ));
      alert('Đề tài đã được mở đăng ký tự do!');
    }
    setIsAssignModalOpen(false);
  };

  // Filter
  const filteredTopics = topics.filter(t => {
    const matchSearch = t.topicName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || t.classId === parseInt(filterClass);
    return matchSearch && matchClass;
  });

  // Stats
  const totalTopics = topics.length;
  const assignedTopics = topics.filter(t => t.assignedGroup).length;
  const unassignedTopics = topics.filter(t => !t.assignedGroup).length;

  return (
    <div className="manage-topics-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý Đề tài</h2>
          <p className="page-subtitle">Tạo, quản lý và giao đề tài cho các nhóm học tập</p>
        </div>
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <FaPlus /> Tạo đề tài mới
        </button>
      </div>

      {/* THỐNG KÊ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FaBookOpen /></div>
          <div className="stat-info">
            <h4>Tổng đề tài</h4>
            <span className="stat-number">{totalTopics}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaCheckCircle /></div>
          <div className="stat-info">
            <h4>Đã giao nhóm</h4>
            <span className="stat-number">{assignedTopics}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaClock /></div>
          <div className="stat-info">
            <h4>Chưa giao</h4>
            <span className="stat-number">{unassignedTopics}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaUsers /></div>
          <div className="stat-info">
            <h4>Nhóm tham gia</h4>
            <span className="stat-number">{assignedTopics}</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Tìm kiếm đề tài..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="all">Tất cả lớp</option>
          <option value="1">Lập trình Web</option>
          <option value="2">Cơ sở dữ liệu</option>
        </select>
      </div>

      {/* DANH SÁCH ĐỀ TÀI (CARD) */}
      {filteredTopics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>Không tìm thấy đề tài nào</p>
        </div>
      ) : (
        <div className="topics-grid">
          {filteredTopics.map(topic => (
            <div className="topic-card" key={topic.topicId}>
              <div className="topic-card-header">
                <h3>{topic.topicName}</h3>
                <div className="topic-actions">
                  <button className="action-btn assign" title="Giao đề tài" onClick={() => handleOpenAssign(topic)}><FaShareAlt /></button>
                  <button className="action-btn edit" title="Sửa" onClick={() => handleOpenEdit(topic)}><FaEdit /></button>
                  <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteTopic(topic.topicId)}><FaTrash /></button>
                </div>
              </div>

              <p className="topic-description">{topic.description}</p>

              <div className="topic-meta">
                <span className="meta-tag"><FaCalendarAlt className="meta-icon" /> {topic.startDate} → {topic.endDate}</span>
                <span className="meta-tag"><FaBullseye className="meta-icon" /> {topic.output}</span>
                {topic.attachment && <span className="meta-tag" style={{ color: '#2563eb' }}><FaFileAlt className="meta-icon" /> {topic.attachment}</span>}
              </div>

              <div className="topic-footer">
                <span className={`assigned-group ${topic.assignedGroup ? 'assigned' : 'unassigned'}`}>
                  <FaUsers /> {topic.assignedGroup || 'Chưa giao nhóm'}
                </span>
                <span className="topic-class-name"><FaFileAlt /> {topic.className}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO ĐỀ TÀI */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo đề tài mới</h3>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateTopic}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Tên đề tài *</label>
                    <input type="text" name="topicName" value={formData.topicName} onChange={handleFormChange} placeholder="VD: Xây dựng website quản lý..." required />
                  </div>
                  <div className="form-group full-width">
                    <label>Mô tả yêu cầu *</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" placeholder="Mô tả chi tiết yêu cầu kỹ thuật..." required />
                  </div>
                  <div className="form-group full-width">
                    <label>Sản phẩm kỳ vọng (Output) *</label>
                    <input type="text" name="output" value={formData.output} onChange={handleFormChange} placeholder="VD: Website + Báo cáo + Source code" required />
                  </div>
                  <div className="form-group">
                    <label>Lớp học *</label>
                    <select name="classId" value={formData.classId} onChange={handleFormChange}>
                      <option value="1">Lập trình Web</option>
                      <option value="2">Cơ sở dữ liệu</option>
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
                  <div className="form-group full-width">
                    <label>Tài liệu đính kèm</label>
                    <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.zip,.rar" />
                    {formData.attachment && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>Đã đính kèm: {formData.attachment}</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-save">Tạo đề tài</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA ĐỀ TÀI */}
      {isEditModalOpen && selectedTopic && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa đề tài</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditTopic}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Tên đề tài</label>
                    <input type="text" name="topicName" value={formData.topicName} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Mô tả yêu cầu</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Sản phẩm kỳ vọng</label>
                    <input type="text" name="output" value={formData.output} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Tài liệu đính kèm</label>
                    <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.zip,.rar" />
                    {formData.attachment && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>Đã đính kèm: {formData.attachment}</p>}
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

      {/* MODAL GIAO ĐỀ TÀI */}
      {isAssignModalOpen && selectedTopic && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Giao đề tài: {selectedTopic.topicName}</h3>
              <button className="close-btn" onClick={() => setIsAssignModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Chọn phương thức giao đề tài cho nhóm:</p>
              <div className="assign-options">
                <label className={`assign-option ${assignType === 'direct' ? 'selected' : ''}`}>
                  <input type="radio" name="assignType" value="direct" checked={assignType === 'direct'} onChange={() => setAssignType('direct')} />
                  <div className="assign-option-info">
                    <h4>Chỉ định trực tiếp</h4>
                    <p>Giảng viên gán đề tài cho một nhóm cụ thể</p>
                  </div>
                </label>
                <label className={`assign-option ${assignType === 'free' ? 'selected' : ''}`}>
                  <input type="radio" name="assignType" value="free" checked={assignType === 'free'} onChange={() => setAssignType('free')} />
                  <div className="assign-option-info">
                    <h4>Đăng ký tự do</h4>
                    <p>Các nhóm trưởng tự đăng ký theo nguyên tắc ai đăng ký trước</p>
                  </div>
                </label>
              </div>

              {assignType === 'direct' && (
                <div className="form-group" style={{ marginTop: 18 }}>
                  <label>Chọn nhóm:</label>
                  <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                    <option value="">-- Chọn nhóm --</option>
                    {mockGroups.filter(g => g.classId === selectedTopic.classId).map(g => (
                      <option key={g.groupId} value={g.groupId}>{g.groupName} - {g.className}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsAssignModalOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={handleAssignTopic}>Xác nhận giao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTopics;
