import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends } from 'react-icons/fa';
import './StudentClasses.css';
import classService from '../../services/classService';

// ============================================================
// MODAL THAM GIA LỚP
// ============================================================
function JoinModal({ onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã lớp.');
      return;
    }

    setLoading(true);
    try {
      await classService.joinClass(code);
      alert(`Đã tham gia lớp: ${code} thành công!`);
      onJoin(); // Callback to refresh classes
      onClose();
    } catch (err) {
      setError(err.message || 'Mã lớp không tồn tại hoặc đã đầy.');
      console.error('Error joining class:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal-box" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <span>Tham gia lớp học</span>
          <button onClick={onClose} className="sc-modal-close">✕</button>
        </div>
        <p className="sc-modal-desc">Nhập mã lớp (Class Code) do giảng viên cung cấp.</p>
        <input
          className={`sc-modal-input ${error ? 'input-error' : ''}`}
          placeholder="VD: LT_WEB_01"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          disabled={loading}
          autoFocus
        />
        {error && <span className="sc-field-error">{error}</span>}
        <div className="sc-modal-footer">
          <button className="sc-btn-cancel" onClick={onClose} disabled={loading}>Hủy</button>
          <button className="sc-btn-primary" onClick={handleJoin} disabled={loading || !code.trim()}>
            {loading ? 'Đang xử lý...' : 'Tham gia'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CARD LỚP HỌC
// ============================================================
function ClassCard({ cls, onClick }) {
  return (
    <div className="cls-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="cls-banner" style={{ background: cls.mauSac }} />
      <div className="cls-body">
        <div className="cls-name">{cls.tenLop}</div>
        <div className="cls-code">Mã lớp: {cls.maLopHoc}</div>
        <div className="cls-meta">
          <div className="meta-row">
            <div className="meta-icon" style={{ background: cls.gvBg, color: cls.gvColor }}>GV</div>
            {cls.tenGV}
          </div>
          <div className="meta-row">
            <div className="meta-icon" style={{ background: '#faeeda', color: '#854f0b' }}>
              <FaUserFriends />
            </div>
            {cls.soSinhVien} sinh viên &nbsp;·&nbsp; {cls.soNhom} nhóm
          </div>
        </div>
        <div className="cls-footer">
          <div className="progress-wrap">
            <div className="progress-label">Tiến độ môn học</div>
            <div className="pbar">
              <div className="pfill" style={{ width: `${cls.tienDo}%`, background: cls.mauSac }} />
            </div>
          </div>
          <span className="cls-badge" style={{ background: cls.badgeBg, color: cls.badgeColor }}>
            Đang học
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CARD NHÓM
// ============================================================
function GroupCard({ group, onClick }) {
  return (
    <div className="nhom-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="nhom-header">
        <div>
          <div className="nhom-name">{group.tenNhom} — {group.tenLop}</div>
          <div className="nhom-class">GV: {group.tenGV}</div>
        </div>
        <span
          className="cls-badge"
          style={group.laNhomTruong
            ? { background: '#faeeda', color: '#854f0b' }
            : { background: '#e6f1fb', color: '#185fa5' }
          }
        >
          {group.laNhomTruong ? 'Nhóm trưởng' : 'Thành viên'}
        </span>
      </div>
      <div className="avatars">
        {group.thanhVien.map((tv, i) => (
          <div key={i} className="av" style={{ background: tv.bg, color: tv.color }}>
            {tv.kyHieu}
          </div>
        ))}
      </div>
      <div className="nhom-topic">{group.deTai}</div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentClasses = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [invitations, setInvitations] = useState([
    { id: 1, tenLop: 'Phân tích thiết kế hệ thống', tenGV: 'Thầy Cường' }
  ]);
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const colorPalette = [
    { card: '#5b9bf3', gvBg: '#dbeafe', gvColor: '#1d4ed8', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
    { card: '#f97316', gvBg: '#ffedd5', gvColor: '#9a3412', badgeBg: '#ffedd5', badgeColor: '#9a3412' },
    { card: '#10b981', gvBg: '#d1fae5', gvColor: '#065f46', badgeBg: '#d1fae5', badgeColor: '#065f46' },
    { card: '#8b5cf6', gvBg: '#ede9fe', gvColor: '#5b21b6', badgeBg: '#ede9fe', badgeColor: '#5b21b6' }
  ];

  const extractInitial = (name) => (name || '?').trim().charAt(0).toUpperCase();

  const buildGroupsFromClasses = (classList, groupsByClass) => {
    const allGroups = [];

    classList.forEach((cls, index) => {
      const groupInClass = (groupsByClass[cls.maLop] || []).filter((g) =>
        (g.thanhVien || []).some((sv) => sv.maNguoiDung === currentUser.maNguoiDung)
      );

      groupInClass.forEach((g) => {
        allGroups.push({
          maNhom: g.maNhom,
          tenNhom: g.tenNhom,
          tenLop: cls.tenLop,
          tenGV: cls.tenGiangVien,
          deTai: g.tenDeTai || 'Chưa có đề tài',
          laNhomTruong: g.maNhomTruong === currentUser.maNguoiDung,
          thanhVien: (g.thanhVien || []).slice(0, 5).map((tv) => ({
            kyHieu: extractInitial(tv.hoTen),
            bg: '#e5e7eb',
            color: '#1f2937'
          })),
          _colorIndex: index
        });
      });
    });

    return allGroups;
  };

  const notifyRemovedClasses = (classData) => {
    const storageKey = `studentClassSnapshot_${currentUser.maNguoiDung || 'current'}`;
    const currentSnapshot = (classData || []).map((cls) => ({
      maLop: cls.maLop,
      tenLop: cls.tenLop
    }));

    try {
      const previousSnapshot = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const removedClasses = previousSnapshot.filter((oldClass) =>
        !currentSnapshot.some((currentClass) => currentClass.maLop === oldClass.maLop)
      );

      if (removedClasses.length > 0) {
        const tenLopBiXoa = removedClasses.map((cls) => cls.tenLop).join(', ');
        alert(`Bạn bị giáo viên kick khỏi lớp: ${tenLopBiXoa}`);
      }

      localStorage.setItem(storageKey, JSON.stringify(currentSnapshot));
    } catch (err) {
      localStorage.setItem(storageKey, JSON.stringify(currentSnapshot));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const classData = await classService.getMyClasses();
      notifyRemovedClasses(classData || []);
      setClasses(classData || []);

      const hocKySet = [...new Set((classData || []).map((c) => c.tenHocKy).filter(Boolean))];
      setSemesters(hocKySet);

      const groupRequests = (classData || []).map(async (cls) => {
        const response = await fetch(`http://localhost:5186/api/nhom?maLop=${cls.maLop}`);
        if (!response.ok) return { maLop: cls.maLop, groups: [] };
        const data = await response.json();
        return { maLop: cls.maLop, groups: data };
      });

      const groupResults = await Promise.all(groupRequests);
      const groupsByClass = groupResults.reduce((acc, item) => {
        acc[item.maLop] = item.groups || [];
        return acc;
      }, {});

      setGroups(buildGroupsFromClasses(classData || [], groupsByClass));
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click card nhóm → sang trang nhóm học tập, truyền maNhom qua state
  // StudentGroups sẽ đọc location.state.maNhom để highlight đúng nhóm
  const handleClickGroup = (group) => {
    navigate('/student/groups', {
      state: {
        maNhom: group.maNhom,
        tenNhom: group.tenNhom,
        tenLop: group.tenLop,
      },
    });
  };

  const displayClasses = classes
    .filter((c) => selectedSemester === 'all' || c.tenHocKy === selectedSemester)
    .map((cls, index) => {
      const style = colorPalette[index % colorPalette.length];
      const tongCongViec = (cls.danhSachNhom || []).reduce((sum, n) => sum + (n.soLuongTask || 0), 0);
      const daXong = (cls.danhSachNhom || []).reduce((sum, n) => sum + (n.soLuongHoanThanh || 0), 0);
      const tienDo = tongCongViec > 0 ? Math.round((daXong / tongCongViec) * 100) : 0;

      return {
        ...cls,
        tenGV: cls.tenGiangVien,
        tienDo,
        mauSac: style.card,
        gvBg: style.gvBg,
        gvColor: style.gvColor,
        badgeBg: style.badgeBg,
        badgeColor: style.badgeColor
      };
    });

  const displayGroups = groups.filter((g) => {
    if (selectedSemester === 'all') return true;
    const cls = classes.find((c) => c.tenLop === g.tenLop);
    return cls?.tenHocKy === selectedSemester;
  });

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu lớp học...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="sc-container">
      {/* HEADER */}
      <div className="top">
        <h1>Lớp học của tôi</h1>
        <button className="join-btn" onClick={() => setShowModal(true)}>
          + Tham gia lớp
        </button>
      </div>

      {/* DANH SÁCH LỚP */}
      <div className="section-label sc-section-filter">
        <span>Đang học — </span>
        <select
          className="sc-semester-select"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="all">Tất cả học kỳ</option>
          {semesters.map((hk) => (
            <option key={hk} value={hk}>{hk}</option>
          ))}
        </select>
      </div>

      {invitations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#1e293b', marginBottom: '10px' }}>Lời mời tham gia lớp</h4>
          <div className="grid">
            {invitations.map(inv => (
              <div key={inv.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 15px', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>Hệ thống gửi lời mời tham gia lớp <strong>{inv.tenLop}</strong> của giảng viên <strong>{inv.tenGV}</strong></p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setInvitations(invitations.filter(i => i.id !== inv.id))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: '4px', cursor: 'pointer' }}>Từ chối</button>
                  <button onClick={() => { alert('Đã tham gia lớp!'); setInvitations(invitations.filter(i => i.id !== inv.id)); }} style={{ flex: 1, padding: '8px', border: 'none', background: '#10b981', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Tham gia</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid">
        {displayClasses.map(cls => (
          <ClassCard
            key={cls.maLop}
            cls={cls}
            onClick={() => navigate(`/student/classes/${cls.maLop}`)}
          />
        ))}
      </div>

      {/* DANH SÁCH NHÓM */}
      <div className="section-label">Nhóm của tôi trong các lớp</div>
      <div className="nhom-grid">
        {displayGroups.map(g => (
          <GroupCard
            key={g.maNhom}
            group={g}
            onClick={() => handleClickGroup(g)}
          />
        ))}

      </div>

      {/* MODAL THAM GIA LỚP */}
      {showModal && (
        <JoinModal
          onClose={() => setShowModal(false)}
          onJoin={fetchData}
        />
      )}
    </div>
  );
};

export default StudentClasses;
