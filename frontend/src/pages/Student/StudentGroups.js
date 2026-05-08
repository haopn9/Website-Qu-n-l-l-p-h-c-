import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import './StudentGroups.css';
import apiClient from '../../services/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5186';

const buildFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ============================================================
// DỮ LIỆU MẪU
// ============================================================
const mockGroups = [
  {
    maNhom: 1, tenNhom: 'Nhóm 1',
    maLop: 1, maLopHoc: 'LT_WEB_01', tenLop: 'Lập trình Web', tenGV: 'Nguyễn Văn A',
    laNhomTruong: true,
    deTai: 'Website quản lý lớp học — Module làm việc nhóm',
    soThanhVien: 4, soToiDa: 5, ngayLap: '02/03/2026', capNhat: 'Hôm nay', tienDo: 62,
    taskTong: 12, taskHoanThanh: 5, taskTreHan: 1, taskDangLam: 4, taskChoDuyet: 2,
    thanhVien: [
      { maSo: 'DH52300086', hoTen: 'Nguyễn Văn A', isMe: true, laNhomTruong: true, pct: 75, taskLabel: '3/4', bg: '#e6f1fb', color: '#185fa5', ky: 'VA', barColor: '#378add' },
      { maSo: 'DH52300141', hoTen: 'Trần Thị B', isMe: false, laNhomTruong: false, pct: 100, taskLabel: '4/4', bg: '#faeeda', color: '#854f0b', ky: 'TB', barColor: '#639922' },
      { maSo: 'DH52300204', hoTen: 'Lê Văn C', isMe: false, laNhomTruong: false, pct: 33, taskLabel: '1/3', bg: '#e1f5ee', color: '#0f6e56', ky: 'LC', barColor: '#e24b4a' },
      { maSo: 'DH52300249', hoTen: 'Phạm Thị D', isMe: false, laNhomTruong: false, pct: 67, taskLabel: '2/3', bg: '#fbeaf0', color: '#993556', ky: 'PD', barColor: '#ef9f27' },
    ],
  },
];

const mockHistory = [
  {
    id: 1, hocKy: 'HK2 2025-2026',
    tieuDe: 'Yêu cầu chuyển sang Nhóm 3 — CSDL',
    ngayGui: '10/03/2026',
    lyDo: 'Bạn bè thân quen ở nhóm 3, muốn làm cùng để phối hợp tốt hơn.',
    trangThai: 'Từ chối',
    ghiChuGV: 'Nhóm 3 đã đủ thành viên, không thể tiếp nhận thêm.',
    badgeBg: '#fcebeb', badgeColor: '#a32d2d',
  },
];

const semesters = ['HK2 2025-2026', 'HK1 2025-2026', 'HK2 2024-2025'];

// ============================================================
// MODAL YÊU CẦU CHUYỂN NHÓM
// ============================================================
function TransferModal({ groups, onClose }) {
  const [fromGroup, setFromGroup] = useState(groups[0]?.maNhom || '');
  const [toGroupName, setToGroupName] = useState('');
  const [lyDo, setLyDo] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!toGroupName.trim() || !lyDo.trim()) return;
    alert('Đã gửi yêu cầu chuyển nhóm thành công!');
    onClose();
  };

  const selectedGroup = groups.find(g => g.maNhom === Number(fromGroup));

  return (
    <div className="sg-modal-overlay" onClick={onClose}>
      <div className="sg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="sg-modal-header">
          <h3>Yêu cầu chuyển nhóm</h3>
          <button className="sg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <form className="sg-modal-form" onSubmit={handleSend}>
          <div className="sg-form-group">
            <label>Nhóm hiện tại</label>
            <select className="sg-input" value={fromGroup} onChange={e => setFromGroup(Number(e.target.value))}>
              {groups.map(g => (
                <option key={g.maNhom} value={g.maNhom}>
                  {g.tenNhom} — {g.tenLop} ({g.laNhomTruong ? 'Nhóm trưởng' : 'Thành viên'})
                </option>
              ))}
            </select>
          </div>
          <div className="sg-form-group">
            <label>Lớp học</label>
            <input className="sg-input" value={selectedGroup ? `${selectedGroup.tenLop} (${selectedGroup.maLopHoc})` : ''} disabled />
          </div>
          <div className="sg-form-group">
            <label>Nhóm muốn chuyển sang *</label>
            <input className="sg-input" placeholder="VD: Nhóm 2" value={toGroupName} onChange={e => setToGroupName(e.target.value)} required />
          </div>
          <div className="sg-form-group">
            <label>Lý do chuyển nhóm *</label>
            <textarea className="sg-input" rows="3" placeholder="Trình bày lý do..." value={lyDo} onChange={e => setLyDo(e.target.value)} required style={{ resize: 'vertical' }} />
          </div>
          <div className="sg-modal-footer">
            <button type="button" className="sg-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="sg-btn-save">Gửi yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL YÊU CẦU VÀO NHÓM
// ============================================================
function JoinModal({ groups, onClose }) {
  const [selectedClassId, setSelectedClassId] = useState(groups[0]?.maLop || '');
  const classGroups = groups.filter(g => g.maLop === selectedClassId);
  const [selectedGroupId, setSelectedGroupId] = useState(classGroups[0]?.maNhom || '');

  useEffect(() => {
    const newClassGroups = groups.filter(g => g.maLop === selectedClassId);
    setSelectedGroupId(newClassGroups[0]?.maNhom || '');
  }, [selectedClassId, groups]);

  const targetGroup = groups.find(g => g.maNhom === selectedGroupId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    
    try {
      await apiClient.post(`/api/nhom/${selectedGroupId}/themthanhvien`, {
        maSinhVien: JSON.parse(localStorage.getItem('userInfo'))?.maNguoiDung
      });
      alert(`Bạn đã tham gia ${targetGroup.tenNhom} thành công!`);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Không thể tham gia nhóm!');
    }
  };

  const uniqueClasses = Array.from(new Set(groups.map(g => g.maLop))).map(id => groups.find(g => g.maLop === id));

  return (
    <div className="sg-modal-overlay" onClick={onClose}>
      <div className="sg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="sg-modal-header">
          <h3>Đăng ký nhóm</h3>
          <button className="sg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <form className="sg-modal-form" onSubmit={handleSend}>
          <div className="sg-form-group">
            <label>Lớp môn học</label>
            <select className="sg-input" value={selectedClassId} onChange={e => setSelectedClassId(Number(e.target.value))}>
              {uniqueClasses.map(c => (
                <option key={c.maLop} value={c.maLop}>{c.tenLop} ({c.maLopHoc})</option>
              ))}
            </select>
          </div>
          <div className="sg-form-group">
            <label>Nhóm</label>
            <select className="sg-input" value={selectedGroupId} onChange={e => setSelectedGroupId(Number(e.target.value))}>
              {classGroups.map(g => (
                <option key={g.maNhom} value={g.maNhom} disabled={g.soThanhVienHienTai >= g.soThanhVienToiDa}>
                  {g.tenNhom} ({g.soThanhVienHienTai}/{g.soThanhVienToiDa} thành viên) {g.soThanhVienHienTai >= g.soThanhVienToiDa ? '- Đã đầy' : ''}
                </option>
              ))}
            </select>
          </div>
          {targetGroup && (
            <div className="sg-form-group" style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <label style={{ marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Thành viên nhóm ({targetGroup.soThanhVienHienTai}/{targetGroup.soThanhVienToiDa})</label>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
                {targetGroup.thanhVien?.map(tv => (
                  <li key={tv.maNguoiDung}>{tv.hoTen} - {tv.maSo} {tv.vaiTroTrongNhom === 'leader' ? '(Nhóm trưởng)' : ''}</li>
                ))}
              </ul>
            </div>
          )}
          {targetGroup && targetGroup.choPhepDangKyNhom === false && (
            <div className="sg-form-group" style={{ background: '#fee2e2', padding: '10px', borderRadius: '4px', border: '1px solid #f87171', color: '#991b1b', fontSize: '13px' }}>
               Giảng viên đã chốt danh sách nhóm, bạn không thể đăng ký vào nhóm này nữa.
            </div>
          )}
          <div className="sg-modal-footer">
            <button type="button" className="sg-btn-cancel" onClick={onClose}>Đóng</button>
            <button 
              type="submit" 
              className="sg-btn-save" 
              style={{ background: '#378add', color: '#fff', opacity: (!targetGroup || targetGroup.soThanhVienHienTai >= targetGroup.soThanhVienToiDa || targetGroup.choPhepDangKyNhom === false) ? 0.5 : 1, cursor: (!targetGroup || targetGroup.soThanhVienHienTai >= targetGroup.soThanhVienToiDa || targetGroup.choPhepDangKyNhom === false) ? 'not-allowed' : 'pointer' }} 
              disabled={!targetGroup || targetGroup.soThanhVienHienTai >= targetGroup.soThanhVienToiDa || targetGroup.choPhepDangKyNhom === false}
            >
              Xác nhận tham gia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL CHI TIẾT ĐỀ TÀI
// ============================================================
function TopicDetailModal({ topic, onClose }) {
  if (!topic) return null;

  return (
    <div className="sg-modal-overlay" onClick={onClose}>
      <div className="sg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="sg-modal-header">
          <h3>Chi tiết đề tài</h3>
          <button className="sg-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="sg-modal-body" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>Đề tài</span>
            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{topic.tenDeTai}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Ngày bắt đầu</span>
              <strong>{topic.ngayBatDau || '—'}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Ngày kết thúc</span>
              <strong>{topic.ngayKetThuc || '—'}</strong>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Mô tả yêu cầu</span>
            <p style={{ margin: '5px 0', fontSize: '14px', lineHeight: '1.5', color: '#334155' }}>{topic.moTa}</p>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Sản phẩm kỳ vọng</span>
            <p style={{ margin: '5px 0', fontSize: '14px', lineHeight: '1.5', color: '#334155' }}>{topic.sanPhamKyVong}</p>
          </div>
          {topic.tepDinhKem && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Tài liệu từ Giảng viên</span>
              <a 
                href={buildFileUrl(topic.tepDinhKem.duongDan)} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#378add', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
              >
                📄 {topic.tepDinhKem.tenTep}
              </a>
            </div>
          )}
        </div>
        <div className="sg-modal-footer">
          <button className="sg-btn-save" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentGroups = () => {
  const location = useLocation();
  const incomingMaNhom = location.state?.maNhom || null;

  const [activeTab, setActiveTab] = useState('nhomCuaToi');
  const [myGroups, setMyGroups] = useState([]);
  const [selectedMaNhom, setSelectedMaNhom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedHocKy, setSelectedHocKy] = useState(semesters[0]);
  const [topicDetail, setTopicDetail] = useState(null);
  const [classTopics, setClassTopics] = useState({});

  // Lấy danh sách nhóm của tôi
  const fetchMyGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/nhom/cua-toi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyGroups(data);
        if (data.length > 0 && !selectedMaNhom) {
          setSelectedMaNhom(incomingMaNhom || data[0].maNhom);
        }
      }
    } catch (err) {
      console.error('Lỗi tải nhóm của tôi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách nhóm khả dụng để đăng ký (dành cho modal)
  const [availableGroups, setAvailableGroups] = useState([]);
  const fetchAvailableGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const lopRes = await fetch(`${API_BASE_URL}/api/lophoc/cua-toi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (lopRes.ok) {
        const lops = await lopRes.json();
        const nhomPromises = lops.map(l => 
          fetch(`${API_BASE_URL}/api/nhom?maLop=${l.maLop}`).then(r => r.json())
        );
        const results = await Promise.all(nhomPromises);
        setAvailableGroups(results.flat());
      }
    } catch (err) {
      console.error('Lỗi tải nhóm khả dụng:', err);
    }
  };

  // Lấy danh sách đề tài của lớp để xem chi tiết
  const fetchClassTopics = async (maLop) => {
    if (!maLop) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/detai/lop/${maLop}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClassTopics(prev => ({ ...prev, [maLop]: data }));
      }
    } catch (err) {
      console.error('Lỗi tải đề tài lớp:', err);
    }
  };

  useEffect(() => {
    fetchMyGroups();
    fetchAvailableGroups();
  }, []);

  useEffect(() => {
    if (incomingMaNhom) {
      setSelectedMaNhom(incomingMaNhom);
      setActiveTab('nhomCuaToi');
    }
  }, [incomingMaNhom]);

  const selectedGroup = myGroups.find(g => g.maNhom === selectedMaNhom) || myGroups[0];
  const filteredHistory = mockHistory.filter(h => h.hocKy === selectedHocKy);

  useEffect(() => {
    if (selectedGroup?.maLop) {
      fetchClassTopics(selectedGroup.maLop);
    }
  }, [selectedGroup]);

  const currentGroupTopics = classTopics[selectedGroup?.maLop] || [];
  const selectedGroupTopicInfo = currentGroupTopics.find(t => t.maDeTai === selectedGroup?.maDeTai);

  const handleLeaveGroup = async () => {
    if (window.confirm('Bạn có chắc muốn rời nhóm này?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/nhom/${selectedGroup.maNhom}/roinhom`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert('Đã rời nhóm thành công!');
          window.location.reload();
        } else {
          const errorData = await res.json();
          alert(errorData.thongBao || 'Lỗi khi rời nhóm!');
        }
      } catch (err) {
        console.error(err);
        alert('Không thể kết nối API!');
      }
    }
  };

  if (loading) return <div className="sg-container">Đang tải dữ liệu...</div>;
  return (
    <div className="sg-container">
      <div className="sg-top">
        <h1>Nhóm học tập</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="sg-btn-outline" style={{ background: '#378add', color: '#fff', borderColor: '#378add' }} onClick={() => setShowJoin(true)}>
            Đăng ký nhóm
          </button>
          <button className="sg-btn-outline" onClick={() => setShowTransfer(true)}>
            Yêu cầu chuyển nhóm
          </button>
          {activeTab === 'nhomCuaToi' && selectedGroup && selectedGroup.maNhom && (
            <button 
              className="sg-btn-outline" 
              style={{ 
                borderColor: selectedGroup.choPhepDangKyNhom === false ? '#cbd5e1' : '#e24b4a', 
                color: selectedGroup.choPhepDangKyNhom === false ? '#94a3b8' : '#e24b4a',
                cursor: selectedGroup.choPhepDangKyNhom === false ? 'not-allowed' : 'pointer'
              }} 
              onClick={selectedGroup.choPhepDangKyNhom === false ? undefined : handleLeaveGroup}
              title={selectedGroup.choPhepDangKyNhom === false ? "Giảng viên đã chốt danh sách, không thể rời nhóm" : "Rời nhóm"}
            >
              Rời nhóm
            </button>
          )}
        </div>
      </div>

      <div className="sg-tab-bar">
        <button className={`sg-tab ${activeTab === 'nhomCuaToi' ? 'active' : ''}`} onClick={() => setActiveTab('nhomCuaToi')}>Nhóm của tôi</button>
        <button className={`sg-tab ${activeTab === 'lichSu' ? 'active' : ''}`} onClick={() => setActiveTab('lichSu')}>Lịch sử yêu cầu</button>
      </div>

      {activeTab === 'nhomCuaToi' && (
        !selectedGroup ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Bạn chưa tham gia nhóm nào. Vui lòng chọn "Đăng ký nhóm".
          </div>
        ) : (
        <>
          <div className="group-selector-wrapper">
            <span className="group-selector-label">Xem thông tin của:</span>
            <select className="group-select" value={selectedMaNhom || ''} onChange={e => setSelectedMaNhom(Number(e.target.value))}>
              {myGroups.map(g => (
                <option key={g.maNhom} value={g.maNhom}>
                  {g.tenNhom} — {g.tenLop} ({g.laNhomTruong ? 'Nhóm trưởng' : 'Thành viên'})
                </option>
              ))}
            </select>
          </div>

          <div className="sg-two-col">
            <div className="sg-card">
              <div className="sg-card-title">Thông tin nhóm</div>
              <div className="sg-card-sub">Cập nhật lần cuối: {selectedGroup.capNhat}</div>
              <div className="sg-info-row"><span>Lớp</span><span>{selectedGroup.tenLop} ({selectedGroup.maLopHoc})</span></div>
              <div className="sg-info-row"><span>Giảng viên</span><span>{selectedGroup.tenGV}</span></div>
              <div className="sg-info-row">
                <span>Đề tài</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, textAlign: 'right' }}>
                  <span>{selectedGroup.tenDeTai}</span>
                  {selectedGroup.tenDeTai !== "Chưa có đề tài" && selectedGroup.tenDeTai !== "Chưa đăng ký đề tài" && (
                    <button 
                      onClick={() => setTopicDetail(selectedGroupTopicInfo)}
                      style={{ background: 'none', border: 'none', color: '#378add', cursor: 'pointer', fontSize: '12px', padding: 0, textAlign: 'right', textDecoration: 'underline' }}
                    >
                      Xem chi tiết đề tài
                    </button>
                  )}
                </div>
              </div>
              <div className="sg-info-row"><span>Thành viên</span><span>{selectedGroup.soThanhVienHienTai} / {selectedGroup.soThanhVienToiDa} người</span></div>
              <div className="sg-info-row"><span>Nhóm trưởng</span><span>{selectedGroup.tenNhomTruong}</span></div>
              <div className="sg-progress-wrap">
                <div className="sg-progress-label"><span>Tiến độ tổng thể (Mock)</span><strong>{selectedGroup.tienDo || 0}%</strong></div>
                <div className="sg-pbar"><div className="sg-pfill" style={{ width: `${selectedGroup.tienDo || 0}%` }} /></div>
              </div>
            </div>

            <div className="sg-card">
              <div className="sg-card-title">Thống kê nhiệm vụ</div>
              <div className="sg-card-sub">Tính đến hôm nay</div>
              <div className="sg-stat-mini">
                <div className="sg-smc"><div className="sg-smc-val" style={{ color: '#378add' }}>{selectedGroup.taskTong || 0}</div><div className="sg-smc-lbl">Tổng task</div></div>
                <div className="sg-smc"><div className="sg-smc-val" style={{ color: '#639922' }}>{selectedGroup.taskHoanThanh || 0}</div><div className="sg-smc-lbl">Hoàn thành</div></div>
                <div className="sg-smc"><div className="sg-smc-val" style={{ color: '#e24b4a' }}>{selectedGroup.taskTreHan || 0}</div><div className="sg-smc-lbl">Trễ hạn</div></div>
              </div>
              {[
                { label: 'Chưa bắt đầu', val: 1, color: '#94a3b8' },
                { label: 'Đang thực hiện', val: selectedGroup.taskDangLam || 0, color: '#378add' },
                { label: 'Chờ duyệt', val: selectedGroup.taskChoDuyet || 0, color: '#ef9f27' },
                { label: 'Yêu cầu làm lại', val: 0, color: '#b91c1c' },
                { label: 'Trễ hạn', val: selectedGroup.taskTreHan || 0, color: '#e24b4a' },
                { label: 'Hoàn thành', val: selectedGroup.taskHoanThanh || 0, color: '#639922' },
              ].map((item, i) => (
                <div className="sg-task-bar-row" key={i}>
                  <div className="sg-task-bar-label"><span>{item.label}</span><span>{item.val} task</span></div>
                  <div className="sg-pbar">
                    <div className="sg-pfill" style={{ width: `${selectedGroup.taskTong ? (item.val / selectedGroup.taskTong) * 100 : 0}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sg-section-label">Thành viên nhóm</div>
          <div className="sg-card">
            {selectedGroup.thanhVien?.map((tv, i) => (
              <div key={i} className="sg-member-row">
                <div className="sg-av" style={{ background: tv.bg, color: tv.color }}>{tv.ky}</div>
                <div style={{ flex: 1 }}>
                  <div className="sg-mname">
                    {tv.hoTen}
                    {tv.isMe && <span className="sg-badge-me">Tôi</span>}
                    {tv.vaiTroTrongNhom === 'leader' && <span className="sg-badge" style={{ background: '#faeeda', color: '#854f0b' }}>Nhóm trưởng</span>}
                  </div>
                  <div className="sg-msub">{tv.maSo}</div>
                </div>
                <div className="sg-mini-bar-wrap">
                  <div className="sg-mini-bar-label">Hoàn thành {tv.taskLabel || '0/0'}</div>
                  <div className="sg-mini-pbar">
                    <div className="sg-mini-pfill" style={{ width: `${tv.pct || 0}%`, background: tv.barColor || '#cbd5e1' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
        )
      )}

      {activeTab === 'lichSu' && (
        <>
          <div className="sg-semester-select-wrap">
            <label>Xem theo học kỳ:</label>
            <select className="sg-semester-select" value={selectedHocKy} onChange={e => setSelectedHocKy(e.target.value)}>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {filteredHistory.length === 0
            ? <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '40px 0' }}>Không có yêu cầu nào trong học kỳ này.</div>
            : filteredHistory.map(h => (
              <div key={h.id} className="sg-req-card">
                <div className="sg-req-top">
                  <div>
                    <div className="sg-req-name">{h.tieuDe}</div>
                    <div className="sg-req-meta">Gửi ngày {h.ngayGui}</div>
                  </div>
                  <span className="sg-badge" style={{ background: h.badgeBg, color: h.badgeColor }}>{h.trangThai}</span>
                </div>
                <div className="sg-req-reason">
                  Lý do: {h.lyDo}
                  {h.ghiChuGV && <span className="sg-gv-reply">GV phản hồi: {h.ghiChuGV}</span>}
                </div>
              </div>
            ))
          }
        </>
      )}

      {showTransfer && <TransferModal groups={myGroups} onClose={() => setShowTransfer(false)} />}
      {showJoin && <JoinModal groups={availableGroups} onClose={() => setShowJoin(false)} />}
      {topicDetail && <TopicDetailModal topic={topicDetail} onClose={() => setTopicDetail(null)} />}
    </div>
  );
};

export default StudentGroups;
