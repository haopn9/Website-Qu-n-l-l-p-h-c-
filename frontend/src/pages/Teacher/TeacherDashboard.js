import React, { useState, useEffect } from 'react';
import '../Student/StudentDashboard.css';
import thongKeService from '../../services/thongKeService';

// ============================================================
// DỮ LIỆU MẪU DỰ PHÒNG (Sẽ được thay thế bởi API)
// ============================================================
const today = 'Chủ Nhật, 04/05/2026';
const semester = 'Học kỳ 2 – 2025-2026';

const initialStats = [
  { label: 'Lớp đang dạy',        value: 0,  sub: 'đang tải...',             color: '#e6f1fb', icon: '📚' },
  { label: 'Tổng nhóm quản lý',   value: 0,  sub: 'đang tải...',    color: '#eaf3de', icon: '👥' },
  { label: 'Nhiệm vụ trễ hạn',    value: 0,  sub: 'đang tải...', color: '#fcebeb', icon: '⚠️' },
  { label: 'Yêu cầu chuyển nhóm', value: 0,  sub: 'đang tải...',         color: '#faeeda', icon: '🔄' },
];

// Thông tin tổng quan từng lớp
const mockClasses = [
  {
    id: 1,
    tenLop: 'Lập trình Web',
    maLop: 'LT_WEB_01',
    soSV: 32, soNhom: 4, soNhomDayDu: 3, soNhomChuaTruong: 1,
    tienDo: 62, barColor: '#378add',
    groups: [
      { ten: 'Nhóm 1', soDuong: 4, toiDa: 5, truongNhom: 'Trần Thị B',   tienDo: 75, deTai: 'Website quản lý lớp học' },
      { ten: 'Nhóm 2', soDuong: 3, toiDa: 5, truongNhom: 'Hoàng Thị Hoa', tienDo: 55, deTai: 'App đặt lịch khám bệnh' },
      { ten: 'Nhóm 3', soDuong: 2, toiDa: 5, truongNhom: null,            tienDo: 30, deTai: '(Chưa đăng ký đề tài)' },
      { ten: 'Nhóm 4', soDuong: 4, toiDa: 5, truongNhom: 'Đỗ Quang Khải', tienDo: 80, deTai: 'Hệ thống quản lý kho' },
    ],
  },
  {
    id: 2,
    tenLop: 'Cơ sở dữ liệu',
    maLop: 'CSDL_02',
    soSV: 28, soNhom: 4, soNhomDayDu: 4, soNhomChuaTruong: 0,
    tienDo: 80, barColor: '#1d9e75',
    groups: [
      { ten: 'Nhóm 1', soDuong: 4, toiDa: 4, truongNhom: 'Lê Minh Tuấn',  tienDo: 90, deTai: 'Quản lý thư viện' },
      { ten: 'Nhóm 2', soDuong: 4, toiDa: 4, truongNhom: 'Nguyễn Thu Hà', tienDo: 70, deTai: 'Hệ thống bán hàng' },
      { ten: 'Nhóm 3', soDuong: 3, toiDa: 4, truongNhom: 'Phạm Anh Tú',   tienDo: 85, deTai: 'Quản lý nhân sự' },
      { ten: 'Nhóm 4', soDuong: 3, toiDa: 4, truongNhom: 'Trịnh Thảo',    tienDo: 75, deTai: 'App tuyển dụng' },
    ],
  },
  {
    id: 3,
    tenLop: 'Mạng máy tính',
    maLop: 'MMT_03',
    soSV: 35, soNhom: 4, soNhomDayDu: 2, soNhomChuaTruong: 2,
    tienDo: 40, barColor: '#ef9f27',
    groups: [
      { ten: 'Nhóm 1', soDuong: 4, toiDa: 5, truongNhom: 'Võ Minh Khoa',  tienDo: 50, deTai: 'Thiết kế mạng LAN doanh nghiệp' },
      { ten: 'Nhóm 2', soDuong: 3, toiDa: 5, truongNhom: null,            tienDo: 35, deTai: '(Chưa đăng ký đề tài)' },
      { ten: 'Nhóm 3', soDuong: 4, toiDa: 5, truongNhom: 'Dương Bảo Châu', tienDo: 45, deTai: 'Phân tích giao thức TCP/IP' },
      { ten: 'Nhóm 4', soDuong: 3, toiDa: 5, truongNhom: null,            tienDo: 20, deTai: '(Chưa đăng ký đề tài)' },
    ],
  },
];

// Yêu cầu chuyển nhóm đang chờ
const mockTransferRequests = [
  { sv: 'Phùng Thanh Tùng', maSV: 'SV014', tuNhom: 'Nhóm 1 · LT Web', sangNhom: 'Nhóm 2 · LT Web', lyDo: 'Muốn làm chung với bạn thân', thoiGian: '2g trước' },
  { sv: 'Trương Bảo Ngọc',  maSV: 'SV015', tuNhom: 'Nhóm 3 · LT Web', sangNhom: 'Nhóm 4 · LT Web', lyDo: 'Không phù hợp với đề tài hiện tại', thoiGian: '5g trước' },
];

// Hoạt động gần đây (Mock data dự phòng)
const initialActivity = [];
const initialClasses = [];
const initialTransferRequests = [];

// ============================================================
// HELPER COMPONENTS
// ============================================================
const DOT_COLORS = { late: '#e24b4a', warn: '#ef9f27', doing: '#378add', done: '#639922' };

function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div style={{ background: '#f0f2f8', borderRadius: 6, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6 }} />
    </div>
  );
}

function Badge({ label, style }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', ...style }}>
      {label}
    </span>
  );
}

function AccordionRow({ header, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '0.5px solid #f0f2f8' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {header}
        <span style={{ fontSize: 12, color: '#aaa', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .25s', display: 'inline-block', flexShrink: 0 }}>▼</span>
      </button>
      {open && <div style={{ paddingBottom: 12, animation: 'fadeIn .2s ease' }}>{children}</div>}
    </div>
  );
}

// ============================================================
// CARD 1: Thống kê nhanh từng lớp (accordion)
// ============================================================
function ClassOverviewCard({ classes }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">Tổng quan các lớp đang dạy</span>
        <a href="/teacher/manage-classes" className="sd-see-all">Quản lý →</a>
      </div>
      {classes.map(cls => (
        <AccordionRow
          key={cls.id}
          defaultOpen={cls.id === 1}
          header={
            <div style={{ flex: 1, marginRight: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#152259' }}>{cls.tenLop}</span>
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{cls.maLop}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {cls.soNhomChuaTruong > 0 && (
                    <Badge label={`${cls.soNhomChuaTruong} nhóm chưa có trưởng`} style={{ background: '#fcebeb', color: '#a32d2d' }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#152259' }}>{cls.tienDo}%</span>
                </div>
              </div>
              <ProgressBar pct={cls.tienDo} color={cls.barColor} height={6} />
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#aaa' }}>
                <span>👤 {cls.soSV} sinh viên</span>
                <span>👥 {cls.soNhom} nhóm</span>
                <span>✅ {cls.soNhomDayDu}/{cls.soNhom} nhóm đủ thành viên</span>
              </div>
            </div>
          }
        >
          {/* Danh sách nhóm trong lớp */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Danh sách nhóm</div>
            {cls.groups.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < cls.groups.length - 1 ? '0.5px solid #f0f2f8' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#152259' }}>{g.ten}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{g.soDuong}/{g.toiDa} SV</span>
                      {!g.truongNhom
                        ? <Badge label="Chưa có trưởng" style={{ background: '#fcebeb', color: '#dc2626' }} />
                        : <Badge label={g.truongNhom} style={{ background: '#faeeda', color: '#854f0b' }} />
                      }
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#152259' }}>{g.tienDo}%</span>
                  </div>
                  <ProgressBar pct={g.tienDo} color={g.tienDo < 40 ? '#e24b4a' : g.tienDo < 70 ? '#ef9f27' : '#1d9e75'} height={4} />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, fontStyle: 'italic' }}>{g.deTai}</div>
                </div>
              </div>
            ))}
          </div>
        </AccordionRow>
      ))}
    </div>
  );
}

// ============================================================
// CARD 2: Yêu cầu chuyển nhóm đang chờ duyệt
// ============================================================
function TransferRequestsCard({ requests }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">🔄 Yêu cầu chuyển nhóm</span>
        <a href="/teacher/manage-groups" className="sd-see-all">Xử lý →</a>
      </div>
      {requests.length === 0 ? (
        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Không có yêu cầu chờ duyệt</div>
      ) : requests.map((r, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: i < requests.length - 1 ? '0.5px solid #f0f2f8' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#152259' }}>{r.sv}</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{r.maSV}</span>
            </div>
            <span style={{ fontSize: 11, color: '#bbb' }}>{r.thoiGian}</span>
          </div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
            <span style={{ background: '#f0f2f8', padding: '2px 7px', borderRadius: 8, color: '#666' }}>{r.tuNhom}</span>
            <span style={{ margin: '0 6px', color: '#aaa' }}>→</span>
            <span style={{ background: '#e6f1fb', padding: '2px 7px', borderRadius: 8, color: '#185fa5' }}>{r.sangNhom}</span>
          </div>
          <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>Lý do: {r.lyDo}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CARD 3: Hoạt động gần đây
// ============================================================
function ActivityCard({ feeds }) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <span className="sd-card-title">🕐 Hoạt động gần đây</span>
      </div>
      {feeds.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < feeds.length - 1 ? '0.5px solid #f0f2f8' : 'none', alignItems: 'flex-start' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.dot, flexShrink: 0, marginTop: 5 }} />
          <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5, flex: 1 }}>{f.text}</span>
          <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{f.time}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TeacherDashboard() {
  const [userInfo] = useState(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : { hoTen: 'Giảng viên' };
  });

  const [data, setData] = useState({
    stats: initialStats,
    classes: initialClasses,
    transferRequests: initialTransferRequests,
    activity: initialActivity
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await thongKeService.getThongKeGiangVien();
        if (result) {
          setData(result);
        }
      } catch (error) {
        console.error("Lỗi khi gọi API thống kê giảng viên:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tenGV = userInfo.hoTen || 'Giảng viên';

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu dashboard...</div>;
  }

  return (
    <div className="sd-wrap">
      {/* HEADER */}
      <div className="sd-top">
        <div>
          <h1>Xin chào, Thầy/Cô {tenGV} 👋</h1>
          <span>{today} &nbsp;·&nbsp; {semester}</span>
        </div>
      </div>

      {/* THỐNG KÊ NHANH */}
      <div className="sd-stats">
        {data.stats.map((s, i) => (
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

      {/* HÀNG 1: Tổng quan lớp (full width) */}
      <div style={{ marginBottom: 16 }}>
        <ClassOverviewCard classes={data.classes} />
      </div>

      {/* HÀNG 2: 2 cột — Yêu cầu chuyển nhóm | Hoạt động gần đây */}
      <div className="sd-two-col">
        <TransferRequestsCard requests={data.transferRequests} />
        <ActivityCard feeds={data.activity} />
      </div>
    </div>
  );
}
