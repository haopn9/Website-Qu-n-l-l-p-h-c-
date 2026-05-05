import React, { useState, useEffect } from 'react';
import { FaSave, FaHdd, FaTimes, FaCheckCircle, FaBook, FaTasks, FaComments, FaCalendarAlt, FaStar } from 'react-icons/fa';
import './styles/SystemSettings.css';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    FILE_MAX_SIZE_DETAI: 20,
    FILE_EXT_DETAI: ['.pdf', '.docx', '.zip'],
    FILE_MAX_SIZE_TASK: 20,
    FILE_EXT_TASK: ['.pdf', '.docx', '.zip'],
    FILE_MAX_SIZE_MSG: 10,
    FILE_EXT_MSG: ['.pdf', '.png', '.jpg']
  });

  const [inputs, setInputs] = useState({ detai: '', task: '', msg: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [hocKys, setHocKys] = useState([]);
  const [newHocKy, setNewHocKy] = useState({ tenHocKy: '', ngayBatDau: '', ngayKetThuc: '' });
  const [editingHocKy, setEditingHocKy] = useState(null);
  const [editFormData, setEditFormData] = useState({ tenHocKy: '', ngayBatDau: '', ngayKetThuc: '' });

  const blacklist = ['.exe', '.bat', '.sh', '.js', '.ps1', '.cmd'];

  useEffect(() => {
    fetchData();
    fetchHocKys();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5186/api/admin/cauhinh');
      if (res.ok) {
        const data = await res.json();
        const newSettings = { ...settings };
        data.forEach(item => {
          if (item.khoaCauHinh.includes('FILE_MAX_SIZE')) {
            newSettings[item.khoaCauHinh] = parseInt(item.giaTriCauHinh);
          } else if (item.khoaCauHinh.includes('FILE_EXT')) {
            newSettings[item.khoaCauHinh] = item.giaTriCauHinh.split(',').filter(x => x);
          }
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHocKys = async () => {
    try {
      const res = await fetch('http://localhost:5186/api/hocky');
      if (res.ok) {
        setHocKys(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHocKy = async () => {
    if (!newHocKy.tenHocKy) return alert('Vui lòng nhập tên học kỳ');
    try {
      const res = await fetch('http://localhost:5186/api/hocky', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...newHocKy, laHienTai: false })
      });
      if (res.ok) {
        fetchHocKys();
        setNewHocKy({ tenHocKy: '', ngayBatDau: '', ngayKetThuc: '' });
      } else {
        const error = await res.json();
        alert(error.thongBao || 'Lỗi thêm học kỳ');
      }
    } catch (err) {
      console.error('Lỗi thêm học kỳ:', err);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleSetCurrentHocKy = async (id) => {
    try {
      const res = await fetch(`http://localhost:5186/api/hocky/${id}/set-current`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchHocKys();
      } else {
        alert('Lỗi phân quyền hoặc server');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditHocKy = (hk) => {
    setEditingHocKy(hk.maHocKy);
    setEditFormData({
      tenHocKy: hk.tenHocKy,
      ngayBatDau: hk.ngayBatDau || '',
      ngayKetThuc: hk.ngayKetThuc || ''
    });
  };

  const handleUpdateHocKy = async (id) => {
    if (!editFormData.tenHocKy) return alert('Vui lòng nhập tên học kỳ');
    try {
      const res = await fetch(`http://localhost:5186/api/hocky/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        fetchHocKys();
        setEditingHocKy(null);
      } else {
        const error = await res.json();
        alert(error.thongBao || 'Lỗi cập nhật học kỳ');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      // Handle both 'yyyy-mm-dd' and ISO 'yyyy-mm-ddT...' formats
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleSliderChange = (key, val) => {
    setSettings({ ...settings, [key]: parseInt(val) });
    setIsDirty(true);
  };

  const removeTag = (key, tagToRemove) => {
    setSettings({
      ...settings,
      [key]: settings[key].filter(tag => tag !== tagToRemove)
    });
    setIsDirty(true);
  };

  const addTag = (key, newTag) => {
    let normalized = newTag.trim().toLowerCase();
    if (normalized.length === 0) return;
    if (!normalized.startsWith('.')) {
      normalized = '.' + normalized;
    }

    if (blacklist.includes(normalized)) {
      alert(`Đuôi file ${normalized} không được phép (Nguy cơ bảo mật)!`);
      return;
    }

    if (!settings[key].includes(normalized)) {
      setSettings({
        ...settings,
        [key]: [...settings[key], normalized]
      });
      setIsDirty(true);
    }
  };

  const handleInputKeyDown = (e, extKey, inputKey) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(extKey, inputs[inputKey]);
      setInputs({ ...inputs, [inputKey]: '' });
    }
  };

  const handleQuickTagAdd = (key, tagsString) => {
    const tags = tagsString.split(',').map(t => t.trim());
    let added = false;
    const newExts = [...settings[key]];

    tags.forEach(tag => {
      if (!newExts.includes(tag) && !blacklist.includes(tag)) {
        newExts.push(tag);
        added = true;
      }
    });

    if (added) {
      setSettings({ ...settings, [key]: newExts });
      setIsDirty(true);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        Settings: {
          FILE_MAX_SIZE_DETAI: settings.FILE_MAX_SIZE_DETAI.toString(),
          FILE_EXT_DETAI: settings.FILE_EXT_DETAI.join(','),
          FILE_MAX_SIZE_TASK: settings.FILE_MAX_SIZE_TASK.toString(),
          FILE_EXT_TASK: settings.FILE_EXT_TASK.join(','),
          FILE_MAX_SIZE_MSG: settings.FILE_MAX_SIZE_MSG.toString(),
          FILE_EXT_MSG: settings.FILE_EXT_MSG.join(',')
        }
      };

      const res = await fetch('http://localhost:5186/api/admin/cauhinh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsDirty(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert('Có lỗi xảy ra khi lưu cấu hình.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const renderConfigSection = (title, icon, sizeKey, extKey, inputKey, desc) => (
    <div className="card-body" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
        {icon} {title}
      </h4>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>{desc}</p>

      <div className="setting-row">
        <div className="setting-info">
          <h5>Dung lượng tệp tối đa</h5>
        </div>
        <div className="setting-control">
          <div className="slider-container">
            <input
              type="range" min="1" max="100"
              value={settings[sizeKey]}
              onChange={(e) => handleSliderChange(sizeKey, e.target.value)}
              className="range-slider"
            />
            <div className="slider-value">{settings[sizeKey]} MB</div>
          </div>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <h5>Định dạng tệp cho phép</h5>
        </div>
        <div className="setting-control">
          <div className="tag-input-container">
            {settings[extKey].map((tag, idx) => (
              <div key={idx} className="tag">
                {tag}
                <span className="tag-close" onClick={() => removeTag(extKey, tag)}><FaTimes size={12} /></span>
              </div>
            ))}
            <input
              type="text" className="tag-input" placeholder="VD: .rar, .xls..."
              value={inputs[inputKey]}
              onChange={(e) => setInputs({ ...inputs, [inputKey]: e.target.value })}
              onKeyDown={(e) => handleInputKeyDown(e, extKey, inputKey)}
              onBlur={() => { if (inputs[inputKey]) { addTag(extKey, inputs[inputKey]); setInputs({ ...inputs, [inputKey]: '' }); } }}
            />
          </div>
          <div className="quick-tags">
            <button className="quick-tag-btn" onClick={() => handleQuickTagAdd(extKey, '.doc,.docx,.pdf')}>+ Văn bản</button>
            <button className="quick-tag-btn" onClick={() => handleQuickTagAdd(extKey, '.zip,.rar,.7z')}>+ Nén</button>
            <button className="quick-tag-btn" onClick={() => handleQuickTagAdd(extKey, '.png,.jpg,.jpeg')}>+ Hình ảnh</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Đang tải cấu hình hệ thống...</div>;
  }

  return (
    <div className="system-settings-page">
      <div className="page-header-settings">
        <div className="header-content">
          <h2>Cấu hình hệ thống</h2>
          <p>Thiết lập các tham số kỹ thuật, quản lý tài nguyên và file đính kèm.</p>
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
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-icon"><FaHdd /></div>
            <h3>Cấu hình Lưu trữ & Upload (Giới hạn Dung lượng & Định dạng)</h3>
          </div>

          {renderConfigSection('Tài liệu Đề tài', <FaBook />, 'FILE_MAX_SIZE_DETAI', 'FILE_EXT_DETAI', 'detai', 'Áp dụng cho các tài liệu hướng dẫn đề tài do Giảng viên tải lên.')}
          {renderConfigSection('Bài nộp Nhiệm vụ (Task)', <FaTasks />, 'FILE_MAX_SIZE_TASK', 'FILE_EXT_TASK', 'task', 'Áp dụng cho các bài nộp, báo cáo tiến độ do Sinh viên tải lên trong Task.')}
          {renderConfigSection('File đính kèm Tin nhắn', <FaComments />, 'FILE_MAX_SIZE_MSG', 'FILE_EXT_MSG', 'msg', 'Áp dụng cho hình ảnh, file nhỏ gửi qua kênh thảo luận chung.')}
        </div>

        {/* THÊM PHẦN QUẢN LÝ HỌC KỲ */}
        <div className="settings-card" style={{ gridColumn: '1 / -1', marginTop: '30px' }}>
          <div className="card-header" style={{ background: '#f8fafc', color: '#1e293b' }}>
            <div className="card-icon" style={{ background: '#e2e8f0', color: '#3b82f6' }}><FaCalendarAlt /></div>
            <h3>Quản lý Năm học - Học kỳ</h3>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
              <input type="text" placeholder="Tên học kỳ (VD: HK1 2025-2026)" value={newHocKy.tenHocKy} onChange={e => setNewHocKy({ ...newHocKy, tenHocKy: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }} />
              <input type="date" title="Ngày bắt đầu" value={newHocKy.ngayBatDau} onChange={e => setNewHocKy({ ...newHocKy, ngayBatDau: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="date" title="Ngày kết thúc" value={newHocKy.ngayKetThuc} onChange={e => setNewHocKy({ ...newHocKy, ngayKetThuc: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <button onClick={handleAddHocKy} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>+ Thêm Học Kỳ</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '27%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tên học kỳ</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Thời gian (dd/mm/yyyy)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Trạng thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {hocKys.map((hk, idx) => (
                  <tr key={hk.maHocKy} style={{ background: hk.laHienTai ? '#ecfdf5' : (idx % 2 === 0 ? '#fff' : '#fafafa'), borderBottom: '1px solid #e2e8f0' }}>
                    {editingHocKy === hk.maHocKy ? (
                      <React.Fragment>
                        <td style={{ padding: '8px 14px' }}>
                          <input type="text" value={editFormData.tenHocKy} onChange={e => setEditFormData({...editFormData, tenHocKy: e.target.value})} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontSize: '13px' }} />
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" value={editFormData.ngayBatDau} onChange={e => setEditFormData({...editFormData, ngayBatDau: e.target.value})} style={{ padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, fontSize: '12px' }} />
                            <span style={{ color: '#94a3b8' }}>–</span>
                            <input type="date" value={editFormData.ngayKetThuc} onChange={e => setEditFormData({...editFormData, ngayKetThuc: e.target.value})} style={{ padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, fontSize: '12px' }} />
                          </div>
                        </td>
                        <td style={{ padding: '8px 14px', color: '#94a3b8', fontSize: '13px' }}>–</td>
                        <td style={{ padding: '8px 14px' }}>
                          <button onClick={() => handleUpdateHocKy(hk.maHocKy)} style={{ background: '#10b981', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontSize: '13px', fontWeight: '500' }}>Lưu</button>
                          <button onClick={() => setEditingHocKy(null)} style={{ background: '#e2e8f0', color: '#475569', padding: '5px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                        </td>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <td style={{ padding: '10px 14px', fontWeight: hk.laHienTai ? '700' : '500', color: '#1e293b', fontSize: '14px' }}>
                          {hk.tenHocKy}
                          {hk.laHienTai && <FaStar color="#f59e0b" style={{ marginLeft: '6px', verticalAlign: 'middle', fontSize: '12px' }} />}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569', fontSize: '13px', fontFamily: 'monospace' }}>
                          {formatDate(hk.ngayBatDau)} – {formatDate(hk.ngayKetThuc)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {hk.laHienTai
                            ? <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>Hiện tại</span>
                            : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>Đã đóng</span>}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => startEditHocKy(hk)} style={{ background: '#fef3c7', color: '#92400e', padding: '5px 12px', border: '1px solid #fcd34d', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontSize: '13px', fontWeight: '500' }}>Sửa</button>
                          {!hk.laHienTai && (
                            <button onClick={() => handleSetCurrentHocKy(hk.maHocKy)} style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Đặt hiện tại</button>
                          )}
                        </td>
                      </React.Fragment>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
