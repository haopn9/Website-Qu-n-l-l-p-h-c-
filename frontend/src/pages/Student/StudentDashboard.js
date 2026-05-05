import React, { useState, useEffect } from 'react';
import './StudentDashboard.css'; // Đã import file CSS
import thongKeService from '../../services/thongKeService';

// ============================================================
// DỮ LIỆU MẪU DỰ PHÒNG (Khi API chưa có data hoặc loading)
// ============================================================
const initialData = {
  student: { name: 'Nguyễn Văn A', date: 'Chủ Nhật, 19/04/2026', semester: 'Học kỳ 2 2025-2026' },
  stats: [
    { label: 'Lớp đang học',       value: 3, sub: 'học kỳ này',          color: '#e6f1fb', icon: '📚' },
    { label: 'Nhóm tham gia',      value: 2, sub: 'nhóm đang hoạt động', color: '#eaf3de', icon: '👥' },
    { label: 'Nhiệm vụ đang làm',  value: 5, sub: '3 sắp đến hạn',       color: '#faeeda', icon: '✅' },
    { label: 'Nhiệm vụ trễ hạn',   value: 1, sub: 'cần xử lý ngay',      color: '#fcebeb', icon: '⚠️' },
  ],
  myTasks: [
    { name: 'Thiết kế giao diện Login', group: 'Nhóm 1 · Lập trình Web', pct: 60,  status: 'late',  label: 'Trễ hạn',      barColor: '#e24b4a', badgeStyle: { background: '#fcebeb', color: '#a32d2d' } },
    { name: 'Xây dựng API đăng nhập',  group: 'Nhóm 1 · Lập trình Web', pct: 40,  status: 'doing', label: 'Đang làm',     barColor: '#378add', badgeStyle: { background: '#e6f1fb', color: '#185fa5' } },
    { name: 'Viết báo cáo chương 2',   group: 'Nhóm 2 · Cơ sở dữ liệu', pct: 75,  status: 'warn',  label: 'Sắp hết hạn',  barColor: '#ef9f27', badgeStyle: { background: '#faeeda', color: '#854f0b' } },
    { name: 'Thiết kế ERD database',   group: 'Nhóm 1 · Lập trình Web', pct: 100, status: 'done',  label: 'Hoàn thành',   barColor: '#639922', badgeStyle: { background: '#eaf3de', color: '#3b6d11' } },
  ],
  // Dữ liệu tiến độ nhóm — mỗi nhóm có members để accordion hiện ra
  groupProgress: [
    {
      id: 1,
      name: 'Nhóm 1 — Lập trình Web',
      pct: 62,
      barColor: '#378add',
      members: [
        { initials: 'VA', name: 'Nguyễn Văn A', tasks: '3/4 nhiệm vụ hoàn thành', pct: 75,  bg: '#e6f1fb', color: '#185fa5', isMe: true,  isLeader: false },
        { initials: 'TB', name: 'Trần Thị B',   tasks: '4/4 nhiệm vụ hoàn thành', pct: 100, bg: '#faeeda', color: '#854f0b', isMe: false, isLeader: true  },
        { initials: 'LC', name: 'Lê Văn C',      tasks: '1/3 nhiệm vụ hoàn thành', pct: 33,  bg: '#fbeaf0', color: '#993556', isMe: false, isLeader: false },
        { initials: 'PD', name: 'Phạm Thị D',   tasks: '2/3 nhiệm vụ hoàn thành', pct: 67,  bg: '#f1efe8', color: '#5f5e5a', isMe: false, isLeader: false },
      ],
    },
    {
      id: 2,
      name: 'Nhóm 2 — Cơ sở dữ liệu',
      pct: 80,
      barColor: '#639922',
      members: [
        { initials: 'VA', name: 'Nguyễn Văn A', tasks: '4/5 nhiệm vụ hoàn thành', pct: 80,  bg: '#e6f1fb', color: '#185fa5', isMe: true,  isLeader: false },
        { initials: 'HT', name: 'Hoàng Thị T',  tasks: '5/5 nhiệm vụ hoàn thành', pct: 100, bg: '#e1f5ee', color: '#0f6e56', isMe: false, isLeader: true  },
        { initials: 'NQ', name: 'Nguyễn Quốc Q', tasks: '3/4 nhiệm vụ hoàn thành', pct: 75,  bg: '#faeeda', color: '#854f0b', isMe: false, isLeader: false },
      ],
    },
  ],
  // Dữ liệu thông tin nhóm — accordion theo nhóm
  groupInfo: [
    {
      id: 1,
      className: 'Lập trình Web',
      groupName: 'Nhóm 1',
      topic: 'Website quản lý lớp học — Module làm việc nhóm',
      leader: 'Trần Thị B',
      members: ['Nguyễn Văn A (Tôi)', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D'],
      totalSlots: 5,
    },
    {
      id: 2,
      className: 'Cơ sở dữ liệu',
      groupName: 'Nhóm 2',
      topic: 'Xây dựng hệ thống quản lý thư viện trường đại học',
      leader: 'Hoàng Thị T',
      members: ['Nguyễn Văn A (Tôi)', 'Hoàng Thị T', 'Nguyễn Quốc Q'],
      totalSlots: 5,
    },
  ],
  deadlines: [
    { name: 'Thiết kế giao diện Login', date: 'Hôm nay',    status: 'late', label: 'Trễ rồi', badgeStyle: { background: '#fcebeb', color: '#a32d2d' } },
    { name: 'Viết báo cáo chương 2',    date: '20/04/2026', status: 'warn', label: '2 ngày',  badgeStyle: { background: '#faeeda', color: '#854f0b' } },
    { name: 'API đăng nhập',            date: '25/04/2026', status: 'doing',label: '7 ngày',  badgeStyle: { background: '#e6f1fb', color: '#185fa5' } },
  ],
  // Hoạt động nhóm — accordion theo nhóm
  groupActivity: [
    {
      id: 1,
      name: 'Nhóm 1 — Lập trình Web',
      feeds: [
        { dot: '#c0dd97', text: 'Trần Thị B đã hoàn thành "Thiết kế ERD"',              time: '5p'  },
        { dot: '#b5d4f4', text: 'Lê Văn C nhắn tin trong Nhóm 1',                       time: '1g'  },
        { dot: '#fac775', text: 'Phạm Thị D cập nhật tiến độ báo cáo lên 75%',          time: '2g'  },
        { dot: '#f7c1c1', text: 'Hệ thống cảnh báo: "Thiết kế Login" đã trễ hạn',       time: '3g'  },
        { dot: '#c0dd97', text: 'Bạn đã nộp file ERD_v2.pdf',                            time: '5g'  },
      ],
    },
    {
      id: 2,
      name: 'Nhóm 2 — Cơ sở dữ liệu',
      feeds: [
        { dot: '#c0dd97', text: 'Hoàng Thị T đã duyệt task "Phân tích yêu cầu"',        time: '30p' },
        { dot: '#b5d4f4', text: 'Nguyễn Quốc Q nhắn tin trong Nhóm 2',                  time: '3g'  },
        { dot: '#fac775', text: 'Bạn cập nhật tiến độ "Viết báo cáo" lên 80%',          time: '5g'  },
      ],
    },
  ],
};

// ============================================================
// HELPER: màu chấm trạng thái
// ============================================================
const DOT_COLORS = { late: '#e24b4a', warn: '#ef9f27', doing: '#378add', done: '#639922' };

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Accordion row dùng chung: hiển thị header + toggle mũi tên */
function AccordionRow({ header, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '0.5px solid #f0f2f8' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '10px 0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        {header}
        <span style={{
          fontSize: 12, color: '#aaa',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .25s',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 12, animation: 'fadeIn .2s ease' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Avatar tròn */
function Av({ initials, bg, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color, fontSize: size * 0.34,
      fontWeight: 700, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>{initials}</div>
  );
}

/** Thanh tiến độ */
function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div style={{ background: '#f0f2f8', borderRadius: 6, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6 }} />
    </div>
  );
}

/** Badge nhỏ */
function Badge({ label, style }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, whiteSpace: 'nowrap', ...style,
    }}>{label}</span>
  );
}

// ============================================================
// CARD: Nhiệm vụ của tôi
// ============================================================
function MyTasksCard({ tasks }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Nhiệm vụ của tôi</span>
        <a href="/student/tasks" className="sd-see-all">Xem tất cả →</a>
      </div>
      {tasks.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < tasks.length - 1 ? '0.5px solid #f0f2f8' : 'none' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: DOT_COLORS[t.status], flexShrink: 0, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#152259', marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>{t.group}</div>
            <ProgressBar pct={t.pct} color={t.barColor} />
          </div>
          <Badge label={t.label} style={t.badgeStyle} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CARD: Tiến độ nhóm (với accordion thành viên)
// ============================================================
function GroupProgressCard({ groups }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Tiến độ nhóm của tôi</span>
        <a href="/student/groups" className="sd-see-all">Chi tiết →</a>
      </div>

      {groups.map((g) => (
        <AccordionRow
          key={g.id}
          header={
            <div style={{ flex: 1, marginRight: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 5 }}>
                <span>{g.name}</span>
                <span style={{ color: '#152259', fontWeight: 700 }}>{g.pct}%</span>
              </div>
              <ProgressBar pct={g.pct} color={g.barColor} height={7} />
            </div>
          }
        >
          {/* Accordion nội dung: đóng góp thành viên */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#152259', marginBottom: 8 }}>
              Đóng góp thành viên — {g.name}
            </div>
            {g.members.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < g.members.length - 1 ? '0.5px solid #f0f2f8' : 'none' }}>
                <Av initials={m.initials} bg={m.bg} color={m.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#152259', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.name}
                    {m.isMe    && <Badge label="Tôi"         style={{ background: '#eaf3de', color: '#3b6d11' }} />}
                    {m.isLeader && <Badge label="Nhóm trưởng" style={{ background: '#faeeda', color: '#854f0b' }} />}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{m.tasks}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#152259', minWidth: 36, textAlign: 'right' }}>{m.pct}%</span>
              </div>
            ))}
          </div>
        </AccordionRow>
      ))}
    </div>
  );
}

// ============================================================
// CARD: Thông tin nhóm (accordion theo lớp/nhóm)
// ============================================================
function GroupInfoCard({ groups }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Thông tin nhóm</span>
      </div>

      {groups.map((g) => (
        <AccordionRow
          key={g.id}
          header={
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#152259' }}>{g.className}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{g.groupName}</div>
            </div>
          }
        >
          {/* Accordion nội dung: chi tiết nhóm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            {[
              { label: 'Đề tài',       value: g.topic },
              { label: 'Nhóm trưởng', value: g.leader },
              { label: 'Thành viên',  value: `${g.members.length} / ${g.totalSlots} người` },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #f0f2f8' }}>
                <span style={{ color: '#aaa' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#152259', maxWidth: 140, textAlign: 'right', lineHeight: 1.4 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
              <span style={{ color: '#aaa', fontSize: 11 }}>Danh sách: </span>
              {g.members.join(' · ')}
            </div>
          </div>
        </AccordionRow>
      ))}
    </div>
  );
}

// ============================================================
// CARD: Deadline sắp tới
// ============================================================
function DeadlineCard({ deadlines }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Deadline sắp tới</span>
      </div>
      {deadlines.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < deadlines.length - 1 ? '0.5px solid #f0f2f8' : 'none' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: DOT_COLORS[d.status], flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#152259' }}>{d.name}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{d.date}</div>
          </div>
          <Badge label={d.label} style={d.badgeStyle} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CARD: Hoạt động nhóm (accordion theo nhóm)
// ============================================================
function GroupActivityCard({ groups }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Hoạt động nhóm</span>
      </div>

      {groups.map((g) => (
        <AccordionRow
          key={g.id}
          header={
            <span style={{ fontSize: 13, fontWeight: 700, color: '#152259', textAlign: 'left' }}>
              {g.name}
            </span>
          }
        >
          <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {g.feeds.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < g.feeds.length - 1 ? '0.5px solid #f0f2f8' : 'none', alignItems: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.dot, flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5, flex: 1 }}>{f.text}</span>
                <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{f.time}</span>
              </div>
            ))}
          </div>
        </AccordionRow>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function StudentDashboard() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await thongKeService.getThongKeSinhVien();
        if (result) {
          setData(result);
        }
      } catch (error) {
        console.error("Lỗi khi gọi API thống kê sinh viên:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  const { student, stats, myTasks, groupProgress, groupInfo, deadlines, groupActivity } = data;

  return (
    <div className="sd-wrap">
      {/* HEADER */}
      <div className="sd-top">
        <div>
          <h1>Xin chào, {student?.name || 'Sinh viên'} 👋</h1>
          <span>{student?.date} &nbsp;·&nbsp; {student?.semester}</span>
        </div>
      </div>

      {/* THỐNG KÊ NHANH */}
      <div className="sd-stats">
        {stats.map((s, i) => (
          <div key={i} className="sd-stat">
            <div className="sd-stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="sd-stat-label">{s.label}</div>
              <div className="sd-stat-value">{s.value}</div>
              <div className="sd-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* HÀNG GIỮA: 2 cột */}
      <div className="sd-two-col">
        <MyTasksCard tasks={myTasks} />
        <GroupProgressCard groups={groupProgress} />
      </div>

      {/* HÀNG DƯỚI: 3 cột */}
      <div className="sd-three-col">
        <GroupInfoCard groups={groupInfo} />
        <DeadlineCard deadlines={deadlines} />
        <GroupActivityCard groups={groupActivity} />
      </div>
    </div>
  );
}