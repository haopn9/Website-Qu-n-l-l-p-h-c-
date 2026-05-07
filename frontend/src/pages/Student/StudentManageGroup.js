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
  return (
    <div className={`tk ${colCls}`}>
      <div style={{ cursor: 'pointer' }} onClick={() => onOpenDetail({ ...task, status: colCls })}>
        <div className="tk-name">{task.name}</div>
        <div className="tk-meta">{task.meta}</div>
        {task.coLamThay && <div className="tk-chip substitute">Làm thay bạn khác</div>}
      </div>
      {task.av && (
        <div className="tk-av" style={{ background: task.av.bg, color: task.av.color }}>
          {task.av.ky}
        </div>
      )}
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
  const isNotStart = task.status === 'notstart';
  const isDoing = task.status === 'doing';
  const isExtend = task.status === 'extend';
  const isWait = task.status === 'wait';
  const isRedo = task.status === 'redo';
  const isLate = task.status === 'late';
  const isDone = task.status === 'done';
  const isEditable = isNotStart || isDoing;
  const canExtend = isExtend || isLate;
  const isReadonly = !isEditable;

  const [tenNhiemVu, setTenNhiemVu] = useState(task.tenNhiemVu || task.name || '');
  const maNhom = task.maNhom || 0;
  const [ngayBatDau, setNgayBatDau] = useState(task.ngayBatDau ? task.ngayBatDau.substring(0, 10) : '');
  const [hanHoanThanh, setHanHoanThanh] = useState(task.hanHoanThanh ? task.hanHoanThanh.substring(0, 10) : '');
  const [mucDoUuTien, setMucDoUuTien] = useState(task.mucDoUuTien || 'Trung bình');
  const [moTa, setMoTa] = useState(task.moTa || '');
  const [assignees, setAssignees] = useState((task.maNguoiDungs || []).map(u => typeof u === 'object' ? u.maNguoiDung : u));
  const [ghiChuGiaHan, setGhiChuGiaHan] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [dragover, setDragover] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const files = task.tepDinhKems || [];
  const ghiChuThanhVien = task.ghiChuNop || task.ghiChu || 'Không có ghi chú từ thành viên.';
  const lyDoLamLai = task.lyDoLamLai || task.ghiChu || 'Chưa có lý do làm lại.';
  const assigneeNames = (task.maNguoiDungs || [])
    .map(u => typeof u === 'object' ? u.hoTen : groupMembers.find(m => m.maNguoiDung === u)?.hoTen)
    .filter(Boolean)
    .join(', ') || 'Chưa có ai';
  const modalTitle = isWait || isDone ? 'Bài nộp nhiệm vụ' : isRedo ? 'Task làm lại' : isLate ? 'Task trễ hạn' : canExtend ? 'Gia hạn nhiệm vụ' : 'Chi tiết nhiệm vụ';

  const toggleAssignee = (maNguoiDung) => {
    if (isReadonly) return;
    setAssignees(prev => prev.includes(maNguoiDung) ? [] : [maNguoiDung]);
  };

  const handleFiles = (selectedFiles) => {
    setNewFiles(prev => [...prev, ...Array.from(selectedFiles || [])]);
  };

  const removeNewFile = (idx) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Tải xuống';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const validateDates = () => {
    if (ngayBatDau && hanHoanThanh && new Date(ngayBatDau) >= new Date(hanHoanThanh)) {
      alert('Ngày bắt đầu phải nhỏ hơn hạn hoàn thành.');
      return false;
    }
    if ((isLate || isExtend) && task.hanHoanThanh && hanHoanThanh && new Date(task.hanHoanThanh) >= new Date(hanHoanThanh)) {
      alert('Hạn hoàn thành mới phải lớn hơn hạn hoàn thành hiện tại.');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateDates()) return;
    setLoading(true);
    try {
      await nhiemVuService.updateTask(task.id, {
        maNhom: maNhom || task.maNhom,
        tenNhiemVu,
        ngayBatDau: ngayBatDau || null,
        hanHoanThanh,
        mucDoUuTien,
        moTa,
        maNguoiDungs: assignees,
        ghiChuCapNhat: ghiChuGiaHan || undefined
      });
      if (newFiles.length > 0) {
        await nhiemVuService.uploadTaskFiles(task.id, newFiles);
      }
      alert('✅ Cập nhật nhiệm vụ thành công!');
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi khi cập nhật: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>{modalTitle}</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="smg-modal-body">
          <div className={`task-state-note ${task.status}`}>
            {isNotStart && 'Task chưa giao cho thành viên. Nhóm trưởng có thể chỉnh sửa thông tin và chọn 1 người phụ trách.'}
            {isDoing && 'Task đang thực hiện. Nếu cần đổi người làm, chọn thành viên thay thế và cập nhật hạn hoàn thành.'}
            {isWait && 'Thành viên đã nộp task. Nhóm trưởng kiểm tra ghi chú, tệp đính kèm rồi phê duyệt hoặc yêu cầu làm lại.'}
            {isRedo && 'Task đã bị yêu cầu làm lại. Nhóm trưởng chỉ theo dõi lý do và hạn hoàn thành mới.'}
            {isLate && 'Task đã trễ hạn. Nhóm trưởng có thể gia hạn deadline và ghi chú lý do trễ hạn.'}
            {isDone && 'Task đã hoàn thành và chỉ được xem lại thông tin bài nộp.'}
            {isExtend && 'Gia hạn deadline cho task và ghi chú lý do cập nhật.'}
          </div>

          <div className="smg-form-group">
            <label>Tên nhiệm vụ</label>
            <input className="smg-input" value={tenNhiemVu} onChange={e => setTenNhiemVu(e.target.value)} disabled={!isEditable} />
          </div>

          <div className="smg-date-row">
            <div className="smg-form-group">
              <label>Ngày bắt đầu</label>
              <input type="date" className="smg-input" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} disabled={!isEditable} />
            </div>
            <div className="smg-form-group">
              <label>{isRedo || isLate || canExtend ? 'Hạn hoàn thành mới' : 'Hạn hoàn thành'}</label>
              <input type="date" className="smg-input" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} disabled={!isEditable && !canExtend} />
            </div>
          </div>

          <div className="smg-form-group">
            <label>Mức độ ưu tiên</label>
            <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)} disabled={!isEditable}>
              <option value="Cao">🔥 Cao</option>
              <option value="Trung bình">📋 Trung bình</option>
              <option value="Thấp">📌 Thấp</option>
            </select>
          </div>

          <div className="smg-form-group">
            <label>Mô tả chi tiết của nhóm trưởng</label>
            <textarea className="smg-input" rows="3" value={moTa} onChange={e => setMoTa(e.target.value)} disabled={!isEditable} />
          </div>

          {isEditable ? (
            <div className="smg-form-group">
            <label>Thành viên thực hiện</label>
            <div className="smg-assignee-list" style={{ opacity: isReadonly ? 0.7 : 1 }}>
              {!isReadonly && (
                <label className="smg-assignee-item">
                  <input type="radio" name="taskAssignee" checked={assignees.length === 0} onChange={() => setAssignees([])} />
                  <div className="smg-assignee-av muted">--</div>
                  <span className="smg-assignee-name">Chưa giao</span>
                </label>
              )}
              {groupMembers.map(m => (
                <label key={m.maNguoiDung} className="smg-assignee-item" style={{ cursor: isReadonly ? 'default' : 'pointer' }}>
                  <input type="radio" name="taskAssignee" checked={assignees.includes(m.maNguoiDung)} onChange={() => toggleAssignee(m.maNguoiDung)} disabled={isReadonly} />
                  <div className="smg-assignee-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                  <span className="smg-assignee-name">{m.hoTen}</span>
                </label>
              ))}
            </div>
          </div>
          ) : (
            <div className="smg-form-group">
              <label>Thành viên thực hiện</label>
              <div className="task-readonly-box">{assigneeNames}</div>
            </div>
          )}

          {task.coLamThay && (
            <div className="task-state-note substitute">Task này đã được đổi sang thành viên làm thay.</div>
          )}

          {(isWait || isDone) && (
            <div className="smg-form-group">
              <label>Ghi chú của thành viên nộp task</label>
              <div className="task-readonly-box amber">{ghiChuThanhVien}</div>
            </div>
          )}

          {isRedo && (
            <div className="smg-form-group">
              <label>Lý do yêu cầu làm lại</label>
              <div className="task-readonly-box danger">{lyDoLamLai}</div>
            </div>
          )}

          {isLate && (
            <div className="smg-form-group">
              <label>Ghi chú lý do trễ hạn</label>
              <textarea
                className="smg-input"
                rows="3"
                placeholder="VD: Thành viên gặp vấn đề kỹ thuật, cần gia hạn thêm..."
                value={ghiChuGiaHan}
                onChange={e => setGhiChuGiaHan(e.target.value)}
              />
            </div>
          )}

          {isExtend && (
            <div className="smg-form-group">
              <label>Ghi chú gia hạn</label>
              <textarea
                className="smg-input"
                rows="3"
                placeholder="Nhập lý do gia hạn hoặc ghi chú cho lần cập nhật này..."
                value={ghiChuGiaHan}
                onChange={e => setGhiChuGiaHan(e.target.value)}
              />
            </div>
          )}

          <div className="smg-form-group">
            <label>Tệp đính kèm</label>
            <div className="smg-file-list">
              {files.length > 0 ? files.map((f, i) => (
                <a className="smg-file-item link" key={i} href={buildFileUrl(f.duongDanTep)} target="_blank" rel="noreferrer">
                  <span className="smg-file-name">{f.tenTep || f.name || `Tệp ${i + 1}`}</span>
                  <span className="smg-file-size">{formatSize(f.dungLuong)}</span>
                </a>
              )) : (
                <div className="task-readonly-box muted">Chưa có tệp đính kèm.</div>
              )}
            </div>
          </div>

          {isEditable && (
            <div className="smg-form-group">
              <label>Gửi thêm tệp đính kèm</label>
              <div
                className={`smg-upload-zone ${dragover ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
              >
                <div className="smg-upload-icon">Tệp</div>
                <div className="smg-upload-text">Kéo thả file vào đây hoặc <strong>click để chọn file</strong></div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.txt"
                  onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
              {newFiles.length > 0 && (
                <div className="smg-file-list">
                  {newFiles.map((f, i) => (
                    <div className="smg-file-item" key={i}>
                      <span className="smg-file-name">{f.name}</span>
                      <span className="smg-file-size">{formatSize(f.size)}</span>
                      <button type="button" className="smg-file-remove" onClick={() => removeNewFile(i)}><FaTimes /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="smg-modal-footer">
          <button type="button" className="smg-btn-cancel" onClick={onClose}>{isRedo ? 'Xác nhận' : 'Đóng'}</button>
          {isEditable && <button type="button" className="smg-btn-create" disabled={loading} onClick={handleUpdate}>{loading ? 'Đang lưu...' : 'Xác nhận'}</button>}
          {canExtend && <button type="button" className="smg-btn-create" style={{ background: '#ef9f27', color: '#fff' }} disabled={loading} onClick={handleUpdate}>{loading ? 'Đang lưu...' : 'Gia hạn'}</button>}
          {isWait && (
            <>
              <button type="button" className="smg-btn-cancel" style={{ color: '#854f0b', borderColor: '#ef9f27' }} onClick={onRedo}>Yêu cầu làm lại</button>
              <button type="button" className="smg-btn-create" style={{ background: '#639922' }} onClick={onApprove}>Phê duyệt</button>
            </>
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

/** Modal Tạo nhiệm vụ mới */
function CreateTaskModal({ group, onClose, onRefresh }) {
  const [tenNhiemVu, setTenNhiemVu] = useState('');
  const [moTa, setMoTa] = useState('');
  const [ngayBatDau, setNgayBatDau] = useState('');
  const [hanHoanThanh, setHanHoanThanh] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState('Trung bình');
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef(null);

  const toggleAssignee = (maNguoiDung) => {
    setAssignees(prev => prev.includes(maNguoiDung) ? [] : [maNguoiDung]);
  };

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenNhiemVu.trim() || !hanHoanThanh) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (Tên, Hạn hoàn thành).');
      return;
    }
    if (ngayBatDau && hanHoanThanh && new Date(ngayBatDau) >= new Date(hanHoanThanh)) {
      alert('Ngày bắt đầu phải nhỏ hơn hạn hoàn thành.');
      return;
    }

    setLoading(true);
    try {
      const createdTask = await nhiemVuService.createTask({
        maNhom: group.maNhom,
        tenNhiemVu: tenNhiemVu.trim(),
        moTa: moTa.trim(),
        ngayBatDau: ngayBatDau || null,
        hanHoanThanh: hanHoanThanh,
        mucDoUuTien: mucDoUuTien,
        maNguoiDungs: assignees,
        maDeTai: group.maDeTaiId // Cần lấy MaDeTai từ group object
      });
      if (files.length > 0 && createdTask?.maNhiemVu) {
        await nhiemVuService.uploadTaskFiles(createdTask.maNhiemVu, files);
      }
      alert('✅ Tạo nhiệm vụ thành công!');
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi khi tạo nhiệm vụ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3><span className="smg-modal-icon">✨</span> Tạo nhiệm vụ mới</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">{group.tenNhom} · {group.tenLop}</p>

        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            <div className="smg-form-group">
              <label>Tên nhiệm vụ <span className="smg-required">*</span></label>
              <input
                className="smg-input" placeholder="VD: Thiết kế giao diện trang Dashboard"
                value={tenNhiemVu} onChange={e => setTenNhiemVu(e.target.value)} required
              />
            </div>

            <div className="smg-form-group">
              <label>Mô tả chi tiết <span className="smg-hint">(Tùy chọn)</span></label>
              <textarea
                className="smg-input" rows="3"
                placeholder="Mô tả yêu cầu, tiêu chí hoàn thành..."
                value={moTa} onChange={e => setMoTa(e.target.value)}
              />
            </div>

            <div className="smg-date-row">
              <div className="smg-form-group">
                <label>Ngày bắt đầu</label>
                <input type="date" className="smg-input" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} />
              </div>
              <div className="smg-form-group">
                <label>Hạn hoàn thành <span className="smg-required">*</span></label>
                <input type="date" className="smg-input" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} required />
              </div>
            </div>

            <div className="smg-form-group">
              <label>Mức độ ưu tiên <span className="smg-required">*</span></label>
              <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)}>
                <option value="Cao">🔥 Cao</option>
                <option value="Trung bình">📋 Trung bình</option>
                <option value="Thấp">📌 Thấp</option>
              </select>
            </div>

            <div className="smg-form-group">
              <label>Giao cho thành viên <span className="smg-hint">(Nếu trống, task sẽ ở trạng thái "Chưa bắt đầu")</span></label>
              <div className="smg-assignee-list">
                <label className="smg-assignee-item">
                  <input type="radio" name="newTaskAssignee" checked={assignees.length === 0} onChange={() => setAssignees([])} />
                  <div className="smg-assignee-av muted">--</div>
                  <span className="smg-assignee-name">Chưa giao</span>
                </label>
                {group.members.map(m => (
                  <label key={m.maNguoiDung} className="smg-assignee-item">
                    <input type="radio" name="newTaskAssignee" checked={assignees.includes(m.maNguoiDung)} onChange={() => toggleAssignee(m.maNguoiDung)} />
                    <div className="smg-assignee-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                    <span className="smg-assignee-name">
                      {m.hoTen}
                      {m.isMe && <span className="smg-assignee-me">Tôi</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="smg-form-group">
              <label>Tệp đính kèm <span className="smg-hint">(Tối đa 20 MB mỗi tệp)</span></label>
              <div
                className={`smg-upload-zone ${dragover ? 'dragover' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
              >
                <div className="smg-upload-icon">Tệp</div>
                <div className="smg-upload-text">
                  Kéo thả file vào đây hoặc <strong>click để chọn file</strong>
                </div>
                <input
                  type="file" ref={fileRef} multiple
                  accept=".pdf,.docx,.zip,.jpg,.png"
                  onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
              {files.length > 0 && (
                <div className="smg-file-list">
                  {files.map((f, i) => (
                    <div className="smg-file-item" key={i}>
                      <span className="smg-file-name">📄 {f.name}</span>
                      <span className="smg-file-size">{formatSize(f.size)}</span>
                      <button type="button" className="smg-file-remove" onClick={() => removeFile(i)}><FaTimes /></button>
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
            { label: 'Chưa bắt đầu', labelColor: '#888', cls: 'notstart', tasks: tasks.filter(t => t.trangThai === 'Chưa bắt đầu').map(mapToKanbanTask) },
            { label: 'Đang thực hiện', labelColor: '#185fa5', cls: 'doing', tasks: tasks.filter(t => t.trangThai === 'Đang thực hiện').map(mapToKanbanTask) },
            { label: 'Chờ duyệt', labelColor: '#854f0b', cls: 'wait', tasks: tasks.filter(t => t.trangThai === 'Chờ duyệt').map(mapToKanbanTask) },
            { label: 'Làm lại task', labelColor: '#993556', cls: 'redo', tasks: tasks.filter(t => t.trangThai === 'Làm lại').map(mapToKanbanTask) },
            { label: 'Trễ hạn', labelColor: '#a32d2d', cls: 'late', tasks: tasks.filter(t => t.trangThai === 'Trễ hạn').map(mapToKanbanTask) },
            { label: 'Hoàn thành', labelColor: '#3b6d11', cls: 'done', tasks: tasks.filter(t => t.trangThai === 'Hoàn thành').map(mapToKanbanTask) }
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
