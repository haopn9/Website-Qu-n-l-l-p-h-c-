import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './StudentManageGroup.css';

// ============================================================
// DỮ LIỆU MẪU (thay bằng API call sau)
// currentUser giả lập SV đang đăng nhập
// ============================================================
const currentUser = { maNguoiDung: 1, maSo: 'DH52300086', hoTen: 'Nguyễn Văn A' };

// Danh sách nhóm mà SV hiện tại là NHÓM TRƯỞNG
// Nếu mảng rỗng → SV bình thường, không phải nhóm trưởng
const leaderGroups = [
  {
    maNhom: 1, tenNhom: 'Nhóm 1',
    maLop: 1, maLopHoc: 'LT_WEB_01', tenLop: 'Lập trình Web',
    deTai: null,
    members: [
      { maNguoiDung: 1, maSo: 'DH52300086', hoTen: 'Nguyễn Văn A', isMe: true, tasks: '3/4', msgs: 12, pct: 75, barColor: '#378add', bg: '#e6f1fb', color: '#185fa5', ky: 'VA',
        doneTasks: ['Phân tích yêu cầu', 'Tài liệu đặc tả', 'Thiết kế wireframe'],
        pendingTasks: ['Thiết kế giao diện Login'] },
      { maNguoiDung: 2, maSo: 'DH52300141', hoTen: 'Trần Thị B', isMe: false, tasks: '4/4', msgs: 20, pct: 100, barColor: '#639922', bg: '#faeeda', color: '#854f0b', ky: 'TB',
        doneTasks: ['Phân tích yêu cầu', 'Tài liệu đặc tả', 'API đăng nhập', 'Viết tài liệu HDSD'],
        pendingTasks: [] },
      { maNguoiDung: 3, maSo: 'DH52300204', hoTen: 'Lê Văn C', isMe: false, tasks: '1/3', msgs: 5, pct: 33, barColor: '#e24b4a', bg: '#e1f5ee', color: '#0f6e56', ky: 'LC',
        doneTasks: ['Viết unit test API'],
        pendingTasks: ['ERD & schema DB', 'Tối ưu hiệu năng'] },
      { maNguoiDung: 4, maSo: 'DH52300249', hoTen: 'Phạm Thị D', isMe: false, tasks: '2/3', msgs: 8, pct: 67, barColor: '#ef9f27', bg: '#fbeaf0', color: '#993556', ky: 'PD',
        doneTasks: ['Phân tích yêu cầu', 'Thiết kế database'],
        pendingTasks: ['Viết báo cáo chương 3'] },
    ],
    warnings: [
      { type: 'red', status: 'late', title: 'Thiết kế giao diện Login', sub: 'Đã trễ hạn 1 ngày · Giao cho: Nguyễn Văn A', actions: [{ label: 'Gia hạn', cls: 'extend' }] },
      { type: 'amber', status: 'wait', title: 'API đăng nhập — Chờ duyệt', sub: 'Đang chờ bạn duyệt · 2 ngày chưa xử lý', actions: [{ label: 'Duyệt', cls: 'approve' }, { label: 'Làm lại', cls: 'redo' }] },
      { type: 'amber', status: 'redo', title: 'Viết báo cáo chương 3', sub: 'Đã yêu cầu làm lại · Chưa cập nhật tiến độ 3 ngày', actions: [] },
    ],
    kanban: [
      { label: 'Chưa bắt đầu', labelColor: '#888', cls: 'notstart', tasks: [
        { name: 'Viết unit test API', meta: 'HH: 30/04', av: { ky: 'LC', bg: '#f1efe8', color: '#5f5e5a' }, actions: [] },
      ]},
      { label: 'Đang thực hiện', labelColor: '#185fa5', cls: 'doing', tasks: [
        { name: 'Thiết kế giao diện Login', meta: 'HH: 17/04', av: { ky: 'VA', bg: '#e6f1fb', color: '#185fa5' }, actions: [] },
        { name: 'ERD & schema DB', meta: 'HH: 25/04', av: { ky: 'LC', bg: '#e1f5ee', color: '#0f6e56' }, actions: [] },
      ]},
      { label: 'Chờ duyệt', labelColor: '#854f0b', cls: 'wait', tasks: [
        { name: 'API đăng nhập & phân quyền', meta: 'HH: 20/04', av: null, actions: [{ label: 'Duyệt', cls: 'approve' }, { label: 'Làm lại', cls: 'redo' }] },
      ]},
      { label: 'Làm lại task', labelColor: '#993556', cls: 'redo', tasks: [
        { name: 'Viết báo cáo chương 3', meta: 'HH: 24/04', av: { ky: 'PD', bg: '#fbeaf0', color: '#993556' }, actions: [] },
      ]},
      { label: 'Trễ hạn', labelColor: '#a32d2d', cls: 'late', tasks: [
        { name: 'Thiết kế Login UI', meta: 'Trễ 1 ngày', av: { ky: 'VA', bg: '#fcebeb', color: '#a32d2d' }, actions: [{ label: 'Gia hạn', cls: 'extend' }] },
      ]},
      { label: 'Hoàn thành', labelColor: '#3b6d11', cls: 'done', tasks: [
        { name: 'Tài liệu đặc tả', meta: '10/03/2026', av: { ky: 'TB', bg: '#eaf3de', color: '#3b6d11' }, actions: [] },
        { name: 'Phân tích yêu cầu', meta: '05/03/2026', av: { ky: 'VA', bg: '#eaf3de', color: '#3b6d11' }, actions: [] },
      ]},
    ],
    joinRequests: [
      { id: 101, maSo: 'DH52309999', hoTen: 'Ngô Kiến Thanh', loiNhan: 'Cho mình vào nhóm với nha, mình code được React!', ngayGui: 'Hôm nay', av: { bg: '#e1f5ee', color: '#0f6e56', ky: 'KT' } }
    ],
    systemNotifications: [
      { id: 1, type: 'transfer', message: 'Sinh viên Lý Văn Tèo đã chuyển sang Nhóm 2.', time: '1 giờ trước' },
      { id: 2, type: 'join', message: 'Sinh viên Trần Thị C đã gia nhập nhóm từ Nhóm 4.', time: '2 giờ trước' }
    ]
  },
  {
    maNhom: 5, tenNhom: 'Nhóm 5',
    maLop: 3, maLopHoc: 'MMT_03', tenLop: 'Mạng máy tính',
    deTai: 'Phân tích và thiết kế mạng LAN cho doanh nghiệp vừa và nhỏ',
    members: [
      { maNguoiDung: 1, maSo: 'DH52300086', hoTen: 'Nguyễn Văn A', isMe: true, tasks: '1/2', msgs: 3, pct: 50, barColor: '#378add', bg: '#e6f1fb', color: '#185fa5', ky: 'VA',
        doneTasks: ['Lập tài liệu đề cương'],
        pendingTasks: ['Thiết kế sơ đồ mạng LAN'] },
      { maNguoiDung: 8, maSo: 'DH52300935', hoTen: 'Phạm Trần Trung Kiên', isMe: false, tasks: '1/2', msgs: 5, pct: 50, barColor: '#ef9f27', bg: '#e1f5ee', color: '#0f6e56', ky: 'KN',
        doneTasks: ['Phân tích yêu cầu hệ thống'],
        pendingTasks: ['Cấu hình router'] },
      { maNguoiDung: 9, maSo: 'DH52301884', hoTen: 'Tô Duy Phúc Thịnh', isMe: false, tasks: '0/1', msgs: 1, pct: 0, barColor: '#e24b4a', bg: '#fbeaf0', color: '#993556', ky: 'TH',
        doneTasks: [],
        pendingTasks: ['Khảo sát hạ tầng mạng'] },
    ],
    warnings: [],
    kanban: [
      { label: 'Chưa bắt đầu', labelColor: '#888', cls: 'notstart', tasks: [
        { name: 'Khảo sát hạ tầng mạng', meta: 'HH: 28/04', av: { ky: 'TH', bg: '#fbeaf0', color: '#993556' }, actions: [] },
      ]},
      { label: 'Đang thực hiện', labelColor: '#185fa5', cls: 'doing', tasks: [
        { name: 'Thiết kế sơ đồ mạng LAN', meta: 'HH: 25/04', av: { ky: 'VA', bg: '#e6f1fb', color: '#185fa5' }, actions: [] },
        { name: 'Phân tích yêu cầu hệ thống', meta: 'HH: 26/04', av: { ky: 'KN', bg: '#e1f5ee', color: '#0f6e56' }, actions: [] },
      ]},
      { label: 'Chờ duyệt', labelColor: '#854f0b', cls: 'wait', tasks: [] },
      { label: 'Làm lại task', labelColor: '#993556', cls: 'redo', tasks: [] },
      { label: 'Trễ hạn', labelColor: '#a32d2d', cls: 'late', tasks: [] },
      { label: 'Hoàn thành', labelColor: '#3b6d11', cls: 'done', tasks: [
        { name: 'Lập tài liệu đề cương', meta: '08/03/2026', av: { ky: 'VA', bg: '#eaf3de', color: '#3b6d11' }, actions: [] },
      ]},
    ],
    joinRequests: [],
    systemNotifications: [],
  },
];

const topicBankByClass = {
  1: {
    assignmentMode: 'free',
    modeLabel: 'Đăng ký tự do',
    topics: [
      {
        maDeTai: 1,
        tenDeTai: 'Website quản lý lớp học',
        moTa: 'Xây dựng hệ thống quản lý lớp, nhóm, đề tài và tiến độ làm việc.',
        sanPhamKyVong: 'Web app React + ASP.NET API, có báo cáo và source code.',
        ngayBatDau: '2026-03-03',
        ngayKetThuc: '2026-06-20',
        tepDinhKem: 'YeuCau_Web_QuanLyLopHoc.pdf',
        trangThai: 'available',
        nhomDangKy: null,
      },
      {
        maDeTai: 2,
        tenDeTai: 'Ứng dụng đặt lịch khám bệnh',
        moTa: 'Cho phép người dùng đặt lịch, bác sĩ xác nhận và quản lý lịch khám.',
        sanPhamKyVong: 'Prototype đầy đủ luồng đặt lịch, xác nhận, hủy lịch.',
        ngayBatDau: '2026-03-03',
        ngayKetThuc: '2026-06-20',
        tepDinhKem: 'MoTa_DatLichKham.pdf',
        trangThai: 'registered',
        nhomDangKy: 'Nhóm 2',
      },
      {
        maDeTai: 3,
        tenDeTai: 'Sàn trao đổi tài liệu học tập',
        moTa: 'Sinh viên đăng tải, tìm kiếm, đánh giá và lưu tài liệu học tập.',
        sanPhamKyVong: 'Có phân quyền, upload file, tìm kiếm và thống kê lượt tải.',
        ngayBatDau: '2026-03-10',
        ngayKetThuc: '2026-06-20',
        tepDinhKem: 'TaiLieu_SanTraoDoi.zip',
        trangThai: 'available',
        nhomDangKy: null,
      },
      {
        maDeTai: 4,
        tenDeTai: 'Hệ thống quản lý kho',
        moTa: 'Theo dõi nhập xuất tồn, cảnh báo số lượng thấp và báo cáo kho.',
        sanPhamKyVong: 'Dashboard tồn kho, phiếu nhập/xuất, báo cáo Excel.',
        ngayBatDau: '2026-03-05',
        ngayKetThuc: '2026-06-15',
        tepDinhKem: 'QuanLyKho_Requirement.docx',
        trangThai: 'assigned',
        nhomDangKy: 'Nhóm 4',
      },
    ],
  },
  3: {
    assignmentMode: 'direct',
    modeLabel: 'Chỉ định trực tiếp',
    topics: [
      {
        maDeTai: 11,
        tenDeTai: 'Phân tích và thiết kế mạng LAN cho doanh nghiệp vừa và nhỏ',
        moTa: 'Khảo sát yêu cầu, thiết kế sơ đồ mạng và đề xuất thiết bị.',
        sanPhamKyVong: 'Sơ đồ mạng, bảng thiết bị, báo cáo phân tích chi phí.',
        ngayBatDau: '2026-03-07',
        ngayKetThuc: '2026-06-27',
        tepDinhKem: 'MMT_LAN_DoanhNghiep.pdf',
        trangThai: 'assigned',
        nhomDangKy: 'Nhóm 5',
      },
      {
        maDeTai: 12,
        tenDeTai: 'Giám sát mạng nội bộ',
        moTa: 'Theo dõi trạng thái thiết bị, cảnh báo lỗi và ghi nhận lịch sử sự cố.',
        sanPhamKyVong: 'Mô phỏng dashboard giám sát và báo cáo cảnh báo.',
        ngayBatDau: '2026-03-07',
        ngayKetThuc: '2026-06-27',
        tepDinhKem: 'GiamSatMang.docx',
        trangThai: 'assigned',
        nhomDangKy: null,
      },
      {
        maDeTai: 13,
        tenDeTai: 'Phân tích giao thức TCP/IP',
        moTa: 'Mô phỏng, phân tích gói tin và đánh giá hoạt động TCP/IP.',
        sanPhamKyVong: 'Báo cáo phân tích, demo mô phỏng bằng công cụ mạng.',
        ngayBatDau: '2026-03-07',
        ngayKetThuc: '2026-06-27',
        tepDinhKem: 'TCPIP_Analysis.pdf',
        trangThai: 'assigned',
        nhomDangKy: 'Nhóm 3',
      },
    ],
  },
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
        <div className="member-tasks-detail">
          {m.doneTasks && m.doneTasks.length > 0 && (
            <div className="mtd-section">
              <div className="mtd-label done">✅ Đã hoàn thành ({m.doneTasks.length})</div>
              {m.doneTasks.map((t, i) => <div key={i} className="mtd-item done">{t}</div>)}
            </div>
          )}
          {m.pendingTasks && m.pendingTasks.length > 0 && (
            <div className="mtd-section">
              <div className="mtd-label pending">⏳ Chưa hoàn thành ({m.pendingTasks.length})</div>
              {m.pendingTasks.map((t, i) => <div key={i} className="mtd-item pending">{t}</div>)}
            </div>
          )}
          {(!m.doneTasks || m.doneTasks.length === 0) && (!m.pendingTasks || m.pendingTasks.length === 0) && (
            <div className="mtd-empty">Chưa có task nào được giao.</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Card cảnh báo — với status badge và action buttons theo trạng thái */
function WarnCard({ w, onOpenDetail, onOpenRedo }) {
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
      <div onClick={() => onOpenDetail({...w, status: w.status})} style={{ cursor: 'pointer', flex: 1 }}>
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
            else if (a.cls === 'approve') alert(`Đã duyệt task: ${w.title}`);
            else if (a.cls === 'extend') onOpenDetail({...w, status: 'extend'});
          }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Card task trong Kanban */
function TaskCard({ task, colCls, onOpenDetail, onOpenRedo }) {
  return (
    <div className={`tk ${colCls}`}>
      <div style={{ cursor: 'pointer' }} onClick={() => onOpenDetail({...task, status: colCls})}>
        <div className="tk-name">{task.name}</div>
        <div className="tk-meta">{task.meta}</div>
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
              else if (a.cls === 'approve') alert(`Đã duyệt task: ${task.name}`);
              else if (a.cls === 'extend') onOpenDetail({...task, status: 'extend'});
            }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Card Yêu cầu gia nhập */
function JoinRequestCard({ req, onApprove, onReject }) {
  return (
    <div className="warn-card amber">
      <div style={{ flex: 1 }}>
        <div className="warn-top-row">
          <span className="warn-text amber" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: req.av.bg, color: req.av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold' }}>{req.av.ky}</div>
            {req.hoTen} ({req.maSo})
          </span>
          <span className="warn-status-badge" style={{ background: '#faeeda', color: '#854f0b' }}>Chờ duyệt</span>
        </div>
        <div className="warn-sub amber">"{req.loiNhan}" · {req.ngayGui}</div>
      </div>
      <div className="warn-actions">
        <button className="act approve" onClick={(e) => { e.stopPropagation(); onApprove(req); }}>Đồng ý</button>
        <button className="act redo" onClick={(e) => { e.stopPropagation(); onReject(req); }}>Từ chối</button>
      </div>
    </div>
  );
}

// ============================================================
// MODAL CHI TIẾT TASK & DUYỆT / YÊU CẦU LÀM LẠI
// ============================================================
function TaskDetailModal({ task, groupMembers, onClose, onApprove, onRedo }) {
  const isNotStart = task.status === 'notstart';
  const isExtend = task.status === 'extend';
  const isWait = task.status === 'wait';
  const isReadonly = !isNotStart && !isExtend;

  const [tenNhiemVu, setTenNhiemVu] = useState(task.title || task.name || '');
  const [ngayBatDau, setNgayBatDau] = useState('2026-04-10');
  const [hanHoanThanh, setHanHoanThanh] = useState('2026-04-20');
  const [mucDoUuTien, setMucDoUuTien] = useState('Cao');
  const [moTa, setMoTa] = useState('Hoàn thiện chức năng API, xử lý các edge cases.');
  const [assignees, setAssignees] = useState(task.av ? [groupMembers.find(m => m.ky === task.av.ky)?.maNguoiDung || 1] : []);

  const files = [{ name: 'BaoCao.docx', size: '2 MB' }];
  const ghiChuThanhVien = 'Đã hoàn thành xong phần core, gặp chút vấn đề về performance.';

  const toggleAssignee = (maNguoiDung) => {
    if (isReadonly) return;
    setAssignees(prev => prev.includes(maNguoiDung) ? prev.filter(id => id !== maNguoiDung) : [...prev, maNguoiDung]);
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>Chi tiết nhiệm vụ {isExtend && '- Gia hạn'}</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="smg-modal-body">
          <div className="smg-form-group">
            <label>Tên nhiệm vụ</label>
            <input className="smg-input" value={tenNhiemVu} onChange={e => setTenNhiemVu(e.target.value)} disabled={isReadonly || isExtend} />
          </div>
          
          <div className="smg-date-row">
            <div className="smg-form-group">
              <label>Ngày bắt đầu</label>
              <input type="date" className="smg-input" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} disabled={isReadonly || isExtend} />
            </div>
            <div className="smg-form-group">
              <label>Hạn hoàn thành</label>
              <input type="date" className="smg-input" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} disabled={isReadonly} />
            </div>
          </div>

          <div className="smg-form-group">
            <label>Mức độ ưu tiên</label>
            <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)} disabled={isReadonly}>
              <option value="Cao">🔥 Cao</option>
              <option value="Trung bình">📋 Trung bình</option>
              <option value="Thấp">📌 Thấp</option>
            </select>
          </div>

          <div className="smg-form-group">
            <label>Mô tả chi tiết của nhóm trưởng</label>
            <textarea className="smg-input" rows="3" value={moTa} onChange={e => setMoTa(e.target.value)} disabled={isReadonly} />
          </div>

          <div className="smg-form-group">
            <label>Thành viên thực hiện</label>
            <div className="smg-assignee-list" style={{ opacity: isReadonly ? 0.7 : 1 }}>
              {groupMembers.map(m => (
                <label key={m.maNguoiDung} className="smg-assignee-item" style={{ cursor: isReadonly ? 'default' : 'pointer' }}>
                  <input type="checkbox" checked={assignees.includes(m.maNguoiDung)} onChange={() => toggleAssignee(m.maNguoiDung)} disabled={isReadonly} />
                  <div className="smg-assignee-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                  <span className="smg-assignee-name">{m.hoTen}</span>
                </label>
              ))}
            </div>
          </div>

          {isWait && (
            <div className="smg-form-group">
              <label>💬 Ghi chú của thành viên</label>
              <div className="st-detail-desc" style={{ borderLeftColor: '#854f0b', background: '#faeeda' }}>{ghiChuThanhVien}</div>
            </div>
          )}

          {files.length > 0 && (
            <div className="smg-form-group">
              <label>📎 Tệp đính kèm (Click để xem)</label>
              <div className="smg-file-list">
                {files.map((f, i) => (
                  <div className="smg-file-item" key={i} style={{ cursor: 'pointer' }} onClick={() => alert(`Mở file: ${f.name}`)}>
                    <span className="smg-file-name">📄 {f.name}</span>
                    <span className="smg-file-size">{f.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="smg-modal-footer">
          <button type="button" className="smg-btn-cancel" onClick={onClose}>Đóng</button>
          {isNotStart && <button type="button" className="smg-btn-create" onClick={() => { alert('Đã cập nhật nhiệm vụ!'); onClose(); }}>Xác nhận</button>}
          {isExtend && <button type="button" className="smg-btn-create" style={{ background: '#ef9f27', color: '#fff' }} onClick={() => { alert('Đã gia hạn nhiệm vụ!'); onClose(); }}>Gia hạn</button>}
          {isWait && (
            <>
              <button type="button" className="smg-btn-cancel" style={{ color: '#854f0b', borderColor: '#ef9f27' }} onClick={onRedo}>Yêu cầu làm lại</button>
              <button type="button" className="smg-btn-create" style={{ background: '#639922' }} onClick={onApprove}>Duyệt Task</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL YÊU CẦU LÀM LẠI TASK
// ============================================================
function RedoTaskModal({ task, groupMembers, onClose }) {
  const [lyDo, setLyDo] = useState('');
  const [giaHan, setGiaHan] = useState('2026-04-24');
  const [mucDoUuTien, setMucDoUuTien] = useState('Cao');
  const [assignees, setAssignees] = useState(task.av ? [groupMembers.find(m => m.ky === task.av.ky)?.maNguoiDung || 1] : []);

  const toggleAssignee = (maNguoiDung) => {
    setAssignees(prev => prev.includes(maNguoiDung) ? prev.filter(id => id !== maNguoiDung) : [...prev, maNguoiDung]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      alert('Vui lòng nhập lý do làm lại!');
      return;
    }
    alert(`Đã gửi yêu cầu làm lại task "${task.title || task.name}".\nLý do: ${lyDo}\nGia hạn: ${giaHan || 'Không'}`);
    onClose();
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
            <div className="smg-date-row">
              <div className="smg-form-group">
                <label>Ngày bắt đầu</label>
                <input type="date" className="smg-input" value="2026-04-10" disabled />
              </div>
              <div className="smg-form-group">
                <label>Gia hạn thêm</label>
                <input type="date" className="smg-input" value={giaHan} onChange={e => setGiaHan(e.target.value)} required />
              </div>
            </div>
            <div className="smg-form-group">
              <label>Mức độ ưu tiên</label>
              <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)}>
                <option value="Cao">🔥 Cao</option>
                <option value="Trung bình">📋 Trung bình</option>
                <option value="Thấp">📌 Thấp</option>
              </select>
            </div>
            <div className="smg-form-group">
              <label>Chọn thành viên</label>
              <div className="smg-assignee-list">
                {groupMembers.map(m => (
                  <label key={m.maNguoiDung} className="smg-assignee-item">
                    <input type="checkbox" checked={assignees.includes(m.maNguoiDung)} onChange={() => toggleAssignee(m.maNguoiDung)} />
                    <div className="smg-assignee-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                    <span className="smg-assignee-name">{m.hoTen}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="smg-form-group">
              <label>Lý do yêu cầu làm lại <span className="smg-required">*</span></label>
              <textarea className="smg-input" rows="3" placeholder="Nhập lý do tại sao cần làm lại..." value={lyDo} onChange={e => setLyDo(e.target.value)} required />
            </div>
          </div>
          <div className="smg-modal-footer">
            <button type="button" className="smg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="smg-btn-create" style={{ background: '#e24b4a' }}>Gửi yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL TẠO NHIỆM VỤ MỚI
// Mapping DB:
//   - NhiemVu: TenNhiemVu, MoTa, NgayBatDau, HanHoanThanh, MucDoUuTien
//   - PhanCongNhiemVu: MaNhiemVu + MaNguoiDung (multi)
//   - TepDinhKem: MaNhiemVu, TenTep, DuongDanTep, DungLuong, MaNguoiUpload
//   - LichSuNhiemVu: MaNhiemVu, MaNguoiCapNhat, TrangThaiMoi, GhiChu
// ============================================================
function CreateTaskModal({ group, onClose }) {
  const [tenNhiemVu, setTenNhiemVu] = useState('');
  const [moTa, setMoTa] = useState('');
  const [ngayBatDau, setNgayBatDau] = useState('');
  const [hanHoanThanh, setHanHoanThanh] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState('Trung bình');
  const [assignees, setAssignees] = useState([]);
  const [files, setFiles] = useState([]);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef(null);

  const toggleAssignee = (maNguoiDung) => {
    setAssignees(prev =>
      prev.includes(maNguoiDung)
        ? prev.filter(id => id !== maNguoiDung)
        : [...prev, maNguoiDung]
    );
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tenNhiemVu.trim() || !hanHoanThanh) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (Tên, Hạn hoàn thành).');
      return;
    }
    // Trạng thái tự động:
    // Chưa phân công -> Chưa bắt đầu
    // Đã phân công -> Đang thực hiện
    const isAssigned = assignees.length > 0;
    const assignedNames = isAssigned ? group.members
      .filter(m => assignees.includes(m.maNguoiDung))
      .map(m => m.hoTen)
      .join(', ') : 'Chưa phân công';
    
    alert(
      `✅ Tạo nhiệm vụ thành công!\n\n` +
      `• Trạng thái: ${isAssigned ? 'Đang thực hiện' : 'Chưa bắt đầu'}\n` +
      `• Tên: ${tenNhiemVu}\n` +
      `• Nhóm: ${group.tenNhom} — ${group.tenLop}\n` +
      `• Hạn: ${hanHoanThanh}\n` +
      `• Giao cho: ${assignedNames}\n` +
      `• File đính kèm: ${files.length} tệp`
    );
    onClose();
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="smg-modal-header">
          <h3><span className="smg-modal-icon">✨</span> Tạo nhiệm vụ mới</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">{group.tenNhom} · {group.tenLop}</p>

        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            {/* Tên nhiệm vụ */}
            <div className="smg-form-group">
              <label>Tên nhiệm vụ <span className="smg-required">*</span></label>
              <input
                className="smg-input" placeholder="VD: Thiết kế giao diện trang Dashboard"
                value={tenNhiemVu} onChange={e => setTenNhiemVu(e.target.value)} required
              />
            </div>

            {/* Mô tả */}
            <div className="smg-form-group">
              <label>Mô tả chi tiết <span className="smg-hint">(Tùy chọn)</span></label>
              <textarea
                className="smg-input" rows="3"
                placeholder="Mô tả yêu cầu, tiêu chí hoàn thành..."
                value={moTa} onChange={e => setMoTa(e.target.value)}
              />
            </div>

            {/* Ngày */}
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

            {/* Mức ưu tiên */}
            <div className="smg-form-group">
              <label>Mức độ ưu tiên <span className="smg-required">*</span></label>
              <select className="smg-input" value={mucDoUuTien} onChange={e => setMucDoUuTien(e.target.value)}>
                <option value="Cao">🔥 Cao</option>
                <option value="Trung bình">📋 Trung bình</option>
                <option value="Thấp">📌 Thấp</option>
              </select>
            </div>

            {/* Giao cho thành viên */}
            <div className="smg-form-group">
              <label>Giao cho thành viên <span className="smg-hint">(Không bắt buộc — Nếu trống, task sẽ ở trạng thái "Chưa bắt đầu")</span></label>
              <div className="smg-assignee-list">
                {group.members.map(m => (
                  <label key={m.maNguoiDung} className="smg-assignee-item">
                    <input
                      type="checkbox"
                      checked={assignees.includes(m.maNguoiDung)}
                      onChange={() => toggleAssignee(m.maNguoiDung)}
                    />
                    <div className="smg-assignee-av" style={{ background: m.bg, color: m.color }}>{m.ky}</div>
                    <span className="smg-assignee-name">
                      {m.hoTen}
                      {m.isMe && <span className="smg-assignee-me">Tôi</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* File đính kèm */}
            <div className="smg-form-group">
              <label>Tệp đính kèm <span className="smg-hint">(Tối đa 20 MB mỗi tệp · .pdf, .docx, .zip, .jpg, .png)</span></label>
              <div
                className={`smg-upload-zone ${dragover ? 'dragover' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
              >
                <div className="smg-upload-icon">📎</div>
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

          {/* FOOTER */}
          <div className="smg-modal-footer">
            <button type="button" className="smg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="smg-btn-create">Tạo nhiệm vụ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
            <div className="topic-detail-item">
              <span>Nhóm đăng ký / được giao</span>
              <strong>{topic.nhomDangKy || 'Chưa có nhóm'}</strong>
            </div>
            <div className="topic-detail-item">
              <span>Trạng thái</span>
              <strong>{topic.trangThai === 'available' ? 'Còn slot' : topic.trangThai === 'assigned' ? 'Giảng viên chỉ định' : 'Đã có nhóm đăng ký'}</strong>
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

          <div className="topic-detail-file">
            <span>Tài liệu đính kèm</span>
            <strong>{topic.tepDinhKem || 'Chưa có tài liệu đính kèm'}</strong>
          </div>
        </div>

        <div className="smg-modal-footer">
          <button type="button" className="smg-btn-create" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}

function TopicRegistrationModal({ group, topicBank, onClose, onRegister, onViewDetail }) {
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const topics = topicBank?.topics || [];
  const selectedTopic = topics.find(t => String(t.maDeTai) === selectedTopicId);
  const isFreeMode = topicBank?.assignmentMode === 'free';
  const canRegister = isFreeMode && selectedTopic && selectedTopic.trangThai === 'available';

  const statusConfig = {
    available: { label: 'Còn slot', cls: 'available' },
    registered: { label: 'Đã có nhóm đăng ký', cls: 'registered' },
    assigned: { label: 'Giảng viên chỉ định', cls: 'assigned' },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTopic) {
      alert('Vui lòng chọn một đề tài.');
      return;
    }
    if (!canRegister) {
      alert('Đề tài này hiện không thể đăng ký.');
      return;
    }

    onRegister(selectedTopic);
  };

  return (
    <div className="smg-modal-overlay" onClick={onClose}>
      <div className="smg-modal-content topic-modal" onClick={e => e.stopPropagation()}>
        <div className="smg-modal-header">
          <h3>Đăng ký đề tài</h3>
          <button className="smg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <p className="smg-modal-sub">
          {group.tenNhom} · {group.tenLop} · {topicBank?.modeLabel || 'Chưa mở đăng ký'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="smg-modal-body">
            <div className="topic-flow-note">
              <strong>{isFreeMode ? 'Đăng ký tự do' : 'Chỉ định trực tiếp'}</strong>
              <span>
                {isFreeMode
                  ? 'Nhóm trưởng chọn đề tài còn slot. Hệ thống ghi nhận theo thứ tự nhóm đăng ký sớm.'
                  : 'Giảng viên gán đề tài cho từng nhóm. Nhóm trưởng không cần đăng ký đề tài.'}
              </span>
            </div>

            {!isFreeMode && (
              <div className="topic-disabled-note">
                Lớp này đang ở chế độ chỉ định trực tiếp. Bạn chỉ cần xem yêu cầu đề tài được giảng viên giao.
              </div>
            )}

            <div className="topic-bank-list">
              {topics.map(topic => {
                const status = statusConfig[topic.trangThai] || statusConfig.available;
                const selected = selectedTopicId === String(topic.maDeTai);
                const disabled = !isFreeMode || topic.trangThai !== 'available';

                return (
                  <label
                    key={topic.maDeTai}
                    className={`topic-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={topic.maDeTai}
                      checked={selected}
                      disabled={disabled}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                    />
                    <div className="topic-option-body">
                      <div className="topic-option-head">
                        <strong>{topic.tenDeTai}</strong>
                        <span className={`topic-status ${status.cls}`}>{status.label}</span>
                      </div>
                      <p>{topic.moTa}</p>
                      <div className="topic-output">
                        <span>Sản phẩm kỳ vọng</span>
                        <strong>{topic.sanPhamKyVong}</strong>
                      </div>
                      {topic.nhomDangKy && (
                        <div className="topic-registered-by">Nhóm hiện tại: {topic.nhomDangKy}</div>
                      )}
                      <button
                        type="button"
                        className="topic-detail-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          onViewDetail(topic);
                        }}
                      >
                        Xem chi tiết đề tài
                      </button>
                    </div>
                  </label>
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
            <button type="submit" className="smg-btn-create" disabled={!canRegister}>
              Xác nhận đăng ký
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
  const isLeader = leaderGroups.length > 0;
  const hasMultipleGroups = leaderGroups.length >= 2;

  const [selectedMaNhom, setSelectedMaNhom] = useState(
    isLeader ? leaderGroups[0].maNhom : null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [redoTask, setRedoTask] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [registeredTopics, setRegisteredTopics] = useState({});
  const [registeredTopicDetails, setRegisteredTopicDetails] = useState({});
  const [topicDetail, setTopicDetail] = useState(null);

  // Lấy nhóm hiện đang chọn
  const selectedGroup = leaderGroups.find(g => g.maNhom === selectedMaNhom) || leaderGroups[0];
  const selectedTopicBank = topicBankByClass[selectedGroup?.maLop];
  const selectedGroupTopic = registeredTopics[selectedGroup?.maNhom] || selectedGroup?.deTai;
  const selectedGroupTopicDetail = registeredTopicDetails[selectedGroup?.maNhom]
    || selectedTopicBank?.topics.find(topic => topic.tenDeTai === selectedGroup?.deTai || topic.nhomDangKy === selectedGroup?.tenNhom);

  // ========================
  // TRƯỜNG HỢP: Không phải nhóm trưởng
  // ========================
  if (!isLeader) {
    return (
      <div className="smg-container">
        <div className="smg-blocked">
          <div className="smg-blocked-icon">🔒</div>
          <div className="smg-blocked-title">Chức năng chỉ dành cho sinh viên là nhóm trưởng</div>
          <div className="smg-blocked-sub">
            Bạn hiện không phải nhóm trưởng của bất kỳ nhóm nào.
            Nếu bạn được chỉ định làm nhóm trưởng, trang này sẽ tự động hiển thị.
          </div>
          <button className="smg-blocked-btn" onClick={() => navigate('/student/groups')}>
            ← Quay về Nhóm học tập
          </button>
        </div>
      </div>
    );
  }

  // ========================
  // TRƯỜNG HỢP: Là nhóm trưởng (1 hoặc nhiều nhóm)
  // ========================
  return (
    <div className="smg-container">

      {/* HEADER */}
      <div className="top">
        <h1>Điều phối nhóm</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="open-btn topic-register-btn" onClick={() => setShowTopicModal(true)}>
            Đăng ký đề tài
          </button>
          <button className="open-btn" onClick={() => setShowCreateModal(true)}>+ Tạo nhiệm vụ mới</button>
        </div>
      </div>

      {/* GROUP SELECTOR — chỉ hiện khi ≥ 2 nhóm */}
      {hasMultipleGroups && (
        <div className="smg-group-selector">
          <label>Quản lý nhóm:</label>
          <select
            className="smg-group-select"
            value={selectedMaNhom}
            onChange={e => setSelectedMaNhom(Number(e.target.value))}
          >
            {leaderGroups.map(g => (
              <option key={g.maNhom} value={g.maNhom}>
                {g.tenNhom} — {g.tenLop}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="smg-topic-summary">
        <div>
          <span>Đề tài của nhóm</span>
          <strong>{selectedGroupTopic || 'Chưa đăng ký đề tài'}</strong>
        </div>
        {selectedGroupTopicDetail && (
          <button className="smg-topic-link" onClick={() => setTopicDetail(selectedGroupTopicDetail)}>
            Xem chi tiết đề tài
          </button>
        )}
      </div>

      {/* 2 CARD: ĐÓNG GÓP & CẢNH BÁO */}
      <div className="two-col">
        {/* Card đóng góp thành viên */}
        <div className="card">
          <div className="card-hdr">
            <span className="card-title">Đóng góp thành viên</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>Tuần này</span>
          </div>
          {selectedGroup.members.map((m, i) => (
            <MemberRow
              key={m.maNguoiDung}
              m={m}
              isExpanded={expandedMember === `${selectedGroup.maNhom}-${m.maNguoiDung}`}
              onToggle={() => setExpandedMember(
                expandedMember === `${selectedGroup.maNhom}-${m.maNguoiDung}` ? null : `${selectedGroup.maNhom}-${m.maNguoiDung}`
              )}
            />
          ))}
        </div>

        {/* Card cảnh báo */}
        <div className="card">
          <div className="card-hdr">
            <span className="card-title">Cảnh báo cần xử lý</span>
            {selectedGroup.warnings.length > 0 && (
              <span className="badge" style={{ background: '#fcebeb', color: '#a32d2d' }}>
                {selectedGroup.warnings.length} vấn đề
              </span>
            )}
          </div>
          {selectedGroup.warnings.length > 0
            ? selectedGroup.warnings.map((w, i) => <WarnCard key={i} w={w} onOpenDetail={setDetailTask} onOpenRedo={setRedoTask} />)
            : (
              <div className="smg-empty-warn">
                <span>✅</span>
                Không có cảnh báo nào — Nhóm đang hoạt động tốt!
              </div>
            )
          }

          <div className="card-hdr" style={{ marginTop: 20 }}>
            <span className="card-title">Thông báo hệ thống</span>
          </div>
          {selectedGroup.systemNotifications && selectedGroup.systemNotifications.length > 0
            ? selectedGroup.systemNotifications.map((note, i) => (
              <div key={i} className="warn-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ color: '#185fa5', fontWeight: 'bold', fontSize: '13px' }}>{note.type === 'transfer' ? 'Chuyển nhóm' : 'Gia nhập'}</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '5px' }}>{note.message}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>{note.time}</div>
              </div>
            ))
            : (
              <div className="smg-empty-warn">
                Không có thông báo mới.
              </div>
            )
          }
        </div>
      </div>

      {/* KANBAN */}
      <div className="kanban-title">Bảng Kanban — Toàn bộ nhiệm vụ {selectedGroup.tenNhom}</div>
      <div className="kanban">
        {selectedGroup.kanban.map((col, i) => (
          <div key={i} className="col">
            <div className="col-hdr" style={{ color: col.labelColor }}>{col.label}</div>
            {col.tasks.map((task, j) => (
              <TaskCard key={j} task={task} colCls={col.cls} onOpenDetail={setDetailTask} onOpenRedo={setRedoTask} />
            ))}
          </div>
        ))}
      </div>

      {/* MODAL TẠO NHIỆM VỤ */}
      {showCreateModal && (
        <CreateTaskModal
          group={selectedGroup}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showTopicModal && (
        <TopicRegistrationModal
          group={selectedGroup}
          topicBank={selectedTopicBank}
          onClose={() => setShowTopicModal(false)}
          onViewDetail={(topic) => setTopicDetail(topic)}
          onRegister={(topic) => {
            setRegisteredTopics(prev => ({ ...prev, [selectedGroup.maNhom]: topic.tenDeTai }));
            setRegisteredTopicDetails(prev => ({
              ...prev,
              [selectedGroup.maNhom]: { ...topic, trangThai: 'registered', nhomDangKy: selectedGroup.tenNhom }
            }));
            setShowTopicModal(false);
            alert(`Đăng ký đề tài thành công!\n\nNhóm: ${selectedGroup.tenNhom}\nĐề tài: ${topic.tenDeTai}\nTrạng thái: Chờ giảng viên xác nhận.`);
          }}
        />
      )}

      {topicDetail && (
        <TopicDetailModal
          topic={topicDetail}
          groupName={`${selectedGroup.tenNhom} · ${selectedGroup.tenLop}`}
          onClose={() => setTopicDetail(null)}
        />
      )}

      {/* MODAL CHI TIẾT TASK */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          groupMembers={selectedGroup.members}
          onClose={() => setDetailTask(null)}
          onRedo={() => { const t = detailTask; setDetailTask(null); setRedoTask(t); }}
          onApprove={() => { alert(`Đã duyệt task "${detailTask.title || detailTask.name}"`); setDetailTask(null); }}
        />
      )}

      {/* MODAL YÊU CẦU LÀM LẠI */}
      {redoTask && (
        <RedoTaskModal
          task={redoTask}
          groupMembers={selectedGroup.members}
          onClose={() => setRedoTask(null)}
        />
      )}
    </div>
  );
};

export default StudentManageGroup;
