import React, { useState, useEffect } from 'react';
import './ManageTopics.css';
import { FaPlus, FaSearch, FaBookOpen, FaUsers, FaCheckCircle, FaClock, FaEdit, FaTrash, FaShareAlt, FaTimes, FaCalendarAlt, FaFileAlt, FaBullseye } from 'react-icons/fa';
import deTaiService from '../../../services/deTaiService';
import classService from '../../../services/classService';


const ManageTopics = () => {
  const [topics, setTopics] = useState([]);
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]); // Danh sách nhóm của lớp đang xét
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [config, setConfig] = useState({ maxFileSize: 20, allowedExtensions: '.pdf,.docx,.zip' });

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

  // Fetch cấu hình hệ thống
  const [assignType, setAssignType] = useState('direct');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:5186/api/admin/cauhinh');
        const data = await response.json();
        const maxFile = data.find(c => c.khoaCauHinh === 'MaxFileSizeMB')?.giaTriCauHinh;
        const extensions = data.find(c => c.khoaCauHinh === 'AllowedExtensions')?.giaTriCauHinh;
        setConfig({
          maxFileSize: parseInt(maxFile || '20'),
          allowedExtensions: extensions || '.pdf,.docx,.zip'
        });
      } catch (error) {
        console.error('Lỗi khi lấy cấu hình:', error);
      }
    };
    fetchConfig();
  }, []);

  // Fetch danh sách lớp của giảng viên
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classService.getMyClasses();
        setClasses(data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách lớp:', error);
      }
    };
    fetchClasses();
  }, []);

  // Fetch danh sách đề tài khi đổi lớp lọc
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        if (filterClass === 'all') {
          // Nếu chọn tất cả lớp, có thể loop qua từng lớp để lấy đề tài hoặc API hỗ trợ lấy tất cả
          // Ở đây giả định chúng ta cần chọn một lớp cụ thể để quản lý tốt hơn
          setTopics([]);
        } else {
          const data = await deTaiService.getDanhSachDeTai(filterClass);
          setTopics(data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đề tài:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [filterClass]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    // Đã loại bỏ tính năng đính kèm tệp
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    
    // Ràng buộc phía Frontend
    if (formData.topicName.length > 100) return alert('Tên đề tài không quá 100 ký tự');
    if (formData.description.length > 255) return alert('Mô tả không quá 255 ký tự');
    if (formData.output.length > 100) return alert('Sản phẩm kỳ vọng không quá 100 ký tự');

    const selectedClass = classes.find(c => c.maLop === parseInt(formData.classId));
    if (selectedClass) {
      const topicStart = new Date(formData.startDate);
      const topicEnd = new Date(formData.endDate);
      const classStart = new Date(selectedClass.ngayBatDau);
      const classEnd = new Date(selectedClass.ngayKetThuc);

      if (topicStart < classStart) return alert(`Ngày bắt đầu đề tài không được trước ngày bắt đầu lớp (${selectedClass.ngayBatDau})`);
      if (topicEnd > classEnd) return alert(`Ngày kết thúc đề tài không được sau ngày kết thúc lớp (${selectedClass.ngayKetThuc})`);
    }

    try {
      const form = new FormData();
      form.append('tenDeTai', formData.topicName);
      form.append('moTa', formData.description);
      form.append('sanPhamKyVong', formData.output);
      form.append('maLop', formData.classId);
      form.append('ngayBatDau', formData.startDate);
      form.append('ngayKetThuc', formData.endDate);
      form.append('phuongThucGiao', 'Đăng ký tự do');
      if (formData.attachment) {
        form.append('file', formData.attachment);
      }
      
      await deTaiService.taoDeTai(form);
      alert('Tạo đề tài thành công!');
      setIsCreateModalOpen(false);
      setFormData({ topicName: '', description: '', output: '', startDate: '', endDate: '', classId: filterClass !== 'all' ? filterClass : '', className: '', attachment: null });
      
      if (filterClass === formData.classId.toString() || filterClass === 'all') {
        const data = await deTaiService.getDanhSachDeTai(formData.classId);
        setTopics(data);
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleEditTopic = async (e) => {
    e.preventDefault();
    
    // Validate
    if (formData.topicName.length > 100) return alert('Tên đề tài không quá 100 ký tự');
    if (formData.description.length > 255) return alert('Mô tả không quá 255 ký tự');
    if (formData.output.length > 100) return alert('Sản phẩm kỳ vọng không quá 100 ký tự');

    const selectedClass = classes.find(c => c.maLop === parseInt(formData.classId));
    if (selectedClass) {
      const topicStart = new Date(formData.startDate);
      const topicEnd = new Date(formData.endDate);
      const classStart = new Date(selectedClass.ngayBatDau);
      const classEnd = new Date(selectedClass.ngayKetThuc);

      if (topicStart < classStart) return alert(`Ngày bắt đầu không được trước ngày bắt đầu lớp (${selectedClass.ngayBatDau})`);
      if (topicEnd > classEnd) return alert(`Ngày kết thúc không được sau ngày kết thúc lớp (${selectedClass.ngayKetThuc})`);
    }

    try {
      const payload = {
        tenDeTai: formData.topicName,
        moTa: formData.description,
        sanPhamKyVong: formData.output,
        ngayBatDau: formData.startDate,
        ngayKetThuc: formData.endDate
      };
      
      await deTaiService.capNhatDeTai(selectedTopic.maDeTai, payload);
      alert('Cập nhật đề tài thành công!');
      setIsEditModalOpen(false);
      
      const data = await deTaiService.getDanhSachDeTai(formData.classId);
      setTopics(data);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleDeleteTopic = async (maDeTai) => {
    if (window.confirm('Bạn có chắc muốn xóa đề tài này?')) {
      try {
        await deTaiService.xoaDeTai(maDeTai);
        alert('Xóa đề tài thành công!');
        setTopics(topics.filter(t => t.maDeTai !== maDeTai));
      } catch (error) {
        alert('Lỗi: ' + error.message);
      }
    }
  };

  const handleOpenEdit = (topic) => {
    setSelectedTopic(topic);
    setFormData({
      topicName: topic.tenDeTai, 
      description: topic.moTa || '', 
      output: topic.sanPhamKyVong || '',
      startDate: topic.ngayBatDau, 
      endDate: topic.ngayKetThuc, 
      classId: topic.maLop, 
      className: '', 
      attachment: null
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAssign = async (topic) => {
    setSelectedTopic(topic);
    // Đồng bộ radio với phuongThucGiao thực tế của đề tài
    const currentType = topic.phuongThucGiao === 'Chỉ định trực tiếp' ? 'direct' : 'free';
    setAssignType(currentType);
    setSelectedGroupId(topic.maNhom || '');
    setIsAssignModalOpen(true);

    try {
      const classData = await classService.getClassById(topic.maLop);
      setGroups(classData.danhSachNhom || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhóm:', error);
    }
  };

  const handleAssignTopic = async () => {
    try {
      const payload = {
        maDeTai: selectedTopic.maDeTai,
        maNhom: assignType === 'direct' ? (selectedGroupId ? parseInt(selectedGroupId) : 0) : null,
        phuongThucGiao: assignType === 'direct' ? 'Chỉ định trực tiếp' : 'Đăng ký tự do'
      };

      const response = await deTaiService.giaoDeTai(payload);
      alert(response.thongBao);
      
      // Refresh list
      const data = await deTaiService.getDanhSachDeTai(selectedTopic.maLop);
      setTopics(data);
      setIsAssignModalOpen(false);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // Filter
  const filteredTopics = topics.filter(t => {
    const matchSearch = t.tenDeTai.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
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
          <option value="all">-- Chọn lớp để xem đề tài --</option>
          {classes.map(cls => (
            <option key={cls.maLop} value={cls.maLop}>{cls.tenLop}</option>
          ))}
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
            <div className="topic-card" key={topic.maDeTai}>
              <div className="topic-card-header">
                <h3>{topic.tenDeTai}</h3>
                <div className="topic-actions">
                  <button className="action-btn assign" title="Giao đề tài" onClick={() => handleOpenAssign(topic)}><FaShareAlt /></button>
                  <button className="action-btn edit" title="Sửa" onClick={() => handleOpenEdit(topic)}><FaEdit /></button>
                  <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteTopic(topic.maDeTai)}><FaTrash /></button>
                </div>
              </div>

              <p className="topic-description">{topic.moTa}</p>

              <div className="topic-meta">
                <span className="meta-tag"><FaCalendarAlt className="meta-icon" /> {topic.ngayBatDau} → {topic.ngayKetThuc}</span>
                <span className="meta-tag"><FaBullseye className="meta-icon" /> {topic.sanPhamKyVong}</span>
                {topic.phuongThucGiao && <span className="meta-tag" style={{ color: '#6366f1' }}><FaShareAlt className="meta-icon" /> {topic.phuongThucGiao}</span>}
              </div>

              <div className="topic-footer">
                <span className={`assigned-group ${topic.daCoNhom ? 'assigned' : 'unassigned'}`}>
                  <FaUsers /> {topic.daCoNhom ? topic.tenNhom : 'Chưa giao nhóm'}
                </span>
                <span className="topic-class-name"><FaFileAlt /> {classes.find(c => c.maLop === topic.maLop)?.tenLop || ''}</span>
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
                    <label>Tên đề tài * <span className="char-count">{formData.topicName.length}/100</span></label>
                    <input type="text" name="topicName" value={formData.topicName} onChange={handleFormChange} maxLength={100} placeholder="VD: Xây dựng website quản lý..." required />
                  </div>
                  <div className="form-group full-width">
                    <label>Mô tả yêu cầu * <span className="char-count">{formData.description.length}/255</span></label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} maxLength={255} rows="3" placeholder="Mô tả chi tiết yêu cầu kỹ thuật..." required />
                  </div>
                  <div className="form-group full-width">
                    <label>Sản phẩm kỳ vọng (Output) * <span className="char-count">{formData.output.length}/100</span></label>
                    <input type="text" name="output" value={formData.output} onChange={handleFormChange} maxLength={100} placeholder="VD: Website + Báo cáo + Source code" required />
                  </div>
                  <div className="form-group">
                    <label>Lớp học *</label>
                    <select name="classId" value={formData.classId} onChange={handleFormChange} required>
                      <option value="">-- Chọn lớp --</option>
                      {classes.map(cls => (
                        <option key={cls.maLop} value={cls.maLop}>{cls.tenLop}</option>
                      ))}
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
                    <label>Tên đề tài * <span className="char-count">{formData.topicName.length}/100</span></label>
                    <input type="text" name="topicName" value={formData.topicName} onChange={handleFormChange} maxLength={100} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Mô tả yêu cầu * <span className="char-count">{formData.description.length}/255</span></label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} maxLength={255} rows="3" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Sản phẩm kỳ vọng * <span className="char-count">{formData.output.length}/100</span></label>
                    <input type="text" name="output" value={formData.output} onChange={handleFormChange} maxLength={100} required />
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
                        <option value="">--- Chọn nhóm để chỉ định / Gỡ nhóm ---</option>
                        {groups.map(group => (
                          <option key={group.maNhom} value={group.maNhom}>
                            {group.tenNhom} ({group.soThanhVienHienTai}/{group.soThanhVienToiDa} TV) {group.tenDeTai ? ` - [Đã có: ${group.tenDeTai}]` : ' - [Chưa có đề tài]'}
                          </option>
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
