import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaTimes } from 'react-icons/fa';
import './StudentTasks.css';
import nhiemVuService from '../../services/nhiemVuService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

// ============================================================
// MODAL CHI TIẾT TASK (read-only)
// ============================================================
function TaskDetailModal({ task, onClose }) {
  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal-content" onClick={e => e.stopPropagation()}>
        <div className="st-modal-header">
          <h3>Chi tiết nhiệm vụ</h3>
          <button className="st-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="st-modal-body">
          <div className="st-task-info-box">
            <div className="st-info-title">{task.name}</div>
            <div className="st-info-sub">{task.group} &nbsp;·&nbsp; {task.class}</div>
            <span className="st-detail-badge" style={{ background: task.badgeBg, color: task.badgeColor }}>{task.statusLabel}</span>
          </div>
          <div className="st-detail-grid">
            <div className="st-detail-item"><span className="st-detail-label">📅 Ngày được giao</span><span>{task.startDate || '—'}</span></div>
            <div className="st-detail-item"><span className="st-detail-label">⏰ Hạn nộp</span><span>{task.deadline}</span></div>
            <div className="st-detail-item"><span className="st-detail-label">🎯 Mức độ ưu tiên</span><span>{task.priority || '—'}</span></div>
          </div>
          <div className="st-form-group" style={{ marginTop: '16px' }}>
            <label>👥 Thành viên thực hiện</label>
            <div className="st-assignee-list" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{a.ky}</div>
                    {a.name || 'Thành viên'}
                  </div>
                ))
              ) : <span style={{ fontSize: '13px', color: '#64748b' }}>Chưa giao cho ai.</span>}
            </div>
          </div>
          {task.moTa && (
            <div className="st-form-group">
              <label>📝 Mô tả chi tiết từ nhóm trưởng</label>
              <div className="st-detail-desc">{task.moTa}</div>
            </div>
          )}
          {task.redoNote && <div className="redo-note">{task.redoNote}</div>}
          {task.nhacNho && <div className="st-remind-box">🔔 {task.nhacNho}</div>}
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL NỘP TASK
// Flow: Sinh viên ghi chú + đính kèm file → nộp
//   -> Backend: INSERT TepDinhKem, LichSuNhiemVu
//   -> Backend: UPDATE NhiemVu SET TrangThai = 'Chờ duyệt'
// ============================================================
function SubmitTaskModal({ task, onClose, onRefresh }) {
  const [ghiChu, setGhiChu] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => setFiles(prev => [...prev, ...Array.from(newFiles)]);
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mock upload logic - thực tế cần API upload file riêng
      await nhiemVuService.submitTask(task.id, {
        phanTramHoanThanh: 100,
        ghiChu: ghiChu
      });
      if (files.length > 0) {
        await nhiemVuService.uploadTaskFiles(task.id, files);
      }
      alert(`✅ Nộp task "${task.name}" thành công!`);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Lỗi khi nộp task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal-content" onClick={e => e.stopPropagation()}>
        <div className="st-modal-header">
          <h3>Nộp task<span className="st-task-badge" style={{ background: task.badgeBg, color: task.badgeColor }}>{task.statusLabel}</span></h3>
          <button className="st-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="st-modal-body">
            <div className="st-task-info-box">
              <div className="st-info-title">{task.name}</div>
              <div className="st-info-sub">{task.group} &nbsp;·&nbsp; {task.class}</div>
              <div className="st-info-row">
                <span>📅 Hạn nộp: {task.deadline}</span>
                {task.priority && <span>{task.priority}</span>}
              </div>
            </div>
            <div className="st-submit-note">
              ℹ️ Sau khi nộp, task sẽ chuyển sang trạng thái <strong>"Chờ duyệt"</strong> và chờ nhóm trưởng xem xét.
            </div>
            <div className="st-form-group">
              <label>Ghi chú <span className="st-label-hint">(Tùy chọn)</span></label>
              <textarea className="st-textarea" rows="3" placeholder="Mô tả kết quả, vấn đề gặp phải..." value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
            </div>
            <div className="st-form-group">
              <label>Tệp đính kèm <span className="st-label-hint">(Tối đa 20MB mỗi tệp)</span></label>
              <div className={`st-upload-zone ${dragover ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}>
                <div className="st-upload-icon">Tệp</div>
                <div className="st-upload-text">Kéo thả file vào đây hoặc <strong>click để chọn file</strong><br/>Cho phép: .pdf, .docx, .zip, .jpg, .png</div>
                <input type="file" ref={fileInputRef} multiple accept=".pdf,.docx,.zip,.jpg,.png" onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
              </div>
              {files.length > 0 && (
                <div className="st-file-list">
                  {files.map((f, i) => (
                    <div className="st-file-item" key={i}>
                      <span className="st-file-name">📄 {f.name}</span>
                      <span className="st-file-size">{formatSize(f.size)}</span>
                      <button type="button" className="st-file-remove" onClick={() => removeFile(i)}><FaTimes /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="st-modal-footer">
            <button type="button" className="st-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="st-btn-submit" disabled={loading}>
              {loading ? 'Đang nộp...' : 'Nộp task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// TASK CARD — dùng chung cho cả 2 tab (không có thanh %)
// ============================================================
function TaskCard({ task, showAssigneeName, onOpenSubmit, onOpenDetail }) {
  return (
    <div className={`tc ${task.status}`}>
      <div className="tc-top" onClick={() => onOpenDetail(task)} style={{ cursor: 'pointer' }}>
        <div>
          <div className="tc-name">{task.name}</div>
          <div className="tc-group">{task.group} &nbsp;·&nbsp; {task.class}</div>
        </div>
        <span className="badge" style={{ background: task.badgeBg, color: task.badgeColor }}>{task.statusLabel}</span>
      </div>
      {task.redoNote && <div className="redo-note">{task.redoNote} &nbsp;·&nbsp; <strong>{task.redoDeadline}</strong></div>}
      {task.nhacNho && <div className="st-remind-box-inline">🔔 {task.nhacNho}</div>}
      <div className="tc-mid">
        <span className="tc-info">📅 {task.status === 'done' ? `Hoàn thành: ${task.deadline}` : task.status === 'redo' ? `Deadline mới: ${task.deadline}` : `Hết hạn: ${task.deadline}`}</span>
        {task.lateText && <span className="tc-info" style={{ color: '#e24b4a' }}>{task.lateText}</span>}
        {task.doneText && <span className="tc-info" style={{ color: '#639922' }}>{task.doneText}</span>}
        {task.priority && <span className="tc-info">{task.priority}</span>}
      </div>
      <div className="tc-bot">
        <div className="assignees">
          {task.assignees.map((a, i) => (
            <React.Fragment key={i}>
              <div className="avs" style={{ background: a.bg, color: a.color }}>{a.ky}</div>
              {showAssigneeName && a.name && <span className="assignee-name">{a.name}</span>}
            </React.Fragment>
          ))}
        </div>
        {task.canSubmit && onOpenSubmit && (
          <button className="act-btn" style={{ background: '#152259', color: '#fff' }} onClick={() => onOpenSubmit(task)}>Nộp task</button>
        )}
        {task.waitText && <span style={{ fontSize: '11px', color: '#ef9f27', fontWeight: '600' }}>{task.waitText}</span>}
        {task.doneTime && <span style={{ fontSize: '11px', color: '#639922', fontWeight: '600' }}>{task.doneTime}</span>}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentTasks = () => {
  const [activeTab, setActiveTab] = useState('mine');
  const [groups, setGroups] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMyGroup, setFilterMyGroup] = useState('all');
  const [modalTask, setModalTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);

  const currentUser = authService.getCurrentUser();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myGroups, tasks] = await Promise.all([
        apiClient.get('/api/nhom/cua-toi'),
        nhiemVuService.getTasksForMyGroups()
      ]);

      setGroups(myGroups);
      setAllTasks(tasks.map(mapApiTaskToCard));
    } catch (err) {
      console.error("Lỗi fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const mapApiTaskToCard = (t) => {
    const status = mapStatus(t.trangThai);
    const assignees = (t.maNguoiDungs || []).map(u => ({
      maNguoiDung: u.maNguoiDung,
      name: u.hoTen,
      ky: u.hoTen ? u.hoTen.split(' ').pop().substring(0, 2).toUpperCase() : '?',
      bg: '#e6f1fb',
      color: '#185fa5'
    }));

    return {
      id: t.maNhiemVu,
      maNhom: t.maNhom,
      name: t.tenNhiemVu,
      group: t.tenNhom || 'Nhóm học tập',
      class: t.tenLop || 'Lớp môn học',
      status,
      statusLabel: normalizeStatusLabel(t.trangThai),
      ...getStatusStyles(status),
      deadline: formatDate(t.hanHoanThanh),
      startDate: formatDate(t.ngayBatDau),
      lateText: status === 'late' ? 'Đã trễ hạn' : null,
      priority: t.mucDoUuTien ? `${getPriorityEmoji(t.mucDoUuTien)} ${t.mucDoUuTien}` : null,
      moTa: t.moTa,
      maNguoiDungs: assignees.map(u => u.maNguoiDung),
      assignees,
      canSubmit: ['doing', 'redo', 'late'].includes(status),
      raw: t,
      waitText: status === 'wait' ? 'Đang chờ nhóm trưởng duyệt...' : null,
      doneText: status === 'done' ? 'Đã hoàn thành' : null
    };
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapStatus = (backendStatus) => {
    switch (backendStatus) {
      case 'Chưa bắt đầu': return 'notstart';
      case 'Đang thực hiện': return 'doing';
      case 'Chờ duyệt': return 'wait';
      case 'Làm lại': return 'redo';
      case 'Hoàn thành': return 'done';
      case 'Trễ hạn': return 'late';
      default: return 'doing';
    }
  };

  const normalizeStatusLabel = (backendStatus) => {
    if (backendStatus === 'Làm lại') return 'Làm lại task';
    if (backendStatus === 'Hoàn thành') return 'Đã hoàn thành';
    return backendStatus || 'Đang thực hiện';
  };

  const getStatusStyles = (status) => {
    const map = {
      late: { badgeBg: '#fcebeb', badgeColor: '#a32d2d' },
      wait: { badgeBg: '#faeeda', badgeColor: '#854f0b' },
      redo: { badgeBg: '#fbeaf0', badgeColor: '#993556' },
      notstart: { badgeBg: '#f0f2f8', badgeColor: '#667085' },
      doing: { badgeBg: '#e6f1fb', badgeColor: '#185fa5' },
      done: { badgeBg: '#eaf3de', badgeColor: '#3b6d11' },
    };
    return map[status] || map.doing;
  };

  const getPriorityEmoji = (p) => {
    if (p.includes('Cao')) return '🔥';
    if (p.includes('Trung bình')) return '📋';
    return '📌';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const myTasksList = useMemo(() => {
    if (!currentUser) return [];
    return allTasks.filter(t => t.maNguoiDungs?.includes(currentUser.maNguoiDung));
  }, [allTasks, currentUser]);

  const filteredMyTasks = myTasksList.filter(t => {
    if (filterMyGroup !== 'all' && t.maNhom !== Number(filterMyGroup)) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all') {
      const p = t.priority || '';
      if (filterPriority === 'high' && !p.includes('Cao')) return false;
      if (filterPriority === 'medium' && !p.includes('Trung bình')) return false;
      if (filterPriority === 'low' && !p.includes('Thấp')) return false;
    }
    return true;
  });

  const filteredGroupTasks = allTasks.filter(t => {
    if (selectedGroup !== 'all' && t.maNhom !== Number(selectedGroup)) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="st-container">Đang tải nhiệm vụ...</div>;

  return (
    <div className="st-container">
      <div className="top"><h1>Nhiệm vụ & tiến độ</h1></div>
      <div className="tab-bar">
        <button className={`tab ${activeTab === 'mine' ? 'active' : ''}`} onClick={() => setActiveTab('mine')}>Của tôi</button>
        <button className={`tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>Của nhóm</button>
      </div>
      <div className="filters">
        {activeTab === 'mine' && (
          <select className="fsel" value={filterMyGroup} onChange={e => setFilterMyGroup(e.target.value)}>
            <option value="all">Tất cả nhóm</option>
            {groups.map(g => <option key={g.maNhom} value={g.maNhom}>{g.tenNhom} — {g.tenLop}</option>)}
          </select>
        )}
        {activeTab === 'group' && (
          <select className="fsel" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="all">Tất cả nhóm</option>
            {groups.map(g => <option key={g.maNhom} value={g.maNhom}>{g.tenNhom} — {g.tenLop}</option>)}
          </select>
        )}
        <select className="fsel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="notstart">Chưa bắt đầu</option>
          <option value="doing">Đang thực hiện</option>
          <option value="wait">Chờ duyệt</option>
          <option value="late">Trễ hạn</option>
          <option value="redo">Làm lại task</option>
          <option value="done">Đã hoàn thành</option>
        </select>
        {activeTab === 'mine' && (
          <select className="fsel" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">Ưu tiên</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
        )}
      </div>

      {activeTab === 'mine' && (
        <div className="task-list">
          {filteredMyTasks.length === 0
            ? <div className="empty-state"><span>📋</span>Không có nhiệm vụ nào phù hợp bộ lọc.</div>
            : filteredMyTasks.map(t => <TaskCard key={t.id} task={t} showAssigneeName={false} onOpenSubmit={setModalTask} onOpenDetail={setDetailTask} />)}
        </div>
      )}

      {activeTab === 'group' && (
        <div className="task-list">
          {filteredGroupTasks.length === 0
            ? <div className="empty-state"><span>👥</span>Không có nhiệm vụ nào trong nhóm được chọn.</div>
            : filteredGroupTasks.map(t => <TaskCard key={t.id} task={t} showAssigneeName={true} onOpenSubmit={null} onOpenDetail={setDetailTask} />)}
        </div>
      )}

      {modalTask && <SubmitTaskModal task={modalTask} onClose={() => setModalTask(null)} onRefresh={fetchData} />}
      {detailTask && <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />}
    </div>
  );
};

export default StudentTasks;
