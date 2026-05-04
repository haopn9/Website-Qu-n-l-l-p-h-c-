import React, { useState, useEffect, useRef } from 'react';
import { FaSave, FaHdd, FaTimes, FaCheckCircle, FaPlus } from 'react-icons/fa';
import './styles/SystemSettings.css';

const SystemSettings = () => {
  // State for Settings
  const [maxFileSize, setMaxFileSize] = useState(20);
  const [allowedExtensions, setAllowedExtensions] = useState(['.pdf', '.docx', '.zip', '.jpg', '.png']);
  const [tagInput, setTagInput] = useState('');
  
  // State for UI interactions
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Blacklist extensions (for frontend validation, backend should also enforce this)
  const blacklist = ['.exe', '.bat', '.sh', '.js', '.ps1', '.cmd'];

  // Simulate fetching initial data
  useEffect(() => {
    const fetchSettings = () => {
      // In a real app, this would be a fetch to GET /api/cauhinh
      setTimeout(() => {
        setMaxFileSize(20);
        setAllowedExtensions(['.pdf', '.docx', '.zip', '.jpg', '.png']);
        setIsLoading(false);
      }, 500);
    };
    fetchSettings();
  }, []);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value);
    setMaxFileSize(val);
    setIsDirty(true);
  };

  const removeTag = (tagToRemove) => {
    setAllowedExtensions(allowedExtensions.filter(tag => tag !== tagToRemove));
    setIsDirty(true);
  };

  const addTag = (newTag) => {
    // Normalize string: lowercase, trim, add dot if missing
    let normalized = newTag.trim().toLowerCase();
    if (normalized.length === 0) return;
    if (!normalized.startsWith('.')) {
      normalized = '.' + normalized;
    }

    if (blacklist.includes(normalized)) {
      alert(`Đuôi file ${normalized} không được phép (Nguy cơ bảo mật)!`);
      return;
    }

    if (!allowedExtensions.includes(normalized)) {
      setAllowedExtensions([...allowedExtensions, normalized]);
      setIsDirty(true);
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const handleQuickTagAdd = (tagsString) => {
    const tags = tagsString.split(',').map(t => t.trim());
    let added = false;
    const newExtensions = [...allowedExtensions];
    
    tags.forEach(tag => {
      if (!newExtensions.includes(tag) && !blacklist.includes(tag)) {
        newExtensions.push(tag);
        added = true;
      }
    });

    if (added) {
      setAllowedExtensions(newExtensions);
      setIsDirty(true);
    }
  };

  const handleSave = () => {
    if (maxFileSize <= 0) {
      alert("Dung lượng file phải lớn hơn 0 MB.");
      return;
    }
    
    // Simulate API Call PUT /api/cauhinh
    // body: { maxFileSizeMB: maxFileSize, allowedExtensions: allowedExtensions.join(',') }
    setIsDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Đang tải cấu hình hệ thống...</div>;
  }

  return (
    <div className="system-settings-page">
      <div className="page-header-settings">
        <div className="header-content">
          <h2>Cấu hình hệ thống</h2>
          <p>Thiết lập các tham số kỹ thuật, quản lý tài nguyên và bảo mật.</p>
        </div>
        <button 
          className="btn-save-master" 
          disabled={!isDirty} 
          onClick={handleSave}
        >
          <FaSave /> Lưu thay đổi
        </button>
      </div>

      <div className="settings-grid">
        {/* Card 1: Lưu trữ & Bảo mật */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">
              <FaHdd />
            </div>
            <h3>Cấu hình Lưu trữ & Upload</h3>
          </div>

          <div className="card-body">
            {/* Setting: Max File Size */}
            <div className="setting-row">
              <div className="setting-info">
                <h4>Dung lượng tệp tải lên tối đa</h4>
                <p>Giới hạn dung lượng tối đa cho mỗi tệp đính kèm trong tin nhắn, thảo luận hoặc nộp báo cáo. Tránh vượt quá sẽ gây quá tải Database và Server.</p>
              </div>
              <div className="setting-control">
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={maxFileSize} 
                    onChange={handleSliderChange}
                    className="range-slider"
                  />
                  <div className="slider-value">{maxFileSize} MB</div>
                </div>
              </div>
            </div>

            {/* Setting: Allowed Extensions */}
            <div className="setting-row">
              <div className="setting-info">
                <h4>Định dạng tệp cho phép</h4>
                <p>Ngăn chặn tải lên các tệp mã độc (ví dụ .exe, .bat). Nhập đuôi tệp và nhấn <strong>Enter</strong> hoặc dấu phẩy để thêm.</p>
              </div>
              <div className="setting-control">
                <div className="tag-input-container">
                  {allowedExtensions.map((tag, idx) => (
                    <div key={idx} className="tag">
                      {tag}
                      <span className="tag-close" onClick={() => removeTag(tag)}><FaTimes size={12} /></span>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    className="tag-input" 
                    placeholder="VD: .rar, .xls..." 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={() => { if(tagInput) { addTag(tagInput); setTagInput(''); } }}
                  />
                </div>
                <div className="quick-tags">
                  <button className="quick-tag-btn" onClick={() => handleQuickTagAdd('.doc,.docx,.pdf')}>+ Văn bản</button>
                  <button className="quick-tag-btn" onClick={() => handleQuickTagAdd('.zip,.rar,.7z')}>+ Nén</button>
                  <button className="quick-tag-btn" onClick={() => handleQuickTagAdd('.png,.jpg,.jpeg')}>+ Hình ảnh</button>
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Có thể mở rộng thêm các Card khác ở đây (Email, Phân quyền, v.v) */}
      </div>

      {showToast && (
        <div className="toast-notification">
          <FaCheckCircle size={20} /> Đã cập nhật cấu hình hệ thống thành công!
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
