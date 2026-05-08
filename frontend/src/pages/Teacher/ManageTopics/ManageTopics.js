import React, { useState, useEffect, useRef } from 'react';
import './ManageTopics.css';
import {
  FaPlus, FaSearch, FaBookOpen, FaUsers, FaCheckCircle, FaClock,
  FaEdit, FaTrash, FaShareAlt, FaTimes, FaCalendarAlt, FaFileAlt,
  FaBullseye, FaPaperclip, FaDownload, FaTimesCircle
} from 'react-icons/fa';
import deTaiService from '../../../services/deTaiService';
import classService from '../../../services/classService';

const ALLOWED_EXTENSIONS = ['.txt', '.docx', '.pdf'];
const MAX_FILE_SIZE_MB = 5;

const ManageTopics = () => {
  const [topics, setTopics]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    topicName: '', description: '', output: '',
    startDate: '', endDate: '', classId: '', className: '',
    attachment: null   // File object (mới chọn)
  });

  // Lỗi validation ngày
  const [dateError, setDateError] = useState('');

  // Assign
  const [assignType, setAssignType]       = useState('direct');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Ref để reset input file
  const fileInputCreateRef = useRef(null);
  const fileInputEditRef   = useRef(null);

  // ─── Fetch cấu hình ─────────────────────────────────────────
  useEffect(() => {
    // Giữ nguyên logic cũ (không ảnh hưởng đến phần file đề tài)
  }, []);

  // ─── Fetch danh sách lớp ────────────────────────────────────
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

  // ─── Fetch đề tài khi đổi lớp ───────────────────────────────
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        if (filterClass === 'all') {
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

  // ─── Helpers ────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi ngày khi người dùng thay đổi
    if (['startDate', 'endDate', 'classId'].includes(name)) setDateError('');
  };

  /**
   * Validate file phía frontend:
   *  - Chỉ chấp nhận .txt, .docx, .pdf
   *  - Tối đa MAX_FILE_SIZE_MB MB
   */
  const validateFileClient = (file) => {
    if (!file) return null;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Định dạng không được phép. Chỉ chấp nhận: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File vượt quá ${MAX_FILE_SIZE_MB} MB.`;
    }
    return null; // hợp lệ
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    if (!file) {
      setFormData(prev => ({ ...prev, attachment: null }));
      return;
    }
    const err = validateFileClient(file);
    if (err) {
      alert(err);
      e.target.value = ''; // reset input
      setFormData(prev => ({ ...prev, attachment: null }));
      return;
    }
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handleRemoveAttachment = (inputRef) => {
    setFormData(prev => ({ ...prev, attachment: null }));
    if (inputRef?.current) inputRef.current.value = '';
  };

  /**
   * Kiểm tra ràng buộc ngày:
   *   ngày bắt đầu đề tài  ≥ ngày bắt đầu lớp  ≥ ngày bắt đầu học kỳ
   *   ngày kết thúc đề tài ≤ ngày kết thúc lớp ≤ ngày kết thúc học kỳ
   *
   * classObj phải chứa: ngayBatDau, ngayKetThuc (lớp)
   *                 và  hocKy.ngayBatDau, hocKy.ngayKetThuc (học kỳ) — nếu có
   */
  const validateDates = (startDate, endDate, classObj) => {
    if (!startDate || !endDate) return 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.';
    const topicStart = new Date(startDate);
    const topicEnd   = new Date(endDate);

    if (topicStart >= topicEnd) return 'Ngày bắt đầu đề tài phải trước ngày kết thúc.';

    if (classObj) {
      // So sánh với ngày lớp
      if (classObj.ngayBatDau) {
        const classStart = new Date(classObj.ngayBatDau);
        if (topicStart < classStart)
          return `Ngày bắt đầu đề tài (${startDate}) không được trước ngày bắt đầu lớp (${classObj.ngayBatDau}).`;
      }
      if (classObj.ngayKetThuc) {
        const classEnd = new Date(classObj.ngayKetThuc);
        if (topicEnd > classEnd)
          return `Ngày kết thúc đề tài (${endDate}) không được sau ngày kết thúc lớp (${classObj.ngayKetThuc}).`;
      }

      // So sánh với ngày học kỳ (nếu classObj trả về thông tin hocKy)
      if (classObj.hocKy) {
        const hk = classObj.hocKy;
        if (hk.ngayBatDau) {
          const hkStart = new Date(hk.ngayBatDau);
          if (topicStart < hkStart)
            return `Ngày bắt đầu đề tài (${startDate}) không được trước ngày bắt đầu học kỳ (${hk.ngayBatDau}).`;
        }
        if (hk.ngayKetThuc) {
          const hkEnd = new Date(hk.ngayKetThuc);
          if (topicEnd > hkEnd)
            return `Ngày kết thúc đề tài (${endDate}) không được sau ngày kết thúc học kỳ (${hk.ngayKetThuc}).`;
        }
      }
    }
    return null; // OK
  };

  // ─── Tạo đề tài ─────────────────────────────────────────────
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setDateError('');

    if (formData.topicName.length > 100)   return alert('Tên đề tài không quá 100 ký tự');
    if (formData.description.length > 255) return alert('Mô tả không quá 255 ký tự');
    if (formData.output.length > 100)      return alert('Sản phẩm kỳ vọng không quá 100 ký tự');

    const selectedClass = classes.find(c => c.maLop === parseInt(formData.classId));
    const dateErr = validateDates(formData.startDate, formData.endDate, selectedClass);
    if (dateErr) { setDateError(dateErr); return; }

    try {
      const form = new FormData();
      form.append('TenDeTai',      formData.topicName);
      form.append('MoTa',          formData.description);
      form.append('SanPhamKyVong', formData.output);
      form.append('MaLop',         formData.classId);
      form.append('NgayBatDau',    formData.startDate);
      form.append('NgayKetThuc',   formData.endDate);
      form.append('PhuongThucGiao', 'Đăng ký tự do');
      if (formData.attachment) {
        form.append('File', formData.attachment);
      }

      await deTaiService.taoDeTai(form);
      alert('Tạo đề tài thành công!');
      setIsCreateModalOpen(false);
      resetForm();

      if (filterClass === formData.classId.toString() || filterClass !== 'all') {
        const data = await deTaiService.getDanhSachDeTai(
          filterClass !== 'all' ? filterClass : formData.classId
        );
        setTopics(data);
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // ─── Chỉnh sửa đề tài ───────────────────────────────────────
  const handleEditTopic = async (e) => {
    e.preventDefault();
    setDateError('');

    if (formData.topicName.length > 100)   return alert('Tên đề tài không quá 100 ký tự');
    if (formData.description.length > 255) return alert('Mô tả không quá 255 ký tự');
    if (formData.output.length > 100)      return alert('Sản phẩm kỳ vọng không quá 100 ký tự');

    const selectedClass = classes.find(c => c.maLop === parseInt(formData.classId));
    const dateErr = validateDates(formData.startDate, formData.endDate, selectedClass);
    if (dateErr) { setDateError(dateErr); return; }

    try {
      const form = new FormData();
      form.append('TenDeTai',      formData.topicName);
      form.append('MoTa',          formData.description);
      form.append('SanPhamKyVong', formData.output);
      form.append('NgayBatDau',    formData.startDate);
      form.append('NgayKetThuc',   formData.endDate);
      if (formData.attachment) {
        form.append('File', formData.attachment);
      }

      await deTaiService.capNhatDeTai(selectedTopic.maDeTai, form);
      alert('Cập nhật đề tài thành công!');
      setIsEditModalOpen(false);

      const data = await deTaiService.getDanhSachDeTai(formData.classId);
      setTopics(data);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // ─── Xóa đề tài ─────────────────────────────────────────────
  const handleDeleteTopic = async (maDeTai) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề tài này?')) return;
    try {
      await deTaiService.xoaDeTai(maDeTai);
      alert('Xóa đề tài thành công!');
      setTopics(topics.filter(t => t.maDeTai !== maDeTai));
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // ─── Mở modal Edit ──────────────────────────────────────────
  const handleOpenEdit = (topic) => {
    setSelectedTopic(topic);
    setDateError('');
    setFormData({
      topicName:   topic.tenDeTai,
      description: topic.moTa || '',
      output:      topic.sanPhamKyVong || '',
      startDate:   topic.ngayBatDau  || '',
      endDate:     topic.ngayKetThuc || '',
      classId:     topic.maLop,
      className:   '',
      attachment:  null   // reset — giữ file cũ trên server, hiển thị riêng
    });
    setIsEditModalOpen(true);
  };

  // ─── Assign ─────────────────────────────────────────────────
  const handleOpenAssign = async (topic) => {
    setSelectedTopic(topic);
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
        maNhom:  assignType === 'direct' ? (selectedGroupId ? parseInt(selectedGroupId) : 0) : null,
        phuongThucGiao: assignType === 'direct' ? 'Chỉ định trực tiếp' : 'Đăng ký tự do'
      };
      const response = await deTaiService.giaoDeTai(payload);
      alert(response.thongBao);
      const data = await deTaiService.getDanhSachDeTai(selectedTopic.maLop);
      setTopics(data);
      setIsAssignModalOpen(false);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // ─── Reset form ──────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ topicName: '', description: '', output: '', startDate: '', endDate: '', classId: '', className: '', attachment: null });
    setDateError('');
    if (fileInputCreateRef.current) fileInputCreateRef.current.value = '';
    if (fileInputEditRef.current)   fileInputEditRef.current.value   = '';
  };

  // ─── Filter ──────────────────────────────────────────────────
  const filteredTopics = topics.filter(t =>
    t.tenDeTai.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Stats ───────────────────────────────────────────────────
  const totalTopics        = topics.length;
  const assignedTopics     = topics.filter(t => t.daCoNhom).length;
  const unassignedTopics   = topics.filter(t => !t.daCoNhom).length;
  const groupsParticipated = [...new Set(topics.filter(t => t.maNhom).map(t => t.maNhom))].length;

  // ─── Sub-components ──────────────────────────────────────────
  /** Khu vực upload file dùng chung cho Create & Edit modal */
  const FileUploadArea = ({ inputRef, currentFile, isEdit }) => (
    <div className="file-upload-area">
      {/* Hiển thị file đang tồn tại trên server (chỉ ở Edit) */}
      {isEdit && currentFile && (
        <div className="current-file-info">
          <FaFileAlt className="file-icon-sm" />
          <span className="current-file-label">Tài liệu hiện tại:</span>
          <a
            href={`http://localhost:5186${currentFile.duongDan}`}
            target="_blank"
            rel="noopener noreferrer"
            className="current-file-link"
            title="Tải về / Xem file"
          >
            <FaDownload style={{ marginRight: 4, fontSize: 11 }} />
            {currentFile.tenTep}
          </a>
        </div>
      )}

      {/* File mới vừa chọn */}
      {formData.attachment ? (
        <div className="file-selected-preview">
          <FaFileAlt className="file-icon-sm green" />
          <span className="file-selected-name">{formData.attachment.name}</span>
          <span className="file-selected-size">
            ({(formData.attachment.size / 1024).toFixed(1)} KB)
          </span>
          <button
            type="button"
            className="file-remove-btn"
            onClick={() => handleRemoveAttachment(inputRef)}
            title="Bỏ chọn file"
          >
            <FaTimesCircle />
          </button>
        </div>
      ) : (
        <label className="file-drop-label" htmlFor={isEdit ? 'file-edit' : 'file-create'}>
          <FaPaperclip className="file-clip-icon" />
          <span>
            {isEdit && currentFile
              ? 'Chọn file mới để thay thế (không bắt buộc)'
              : 'Đính kèm tài liệu (không bắt buộc)'}
          </span>
          <span className="file-hint">.txt, .docx, .pdf — tối đa {MAX_FILE_SIZE_MB} MB</span>
        </label>
      )}

      <input
        type="file"
        id={isEdit ? 'file-edit' : 'file-create'}
        ref={inputRef}
        onChange={handleFileChange}
        accept=".txt,.docx,.pdf"
        style={{ display: 'none' }}
      />
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="manage-topics-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý Đề tài</h2>
          <p className="page-subtitle">Tạo, quản lý và giao đề tài cho các nhóm học tập</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
          <FaPlus /> Tạo đề tài mới
        </button>
      </div>

      {/* THỐNG KÊ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FaBookOpen /></div>
          <div className="stat-info"><h4>Tổng đề tài</h4><span className="stat-number">{totalTopics}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaCheckCircle /></div>
          <div className="stat-info"><h4>Đã giao nhóm</h4><span className="stat-number">{assignedTopics}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaClock /></div>
          <div className="stat-info"><h4>Chưa giao</h4><span className="stat-number">{unassignedTopics}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaUsers /></div>
          <div className="stat-info"><h4>Nhóm tham gia</h4><span className="stat-number">{groupsParticipated}</span></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm đề tài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="all">-- Chọn lớp để xem đề tài --</option>
          {classes.map(cls => (
            <option key={cls.maLop} value={cls.maLop}>{cls.tenLop}</option>
          ))}
        </select>
      </div>

      {/* DANH SÁCH ĐỀ TÀI */}
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
                  <button className="action-btn edit"   title="Sửa"         onClick={() => handleOpenEdit(topic)}><FaEdit /></button>
                  <button className="action-btn delete" title="Xóa"         onClick={() => handleDeleteTopic(topic.maDeTai)}><FaTrash /></button>
                </div>
              </div>

              <p className="topic-description">{topic.moTa}</p>

              <div className="topic-meta">
                <span className="meta-tag"><FaCalendarAlt className="meta-icon" /> {topic.ngayBatDau} → {topic.ngayKetThuc}</span>
                <span className="meta-tag"><FaBullseye className="meta-icon" /> {topic.sanPhamKyVong}</span>
                {topic.phuongThucGiao && (
                  <span className="meta-tag" style={{ color: '#6366f1' }}>
                    <FaShareAlt className="meta-icon" /> {topic.phuongThucGiao}
                  </span>
                )}
                {topic.tepDinhKem && (
                  <span className="meta-tag" style={{ color: '#10b981' }}>
                    <FaFileAlt className="meta-icon" />
                    <a
                      href={`http://localhost:5186${topic.tepDinhKem.duongDan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'underline' }}
                      title="Tải tài liệu đề tài"
                    >
                      {topic.tepDinhKem.tenTep}
                    </a>
                  </span>
                )}
              </div>

              <div className="topic-footer">
                <span className={`assigned-group ${topic.daCoNhom ? 'assigned' : 'unassigned'}`}>
                  <FaUsers /> {topic.daCoNhom ? topic.tenNhom : 'Chưa giao nhóm'}
                </span>
                <span className="topic-class-name">
                  <FaFileAlt /> {classes.find(c => c.maLop === topic.maLop)?.tenLop || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL TẠO ĐỀ TÀI
      ═══════════════════════════════════════════ */}
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
                  {/* Tên đề tài */}
                  <div className="form-group full-width">
                    <label>Tên đề tài * <span className="char-count">{formData.topicName.length}/100</span></label>
                    <input type="text" name="topicName" value={formData.topicName} onChange={handleFormChange} maxLength={100} placeholder="VD: Xây dựng website quản lý..." required />
                  </div>
                  {/* Mô tả */}
                  <div className="form-group full-width">
                    <label>Mô tả yêu cầu * <span className="char-count">{formData.description.length}/255</span></label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} maxLength={255} rows="3" placeholder="Mô tả chi tiết yêu cầu kỹ thuật..." required />
                  </div>
                  {/* Output */}
                  <div className="form-group full-width">
                    <label>Sản phẩm kỳ vọng (Output) * <span className="char-count">{formData.output.length}/100</span></label>
                    <input type="text" name="output" value={formData.output} onChange={handleFormChange} maxLength={100} placeholder="VD: Website + Báo cáo + Source code" required />
                  </div>
                  {/* Lớp học */}
                  <div className="form-group">
                    <label>Lớp học *</label>
                    <select name="classId" value={formData.classId} onChange={handleFormChange} required>
                      <option value="">-- Chọn lớp --</option>
                      {classes.map(cls => (
                        <option key={cls.maLop} value={cls.maLop}>{cls.tenLop}</option>
                      ))}
                    </select>
                  </div>
                  {/* Khoảng thời gian */}
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} required />
                  </div>
                  {/* Lỗi ngày */}
                  {dateError && (
                    <div className="form-group full-width">
                      <div className="date-error-msg">⚠️ {dateError}</div>
                    </div>
                  )}
                  {/* Đính kèm */}
                  <div className="form-group full-width">
                    <label>Tài liệu đính kèm</label>
                    <FileUploadArea inputRef={fileInputCreateRef} isEdit={false} />
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

      {/* ═══════════════════════════════════════════
          MODAL CHỈNH SỬA ĐỀ TÀI
      ═══════════════════════════════════════════ */}
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
                  {/* Lỗi ngày */}
                  {dateError && (
                    <div className="form-group full-width">
                      <div className="date-error-msg">⚠️ {dateError}</div>
                    </div>
                  )}
                  {/* Đính kèm — hiển thị file cũ + cho phép thay thế */}
                  <div className="form-group full-width">
                    <label>Tài liệu đính kèm</label>
                    <FileUploadArea
                      inputRef={fileInputEditRef}
                      currentFile={selectedTopic.tepDinhKem}
                      isEdit={true}
                    />
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

      {/* ═══════════════════════════════════════════
          MODAL GIAO ĐỀ TÀI
      ═══════════════════════════════════════════ */}
      {isAssignModalOpen && selectedTopic && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Giao đề tài: {selectedTopic.tenDeTai}</h3>
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
                        {group.tenNhom} ({group.soThanhVienHienTai}/{group.soThanhVienToiDa} TV)
                        {group.tenDeTai ? ` - [Đã có: ${group.tenDeTai}]` : ' - [Chưa có đề tài]'}
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
