import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './StudentManageGroup.css';
import deTaiService from '../../services/deTaiService';
import authService from '../../services/authService';
import nhiemVuService from '../../services/nhiemVuService';
import apiClient from '../../services/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5186';

const buildFileUrl = (path) => {
  if (!path) return '#';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Hàng thành viên — đóng góp (click mở rộng xem task) */
function MemberRow({ m, isExpanded, onToggle }) {
  return (
    <div className={`member-wrap ${isExpanded ? 'expanded' : ''}`}>
      <div className="member-row" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
        <div style={{ flex: 1 }}>
          <div className="mname">
            {m.hoTen}
            {m.isMe && <span className="badge-me">Tôi</span>}
          </div>
          <div className="msub">{m.tasks} task &nbsp;·&nbsp; {m.msgs} tin nhắn</div>
          <div className="pbar">
            <div className="pfill" style={{ width: `${m.pct}%`, background: m.barColor }} />
          </div>
        </div>
        <span className="member-pct">{m.pct}%</span>
        <span className="member-toggle">{isExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
      </div>
      {isExpanded && (
        <div className="member-expanded-tasks">
          <div className="met-column">
            <div className="met-col-title">✅ Hoàn thành ({m.doneTasks?.length || 0})</div>
            <div className="met-list">
              {m.doneTasks?.map((t, i) => <div key={i} className="met-item done">{t}</div>)}
              {(!m.doneTasks || m.doneTasks.length === 0) && <div className="mtd-empty" style={{ padding: 0 }}>Chưa có.</div>}
            </div>
          </div>
          <div className="met-column">
            <div className="met-col-title">⏳ Đang làm ({m.doingTasks?.length || 0})</div>
            <div className="met-list">
              {m.doingTasks?.map((t, i) => <div key={i} className="met-item doing">{t}</div>)}
              {(!m.doingTasks || m.doingTasks.length === 0) && <div className="mtd-empty" style={{ padding: 0 }}>Trống.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Card cảnh báo — với status badge và action buttons theo trạng thái */
function WarnCard({ w, onOpenDetail, onOpenRedo, onApprove }) {
  const statusMap = {
    late: { label: 'Trễ hạn', bg: '#fcebeb', color: '#a32d2d' },
    wait: { label: 'Chờ duyệt', bg: '#faeeda', color: '#854f0b' },
    redo: { label: 'Làm lại task', bg: '#fbeaf0', color: '#993556' },
    doing: { label: 'Đang thực hiện', bg: '#e6f1fb', color: '#185fa5' },
    notstart: { label: 'Chưa bắt đầu', bg: '#f0f2f8', color: '#888' },
    done: { label: 'Hoàn thành', bg: '#eaf3de', color: '#3b6d11' },
  };
  const st = statusMap[w.status] || statusMap.late;
  return (
    <div className={`warn-card ${w.type}`}>
      <div onClick={() => onOpenDetail({ ...w, status: w.status })} style={{ cursor: 'pointer', flex: 1 }}>
        <div className="warn-top-row">
          <span className={`warn-text ${w.type}`}>{w.title}</span>
          <span className="warn-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <div className={`warn-sub ${w.type}`}>{w.sub}</div>
      </div>
      <div className="warn-actions">
        {w.actions.map((a, i) => (
          <button key={i} className={`act ${a.cls}`} onClick={(e) => {
            e.stopPropagation();
            if (a.cls === 'redo') onOpenRedo(w);
            else if (a.cls === 'approve') onApprove(w);
            else if (a.cls === 'extend') onOpenDetail({ ...w, status: 'extend' });
          }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Card task trong Kanban */
function TaskCard({ task, colCls, onOpenDetail, onOpenRedo, onApprove }) {
  const isLate = task.trangThai === 'Trễ hạn';
  const isRedo = task.trangThai === 'Làm lại';
  const fileCount = task.tepDinhKems?.length || 0;

  return (
    <div className={`tk ${isLate ? 'late' : colCls}`}>
      <div style={{ cursor: 'pointer' }} onClick={() => onOpenDetail({ ...task, status: colCls })}>
        <div className="tk-badges">
          {task.mucDoUuTien === 'Cao' && <span className="tk-badge priority">🔥 Cao</span>}
          {isRedo && <span className="tk-badge redo">Làm lại</span>}
          {isLate && <span className="tk-badge late">Trễ hạn</span>}
        </div>
        <div className="tk-name">{task.name}</div>
        <div className="tk-meta">
          <div className="tk-meta-left">
            <span>📅 {task.hanHoanThanh ? task.hanHoanThanh.substring(5, 10).replace('-', '/') : '—'}</span>
            {fileCount > 0 && <span className="tk-file-count">📎 {fileCount}</span>}
          </div>
          {task.av && (
            <div className="tk-av" style={{ background: task.av.bg, color: task.av.color }}>
              {task.av.ky}
            </div>
          )}
        </div>
      </div>
      {task.actions.length > 0 && (
        <div className="action-row">
          {task.actions.map((a, i) => (
            <button key={i} className={`act ${a.cls}`} onClick={(e) => {
              e.stopPropagation();
              if (a.cls === 'redo') onOpenRedo(task);
              else if (a.cls === 'approve') onApprove(task);
              else if (a.cls === 'extend') onOpenDetail({ ...task, status: 'extend' });
            }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



/** Modal chi tiết nhiệm vụ */
function TaskDetailModal({ task, groupMembers, onClose, onApprove, onRedo, onRefresh }) {
  const isWait = task.trangThai === 'Chờ duyệt';
  const isDone = task.trangThai === 'Hoàn thành';
  const isRedo = task.trangThai === 'Làm lại';
  const isLate = task.trangThai === 'Trễ hạn';
  const canEdit = task.trangThai === 'Chưa bắt đầu' || task.trangThai === 'Đang thực hiện' || isLate;
  const canExtend = isLate || task.status === 'extend';

  const [tenNhiemVu, setTenNhiemVu] = useState(task.tenNhiemVu || task.name || '');
  const [hanHoanThanh, setHanHoanThanh] = useState(task.hanHoanThanh ? task.hanHoanThanh.substring(0, 10) : '');
  const [mucDoUuTien, setMucDoUuTien] = useState(task.mucDoUuTien || 'Trung bình');
  const [moTa, setMoTa] = useState(task.moTa || '');
  const [assignees, setAssignees] = useState((task.maNguoiDungs || []).map(u => typeof u === 'object' ? u.maNguoiDung : u));
  const [ghiChuGiaHan, setGhiChuGiaHan] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const files = task.tepDinhKems || [];
  const assigneeNames = (task.maNguoiDungs || [])
    .map(u => typeof u === 'object' ? u.hoTen : groupMembers.find(m => m.maNguoiDung === u)?.hoTen)
    .filter(Boolean)
    .join(', ') || 'Chưa giao';

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await nhiemVuService.updateTask(task.id, {
        maNhom: task.maNhom,
        tenNhiemVu,
        hanHoanThanh,
        mucDoUuTien,
        moTa,
        maNguoiDungs: assignees,
        ghiChuCapNhat: ghiChuGiaHan || undefined
      });
      if (newFiles.length > 0) {
        await nhiemVuService.uploadTaskFiles(task.id, newFiles);
      }
      alert('✅ Cập nhật thành công!');
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content refined-modal" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <div className="modal-title-box">
            <span className={`status-dot ${task.trangThai === 'Trễ hạn' ? 'late' : ''}`}></span>
            <h3>{isWait || isDone ? 'Kiểm tra kết quả' : 'Thông tin nhiệm vụ'}</h3>
          </div>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="smg-modal-body">
          {/* Cấu trúc Grid cho thông tin cơ bản */}
          <div className="modal-grid">
            <div className="smg-form-group">
              <label>Tên nhiệm vụ</label>
              <input className="smg-input" value={tenNhiemVu} onChange={e => setTenNhiemVu(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="smg-form-group">
              <label>Mức độ ưu tiên</label>
              <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)} disabled={!canEdit}>
                <option value="Cao">🔥 Cao</option>
                <option value="Trung bình">📋 Trung bình</option>
                <option value="Thấp">📌 Thấp</option>
              </select>
            </div>
          </div>

          <div className="modal-grid">
            <div className="smg-form-group">
              <label>Người thực hiện</label>
              {canEdit ? (
                <select className="smg-input" value={assignees[0] || ''} onChange={e => setAssignees(e.target.value ? [parseInt(e.target.value)] : [])}>
                  <option value="">Chưa giao</option>
                  {groupMembers.map(m => <option key={m.maNguoiDung} value={m.maNguoiDung}>{m.hoTen}</option>)}
                </select>
              ) : (
                <div className="task-readonly-box">{assigneeNames}</div>
              )}
            </div>
            <div className="smg-form-group">
              <label>{canExtend ? 'Deadline mới' : 'Deadline'}</label>
              <input type="date" className="smg-input" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} disabled={!canEdit && !canExtend} />
            </div>
          </div>

          {/* Section mô tả & tài liệu hướng dẫn */}
          <div className="modal-section-v2">
            <label className="section-label-v2">Mô tả & Tài liệu hướng dẫn</label>
            <div className="section-content-v2">
              <textarea className="smg-input minimal-textarea" rows="2" value={moTa} onChange={e => setMoTa(e.target.value)} disabled={!canEdit} placeholder="Chưa có mô tả..." />
              {files.length > 0 && (
                <div className="file-list-v2">
                  {files.map((f, i) => (
                    <a key={i} href={buildFileUrl(f.duongDanTep)} target="_blank" rel="noreferrer" className="file-link-v2">
                      📎 {f.tenTep}
                    </a>
                  ))}
                </div>
              )}
              {canEdit && (
                <div className="upload-inline-v2" onClick={() => fileRef.current?.click()}>
                  <input type="file" hidden ref={fileRef} multiple onChange={e => setNewFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                  <span>+ Đính kèm thêm tài liệu</span>
                </div>
              )}
              {newFiles.length > 0 && (
                <div className="new-files-v2">
                  {newFiles.map((f, i) => (
                    <div key={i} className="nf-item-v2">
                      {f.name} <FaTimes onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section kết quả / phản hồi (Chỉ hiện khi có dữ liệu) */}
          {(isWait || isDone || isRedo || isLate) && (
            <div className={`feedback-area-v2 ${isRedo ? 'redo' : isLate ? 'late' : ''}`}>
              <div className="fa-header-v2">
                {isWait && 'Thành viên đã nộp bài'}
                {isDone && 'Kết quả cuối cùng'}
                {isRedo && 'Lý do yêu cầu làm lại'}
                {isLate && 'Phản hồi trễ hạn'}
              </div>
              <div className="fa-body-v2">
                <p>{isRedo || isLate ? task.lyDoLamLai : (task.ghiChuNop || 'Không có ghi chú nộp bài.')}</p>
                {canExtend && (
                  <textarea className="smg-input mt-10" placeholder="Nhập lý do gia hạn..." value={ghiChuGiaHan} onChange={e => setGhiChuGiaHan(e.target.value)} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="smg-modal-footer">
          <button type="button" className="smg-btn-cancel" onClick={onClose}>Đóng</button>
          {canEdit && <button type="button" className="smg-btn-create" disabled={loading} onClick={handleUpdate}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>}
          {canExtend && <button type="button" className="smg-btn-create" style={{ background: '#f59e0b' }} onClick={handleUpdate}>Xác nhận gia hạn</button>}
          {isWait && (
            <div className="footer-actions">
              <button type="button" className="smg-btn-cancel danger-text" onClick={onRedo}>Từ chối & Sửa lại</button>
              <button type="button" className="smg-btn-create success-bg" onClick={onApprove}>Duyệt hoàn tất</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Modal Yêu cầu làm lại task */
function RedoTaskModal({ task, groupMembers, onClose, onRefresh }) {
  const [lyDo, setLyDo] = useState('');
  const [moiHanHoanThanh, setMoiHanHoanThanh] = useState(task.hanHoanThanh ? task.hanHoanThanh.substring(0, 10) : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      alert('Vui lòng nhập lý do làm lại!');
      return;
    }
    if (task.hanHoanThanh && moiHanHoanThanh && new Date(task.hanHoanThanh) >= new Date(moiHanHoanThanh)) {
      alert('Hạn hoàn thành mới phải lớn hơn hạn hoàn thành hiện tại.');
      return;
    }
    setLoading(true);
    try {
      await nhiemVuService.rejectTask(task.id, {
        lyDo: lyDo.trim(),
        moiHanHoanThanh: moiHanHoanThanh || null
      });
      alert(`✅ Đã gửi yêu cầu làm lại task "${task.title || task.name}".`);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>Yêu cầu làm lại task</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">Nhiệm vụ: {task.title || task.name}</p>
        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            <div className="smg-form-group">
              <label>Gia hạn thêm (Hạn hoàn thành mới) <span className="smg-required">*</span></label>
              <input
                type="date"
                className="smg-input"
                value={moiHanHoanThanh}
                onChange={e => setMoiHanHoanThanh(e.target.value)}
                required
              />
            </div>
            <div className="smg-form-group">
              <label>Lý do yêu cầu làm lại <span className="smg-required">*</span></label>
              <textarea
                className="smg-input"
                rows="5"
                placeholder="Vui lòng nhập lý do hoặc các điểm cần chỉnh sửa..."
                value={lyDo}
                onChange={e => setLyDo(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="smg-modal-footer">
            <button type="button" className="smg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="smg-btn-create" style={{ background: '#e24b4a' }} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateTaskModal({ group, onClose, onRefresh }) {
  const [tenNhiemVu, setTenNhiemVu] = useState('');
  const [moTa, setMoTa] = useState('');
  const [hanHoanThanh, setHanHoanThanh] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState('Trung bình');
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenNhiemVu.trim() || !hanHoanThanh) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    setLoading(true);
    try {
      const createdTask = await nhiemVuService.createTask({
        maNhom: group.maNhom,
        tenNhiemVu: tenNhiemVu.trim(),
        moTa: moTa.trim(),
        hanHoanThanh,
        mucDoUuTien,
        maNguoiDungs: assignees,
        maDeTai: group.maDeTaiId
      });
      if (files.length > 0 && createdTask?.maNhiemVu) {
        await nhiemVuService.uploadTaskFiles(createdTask.maNhiemVu, files);
      }
      alert('✅ Tạo nhiệm vụ thành công!');
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content refined-modal" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <div className="modal-title-box">
            <span className="modal-icon-glow">✨</span>
            <h3>Tạo nhiệm vụ mới</h3>
          </div>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            <div className="smg-form-group">
              <label>Tên nhiệm vụ <span className="req">*</span></label>
              <input 
                className="smg-input" 
                placeholder="Ví dụ: Thiết kế giao diện Dashboard..." 
                value={tenNhiemVu} 
                onChange={e => setTenNhiemVu(e.target.value)} 
                required 
              />
            </div>

            <div className="modal-grid">
              <div className="smg-form-group">
                <label>Hạn hoàn thành <span className="req">*</span></label>
                <input 
                  type="date" 
                  className="smg-input" 
                  value={hanHoanThanh} 
                  onChange={e => setHanHoanThanh(e.target.value)} 
                  required 
                />
              </div>
              <div className="smg-form-group">
                <label>Mức độ ưu tiên</label>
                <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)}>
                  <option value="Cao">🔥 Cao</option>
                  <option value="Trung bình">📋 Trung bình</option>
                  <option value="Thấp">📌 Thấp</option>
                </select>
              </div>
            </div>

            <div className="smg-form-group">
              <label>Giao cho thành viên</label>
              <div className="member-selection-grid">
                <div 
                  className={`ms-item ${assignees.length === 0 ? 'active' : ''}`}
                  onClick={() => setAssignees([])}
                >
                  <div className="ms-av muted">--</div>
                  <span>Chưa giao</span>
                </div>
                {group.members.map(m => (
                  <div 
                    key={m.maNguoiDung} 
                    className={`ms-item ${assignees.includes(m.maNguoiDung) ? 'active' : ''}`}
                    onClick={() => setAssignees([m.maNguoiDung])}
                  >
                    <div className="ms-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                    <span className="ms-name">{m.hoTen.split(' ').pop()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="smg-form-group">
              <label>Mô tả công việc</label>
              <textarea 
                className="smg-input" 
                rows="2" 
                placeholder="Nhập mô tả yêu cầu chi tiết..." 
                value={moTa} 
                onChange={e => setMoTa(e.target.value)} 
              />
            </div>

            <div className="smg-form-group">
              <div 
                className={`refined-upload-zone ${dragover ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={e => { e.preventDefault(); setDragover(false); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input type="file" hidden ref={fileRef} multiple onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                <div className="uz-text">
                  <strong>Click để đính kèm tệp</strong> hoặc kéo thả vào đây
                </div>
              </div>
              {files.length > 0 && (
                <div className="file-preview-list">
                  {files.map((f, i) => (
                    <div key={i} className="fp-item">
                      <span>{f.name}</span>
                      <FaTimes className="fp-remove" onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="smg-modal-footer">
            <button type="button" className="smg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="smg-btn-create" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Modal Chi tiết đề tài */
function TopicDetailModal({ topic, groupName, onClose }) {
  if (!topic) return null;

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content topic-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>Chi tiết đề tài</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">{groupName || topic.nhomDangKy || 'Thông tin yêu cầu đề tài'}</p>

        <div className="smg-modal-body">
          <div className="topic-detail-title">
            <span>Đề tài</span>
            <strong>{topic.tenDeTai}</strong>
          </div>

          <div className="topic-detail-grid">
            <div className="topic-detail-item">
              <span>Ngày bắt đầu</span>
              <strong>{topic.ngayBatDau || 'Chưa cập nhật'}</strong>
            </div>
            <div className="topic-detail-item">
              <span>Ngày kết thúc</span>
              <strong>{topic.ngayKetThuc || 'Chưa cập nhật'}</strong>
            </div>
          </div>

          <div className="topic-detail-section">
            <span>Mô tả yêu cầu</span>
            <p>{topic.moTa}</p>
          </div>

          <div className="topic-detail-section">
            <span>Sản phẩm kỳ vọng</span>
            <p>{topic.sanPhamKyVong}</p>
          </div>

          {topic.tepDinhKem && (
            <div className="topic-detail-section">
              <span>Tài liệu đính kèm từ Giảng viên</span>
              <p>
                <a 
                  href={buildFileUrl(topic.tepDinhKem.duongDan)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="topic-file-link" 
                  style={{ color: '#378add', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}
                >
                  📄 {topic.tepDinhKem.tenTep}
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="smg-modal-footer">
          <button type="button" className="smg-btn-create" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}

/** Modal Đăng ký đề tài */
function TopicRegistrationModal({ group, topics, onClose, onRegistered, onViewDetail }) {
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const selectedTopic = topics.find(t => String(t.maDeTai) === selectedTopicId);
  const [submitting, setSubmitting] = useState(false);

  const statusConfig = {
    available: { label: 'Còn trống', cls: 'available' },
    registered: { label: 'Đã có nhóm đăng ký', cls: 'registered' },
    assigned: { label: 'Giảng viên chỉ định', cls: 'assigned' },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return alert('Vui lòng chọn một đề tài.');

    if (selectedTopic.phuongThucGiao === 'Chỉ định trực tiếp') {
      alert('Đề tài này chỉ dành cho Giảng viên chỉ định trực tiếp.');
      return;
    }

    if (selectedTopic.daCoNhom) {
      alert('Đề tài này đã được một nhóm khác đăng ký.');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn đăng ký đề tài: ${selectedTopic.tenDeTai}?`)) return;

    setSubmitting(true);
    try {
      await deTaiService.dangKyDeTai({
        maDeTai: selectedTopic.maDeTai,
        maLop: group.maLop
      });
      alert('Đăng ký đề tài thành công!');
      onRegistered();
      onClose();
    } catch (error) {
      alert('Lỗi đăng ký: ' + (error.response?.data?.thongBao || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content topic-modal" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>Đăng ký đề tài</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">{group.tenNhom} · {group.tenLop}</p>

        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            <div className="topic-radio-list">
              {topics.length === 0 && <div className="mtd-empty">Chưa có đề tài nào trong ngân hàng của lớp.</div>}
              {topics.map(t => {
                const status = t.daCoNhom ? 'registered' : (t.phuongThucGiao === 'Chỉ định trực tiếp' ? 'assigned' : 'available');
                const st = statusConfig[status];
                return (
                  <div
                    key={t.maDeTai}
                    className={`topic-radio-item ${String(t.maDeTai) === selectedTopicId ? 'active' : ''} ${status}`}
                    onClick={() => setSelectedTopicId(String(t.maDeTai))}
                  >
                    <div className="topic-radio-header">
                      <div className="topic-radio-check">
                        <div className="topic-dot"></div>
                      </div>
                      <div className="topic-radio-info">
                        <div className="topic-radio-name">{t.tenDeTai}</div>
                        <div className="topic-radio-status">
                          <span className={`status-tag ${st.cls}`}>{st.label}</span>
                          {t.daCoNhom && <span className="assigned-group"> · {t.tenNhom}</span>}
                        </div>
                      </div>
                    </div>
                    <button type="button" className="topic-view-btn" onClick={(e) => { e.stopPropagation(); onViewDetail(t); }}>Chi tiết</button>
                  </div>
                );
              })}
            </div>

            {selectedTopic && (
              <div className="topic-confirm-box">
                <span>Đề tài đang chọn</span>
                <strong>{selectedTopic.tenDeTai}</strong>
              </div>
            )}
          </div>

          <div className="smg-modal-footer">
            <button type="button" className="smg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="smg-btn-create" disabled={submitting || !selectedTopic || selectedTopic.daCoNhom}>
              {submitting ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentManageGroup = () => {
  const navigate = useNavigate();
  const currentUserId = Number(authService.getCurrentUser()?.maNguoiDung);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realLeaderGroups, setRealLeaderGroups] = useState([]);
  const [selectedMaNhom, setSelectedMaNhom] = useState(null);
  const [classTopics, setClassTopics] = useState([]);

  const fetchMyLeaderGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get('/api/nhom/cua-toi');
      const lGroups = data.filter(g => g.laNhomTruong);

      if (lGroups.length === 0) {
        setRealLeaderGroups([]);
        setLoading(false);
        return;
      }

      const mappedGroups = [];
      for (const g of lGroups) {
        // Lấy danh sách task của nhóm này
        try {
          const tasks = await nhiemVuService.getTasksByGroup(g.maNhom);

          const members = (g.thanhVien || []).map(tv => {
            const memberTasks = tasks.filter(t => (t.maNguoiDungs || []).some(u => u.maNguoiDung === tv.maNguoiDung));
            const doneTasks = memberTasks.filter(t => t.trangThai === 'Hoàn thành');
            const doingTasks = memberTasks.filter(t => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Chưa bắt đầu');
            const pct = memberTasks.length > 0 ? Math.round((doneTasks.length / memberTasks.length) * 100) : 0;

            return {
              maNguoiDung: tv.maNguoiDung,
              maSo: tv.maSo,
              hoTen: tv.hoTen,
              isMe: tv.maNguoiDung === currentUserId,
              tasks: `${doneTasks.length}/${memberTasks.length}`,
              msgs: 0,
              pct: pct,
              barColor: pct === 100 ? '#639922' : '#378add',
              bg: '#f0f2f8', color: '#152259',
              ky: tv.hoTen.split(' ').pop().substring(0, 2).toUpperCase(),
              doneTasks: doneTasks.map(t => t.tenNhiemVu),
              doingTasks: doingTasks.map(t => t.tenNhiemVu)
            };
          });

          const kanban = [
            { label: 'Cần làm', labelColor: '#888', cls: 'notstart', tasks: tasks.filter(t => t.trangThai === 'Chưa bắt đầu').map(mapToKanbanTask) },
            { 
              label: 'Đang làm', 
              labelColor: '#185fa5', 
              cls: 'doing', 
              tasks: tasks.filter(t => ['Đang thực hiện', 'Làm lại', 'Trễ hạn'].includes(t.trangThai)).map(mapToKanbanTask) 
            },
            { label: 'Đợi duyệt', labelColor: '#854f0b', cls: 'wait', tasks: tasks.filter(t => t.trangThai === 'Chờ duyệt').map(mapToKanbanTask) },
            { label: 'Hoàn tất', labelColor: '#3b6d11', cls: 'done', tasks: tasks.filter(t => t.trangThai === 'Hoàn thành').map(mapToKanbanTask) }
          ];

          const warnings = tasks.filter(t => {
            if (t.trangThai === "Chờ duyệt" || t.trangThai === "Trễ hạn") return true;
            if (t.trangThai !== "Hoàn thành" && t.hanHoanThanh) {
              const diff = new Date(t.hanHoanThanh) - new Date();
              if (diff > 0 && diff < 24 * 60 * 60 * 1000) return true;
            }
            return false;
          }).map(t => {
            const isWait = t.trangThai === "Chờ duyệt";
            const isLate = t.trangThai === "Trễ hạn";
            return {
              id: t.maNhiemVu,
              type: isLate ? 'red' : 'amber',
              title: t.tenNhiemVu,
              sub: isWait ? "Đang chờ bạn phê duyệt" : (isLate ? "Đã quá hạn hoàn thành" : "Sắp đến hạn (còn < 24h)"),
              status: isWait ? 'wait' : (isLate ? 'late' : 'doing'),
              actions: isWait
                ? [{ label: 'Duyệt', cls: 'approve' }, { label: 'Làm lại', cls: 'redo' }]
                : (isLate ? [{ label: 'Gia hạn', cls: 'extend' }] : []),
              ...t
            };
          });

          mappedGroups.push({
            maNhom: g.maNhom, tenNhom: g.tenNhom,
            maLop: g.maLop, maLopHoc: g.maLopHoc, tenLop: g.tenLop,
            deTai: g.tenDeTai !== "Chưa có đề tài" ? g.tenDeTai : null,
            maDeTaiId: g.maDeTai || tasks.find(t => t.maDeTai)?.maDeTai,
            members: members,
            warnings: warnings,
            kanban: kanban,
            joinRequests: [],
            systemNotifications: []
          });
        } catch (taskErr) {
          console.error(`Lỗi fetch task cho nhóm ${g.maNhom}:`, taskErr);
          // Vẫn thêm nhóm vào nhưng kanban trống hoặc xử lý lỗi nhẹ nhàng
          mappedGroups.push({
            maNhom: g.maNhom, tenNhom: g.tenNhom,
            maLop: g.maLop, maLopHoc: g.maLopHoc, tenLop: g.tenLop,
            deTai: g.tenDeTai !== "Chưa có đề tài" ? g.tenDeTai : null,
            maDeTaiId: g.maDeTai,
            members: (g.thanhVien || []).map(tv => ({ ...tv, tasks: '0/0', pct: 0 })),
            warnings: [],
            kanban: [],
            joinRequests: [],
            systemNotifications: []
          });
        }
      }

      setRealLeaderGroups(mappedGroups);
      if (mappedGroups.length > 0 && !selectedMaNhom) {
        setSelectedMaNhom(mappedGroups[0].maNhom);
      }
    } catch (err) {
      console.error("Lỗi fetch leader groups:", err);
      setError(err.message || "Không thể tải dữ liệu nhóm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const mapToKanbanTask = (t) => ({
    id: t.maNhiemVu,
    name: t.tenNhiemVu,
    meta: `Hạn: ${formatDate(t.hanHoanThanh)}`,
    av: t.maNguoiDungs?.length > 0 ? { ky: `${t.maNguoiDungs.length}`, bg: '#e6f1fb', color: '#185fa5' } : null,
    actions: t.trangThai === 'Chờ duyệt'
      ? [{ label: 'Duyệt', cls: 'approve' }, { label: 'Làm lại', cls: 'redo' }]
      : (t.trangThai === 'Trễ hạn' ? [{ label: 'Gia hạn', cls: 'extend' }] : []),
    ...t
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchMyLeaderGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGroup = realLeaderGroups.find(g => g.maNhom === selectedMaNhom) || realLeaderGroups[0];

  useEffect(() => {
    if (selectedGroup?.maLop) {
      deTaiService.getDanhSachDeTai(selectedGroup.maLop).then(data => {
        setClassTopics(data);
      }).catch(err => console.error("Lỗi fetch đề tài:", err));
    }
  }, [selectedGroup?.maLop]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [redoTask, setRedoTask] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicDetail, setTopicDetail] = useState(null);

  const selectedGroupTopic = classTopics.find(t => t.maNhom === selectedGroup?.maNhom)?.tenDeTai || selectedGroup?.deTai;
  const selectedGroupTopicDetail = classTopics.find(t => t.maNhom === selectedGroup?.maNhom || t.tenDeTai === selectedGroup?.deTai);

  const handleApprove = async (task) => {
    if (!window.confirm(`Duyệt hoàn thành cho task: ${task.name || task.title}?`)) return;
    try {
      await nhiemVuService.approveTask(task.id, { ghiChu: 'Nhóm trưởng đã duyệt.' });
      alert('Đã duyệt task thành công!');
      fetchMyLeaderGroups();
    } catch (error) {
      alert('Lỗi khi duyệt: ' + error.message);
    }
  };

  if (loading) return <div className="smg-container">Đang tải dữ liệu điều phối...</div>;

  if (error) {
    return (
      <div className="smg-container">
        <div className="smg-blocked">
          <div className="smg-blocked-icon">⚠️</div>
          <div className="smg-blocked-title">Đã xảy ra lỗi</div>
          <div className="smg-blocked-sub">{error}</div>
          <button className="smg-blocked-btn" onClick={fetchMyLeaderGroups}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (realLeaderGroups.length === 0) {
    return (
      <div className="smg-container">
        <div className="smg-blocked">
          <div className="smg-blocked-icon">🔒</div>
          <div className="smg-blocked-title">Chức năng chỉ dành cho sinh viên là nhóm trưởng</div>
          <div className="smg-blocked-sub">
            Bạn hiện không phải nhóm trưởng của bất kỳ nhóm nào.
            Chức năng này giúp bạn quản lý công việc và đề tài của nhóm mình phụ trách.
          </div>
          <button className="smg-blocked-btn" onClick={() => navigate('/student/groups')}>
            ← Quay về Nhóm học tập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smg-container">
      <div className="top">
        <h1>Điều phối nhóm</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!selectedGroupTopic && (
            <button className="open-btn topic-register-btn" onClick={() => setShowTopicModal(true)}>
              Đăng ký đề tài
            </button>
          )}
          <button className="open-btn" onClick={() => setShowCreateModal(true)}>+ Tạo nhiệm vụ mới</button>
        </div>
      </div>

      {realLeaderGroups.length >= 2 && (
        <div className="smg-group-selector">
          <label>Quản lý nhóm:</label>
          <select value={selectedMaNhom} onChange={e => setSelectedMaNhom(parseInt(e.target.value))}>
            {realLeaderGroups.map(g => (
              <option key={g.maNhom} value={g.maNhom}>{g.tenNhom} — {g.tenLop}</option>
            ))}
          </select>
        </div>
      )}

      <div className="smg-layout">
        <div className="smg-left">
          <div className="smg-panel">
            <div className="smg-panel-header">
              <div className="smg-panel-title">Thành viên & Đóng góp</div>
              <div className="smg-panel-badge">{selectedGroup.members.length} SV</div>
            </div>
            <div className="member-list">
              {selectedGroup.members.map(m => (
                <MemberRow
                  key={m.maNguoiDung}
                  m={m}
                  isExpanded={expandedMember === m.maNguoiDung}
                  onToggle={() => setExpandedMember(expandedMember === m.maNguoiDung ? null : m.maNguoiDung)}
                />
              ))}
            </div>
          </div>

          <div className="smg-panel" style={{ marginTop: '20px' }}>
            <div className="smg-panel-header">
              <div className="smg-panel-title">Đề tài đang thực hiện</div>
            </div>
            {selectedGroupTopic ? (
              <div className="topic-active-card">
                <div className="tac-info">
                  <div className="tac-name">{selectedGroupTopic}</div>
                  <button className="tac-view-btn" onClick={() => setTopicDetail(selectedGroupTopicDetail)}>Xem chi tiết</button>
                </div>
                <div className="tac-status">
                  <span className="status-tag registered">Đã đăng ký / được giao</span>
                </div>
              </div>
            ) : (
              <div className="topic-empty-state">
                <div className="tes-icon">📚</div>
                <div className="tes-text">Nhóm chưa đăng ký đề tài môn học.</div>
                <button className="tes-btn" onClick={() => setShowTopicModal(true)}>Đăng ký ngay</button>
              </div>
            )}
          </div>
        </div>

        <div className="smg-right">
          <div className="smg-panel">
            <div className="smg-panel-header">
              <div className="smg-panel-title">Cảnh báo & Duyệt task</div>
              <div className="smg-panel-badge amber">{selectedGroup.warnings.length}</div>
            </div>
            <div className="warn-list">
              {selectedGroup.warnings.map((w, idx) => (
                <WarnCard key={idx} w={w} onOpenDetail={setDetailTask} onOpenRedo={setRedoTask} onApprove={handleApprove} />
              ))}
              {selectedGroup.warnings.length === 0 && (
                <div className="mtd-empty">Hiện tại không có cảnh báo nào.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="kanban-section">
        <div className="smg-panel-title">Tiến độ nhiệm vụ (Kanban)</div>
        <div className="kanban-board">
          {selectedGroup.kanban.map((col, idx) => (
            <div key={idx} className="kanban-col">
              <div className="k-header">
                <span className="k-label" style={{ color: col.labelColor }}>{col.label}</span>
                <span className="k-count">{col.tasks.length}</span>
              </div>
              <div className="k-list">
                {col.tasks.map((t, i) => (
                  <TaskCard
                    key={i}
                    task={t}
                    colCls={col.cls}
                    onOpenDetail={setDetailTask}
                    onOpenRedo={setRedoTask}
                    onApprove={handleApprove}
                  />
                ))}
                {col.tasks.length === 0 && <div className="kanban-empty">Không có task</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTopicModal && (
        <TopicRegistrationModal
          group={selectedGroup}
          topics={classTopics}
          onClose={() => setShowTopicModal(false)}
          onRegistered={fetchMyLeaderGroups}
          onViewDetail={setTopicDetail}
        />
      )}

      {topicDetail && (
        <TopicDetailModal
          topic={topicDetail}
          groupName={selectedGroup.tenNhom}
          onClose={() => setTopicDetail(null)}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal group={selectedGroup} onClose={() => setShowCreateModal(false)} onRefresh={fetchMyLeaderGroups} />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          groupMembers={selectedGroup.members}
          onClose={() => setDetailTask(null)}
          onApprove={() => { handleApprove(detailTask); setDetailTask(null); }}
          onRedo={() => { setRedoTask(detailTask); setDetailTask(null); }}
          onRefresh={fetchMyLeaderGroups}
        />
      )}

      {redoTask && (
        <RedoTaskModal
          task={redoTask}
          groupMembers={selectedGroup.members}
          onClose={() => setRedoTask(null)}
          onRefresh={fetchMyLeaderGroups}
        />
      )}
    </div>
  );
};

export default StudentManageGroup;
