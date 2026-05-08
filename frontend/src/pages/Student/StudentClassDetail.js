import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBookOpen,
  FaChalkboardTeacher,
  FaClipboardList,
  FaLayerGroup,
  FaSearch,
  FaUsers,
} from 'react-icons/fa';
import './StudentClassDetail.css';
import classService from '../../services/classService';
import deTaiService from '../../services/deTaiService';
import authService from '../../services/authService';



const tabs = [
  { key: 'info', label: 'Thông tin lớp', icon: <FaBookOpen /> },
  { key: 'students', label: 'Sinh viên', icon: <FaUsers /> },
  { key: 'groups', label: 'Nhóm', icon: <FaLayerGroup /> },
  { key: 'topics', label: 'Đề tài', icon: <FaClipboardList /> },
];

const formatDateVN = (value) => {
  if (!value) return '';
  const [year, month, day] = value.substring(0, 10).split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

const mapApiClassDetail = (data) => ({
  maLop: data.maLop,
  maLopHoc: data.maLopHoc,
  tenLop: data.tenLop,
  monHoc: data.tenLop,
  tenGV: data.tenGiangVien,
  hocKyNamHoc: data.tenHocKy || `HK ${data.maHocKy}`,
  ngayBatDau: formatDateVN(data.ngayBatDau),
  ngayKetThuc: formatDateVN(data.ngayKetThuc),
  mauSac: '#378add',
  sinhVien: (data.danhSachSinhVien || []).map((sv) => ({
    mssv: sv.maSo,
    hoTen: sv.hoTen,
    lop: sv.lopSinhVien || 'Chưa cập nhật'
  })),
  nhom: (data.danhSachNhom || []).map((nhom) => ({
    maNhom: nhom.maNhom,
    tenNhom: nhom.tenNhom,
    truongNhom: nhom.tenNhomTruong || 'Chưa có',
    maNhomTruong: nhom.maNhomTruong,
    soThanhVien: nhom.soThanhVienHienTai || 0,
    soThanhVienToiDa: nhom.soThanhVienToiDa || 0,
    deTai: nhom.tenDeTai || 'Chưa đăng ký đề tài'
  })),
  deTai: (data.danhSachDeTai || []).map((deTai) => ({
    maDeTai: deTai.maDeTai,
    tenDeTai: deTai.tenDeTai,
    moTa: deTai.moTa || 'Chưa có mô tả',
    sanPhamKyVong: deTai.sanPhamKyVong || 'Chưa cập nhật',
    ngayBatDau: formatDateVN(deTai.ngayBatDau),
    ngayKetThuc: formatDateVN(deTai.ngayKetThuc),
    tepDinhKem: deTai.tepDinhKem,
    nhomDangKy: deTai.daCoNhom ? deTai.tenNhom : 'Chưa có',
    trangThai: deTai.daCoNhom ? 'Đã đăng ký' : 'Chưa đăng ký',
    daCoNhom: deTai.daCoNhom, // Cờ quan trọng
    phuongThucGiao: deTai.phuongThucGiao || 'Đăng ký tự do'
  }))
});

function StatusBadge({ status }) {
  const statusClass = {
    'Chưa đăng ký': 'pending',
    'Đã đăng ký': 'registered',
    'Đã duyệt': 'approved',
  }[status] || 'pending';

  return <span className={`cd-status cd-status-${statusClass}`}>{status}</span>;
}

function InfoTab({ lopHoc }) {
  const infoRows = [
    { label: 'Tên lớp môn học', value: lopHoc.tenLop },
    { label: 'Mã lớp', value: lopHoc.maLopHoc },
    { label: 'Môn học', value: lopHoc.monHoc },
    { label: 'Giảng viên', value: lopHoc.tenGV },
    { label: 'Học kỳ, năm học', value: lopHoc.hocKyNamHoc },
    { label: 'Ngày bắt đầu', value: lopHoc.ngayBatDau },
    { label: 'Ngày kết thúc', value: lopHoc.ngayKetThuc },
  ];

  return (
    <div className="cd-info-layout">
      <div className="cd-panel">
        <div className="cd-panel-title">Thông tin lớp môn học</div>
        <div className="cd-info-grid">
          {infoRows.map((row) => (
            <div className="cd-info-item" key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-stat-grid">
        <div className="cd-stat-card">
          <span>Sinh viên</span>
          <strong>{lopHoc.sinhVien.length}</strong>
        </div>
        <div className="cd-stat-card">
          <span>Nhóm</span>
          <strong>{lopHoc.nhom.length}</strong>
        </div>
        <div className="cd-stat-card">
          <span>Đề tài</span>
          <strong>{lopHoc.deTai.length}</strong>
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ students }) {
  const [keyword, setKeyword] = useState('');
  const filteredStudents = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return students;

    return students.filter((student) =>
      `${student.mssv} ${student.hoTen} ${student.lop}`.toLowerCase().includes(normalizedKeyword)
    );
  }, [keyword, students]);

  return (
    <div className="cd-panel">
      <div className="cd-toolbar">
        <div>
          <div className="cd-panel-title">Danh sách sinh viên</div>
          <p>{filteredStudents.length} sinh viên trong lớp</p>
        </div>
        <label className="cd-search">
          <FaSearch />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm MSSV, họ tên, lớp"
          />
        </label>
      </div>

      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>MSSV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.mssv}>
                <td>{index + 1}</td>
                <td>{student.mssv}</td>
                <td>{student.hoTen}</td>
                <td>{student.lop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupsTab({ groups }) {
  return (
    <div className="cd-group-grid">
      {groups.map((group) => (
        <div className="cd-group-card" key={group.tenNhom}>
          <div className="cd-group-head">
            <div>
              <span>Nhóm</span>
              <strong>{group.tenNhom}</strong>
            </div>
            <div className="cd-member-count">{group.soThanhVien} SV</div>
          </div>
          <div className="cd-group-row">
            <span>Trưởng nhóm</span>
            <strong className={group.truongNhom === 'Chưa có' ? 'cd-muted-danger' : ''}>{group.truongNhom}</strong>
          </div>
          <div className="cd-group-topic">
            <span>Đề tài đang đăng ký</span>
            <strong>{group.deTai}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicDetailModal({ topic, onClose }) {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5186';

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" onClick={(event) => event.stopPropagation()}>
        <div className="cd-modal-header">
          <h3>Chi tiết đề tài</h3>
          <button className="cd-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cd-modal-body">
          <div className="cd-detail-title">
            <span>Đề tài</span>
            <strong>{topic.tenDeTai}</strong>
          </div>
          <div className="cd-detail-grid">
            <div><span>Ngày bắt đầu</span><strong>{topic.ngayBatDau}</strong></div>
            <div><span>Ngày kết thúc</span><strong>{topic.ngayKetThuc}</strong></div>
            <div><span>Nhóm đăng ký</span><strong>{topic.nhomDangKy}</strong></div>
            <div><span>Trạng thái</span><strong>{topic.trangThai}</strong></div>
          </div>
          <div className="cd-detail-section">
            <span>Mô tả yêu cầu</span>
            <p>{topic.moTa}</p>
          </div>
          <div className="cd-detail-section">
            <span>Sản phẩm kỳ vọng</span>
            <p>{topic.sanPhamKyVong}</p>
          </div>
          {topic.tepDinhKem && (
            <div className="cd-detail-section">
              <span>Tài liệu đính kèm</span>
              <p>
                <a href={`${API_BASE_URL}${topic.tepDinhKem.duongDan}`} target="_blank" rel="noopener noreferrer" className="cd-file-link" style={{ color: '#378add', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaClipboardList /> {topic.tepDinhKem.tenTep}
                </a>
              </p>
            </div>
          )}
        </div>
        <div className="cd-modal-footer">
          <button className="cd-modal-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ topics, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <div className="cd-panel">
      <div className="cd-panel-title">Danh sách đề tài</div>
      <div className="cd-topic-list">
        {topics.map((topic) => (
          <div className="cd-topic-item" key={topic.maDeTai}>
            <div className="cd-topic-main">
              <div>
                <h3>{topic.tenDeTai}</h3>
                <p>{topic.moTa}</p>
              </div>
              <StatusBadge status={topic.trangThai} />
            </div>
            <div className="cd-topic-meta">
              <span>Nhóm đăng ký</span>
              <strong>{topic.nhomDangKy}</strong>
            </div>
            <button className="cd-topic-detail-btn" onClick={() => setSelectedTopic(topic)}>
              Xem chi tiết đề tài
            </button>
          </div>
        ))}
      </div>
      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

const StudentClassDetail = () => {
  const { maLop } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [lopHoc, setLopHoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const data = await classService.getClassById(maLop);
        setLopHoc(mapApiClassDetail(data));
        setError('');
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết lớp học');
        setLopHoc(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetail();
  }, [maLop]);

  if (loading) {
    return <div className="loading-state">Đang tải chi tiết lớp học...</div>;
  }

  if (error || !lopHoc) {
    return (
      <div className="cd-wrap">
        <div className="cd-not-found">
          <p>{error || 'Không tìm thấy lớp học.'}</p>
          <button className="cd-solid-btn" onClick={() => navigate('/student/classes')}>
            Quay lại lớp học
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'students') return <StudentsTab students={lopHoc.sinhVien} />;
    if (activeTab === 'groups') return <GroupsTab groups={lopHoc.nhom} />;
    if (activeTab === 'topics') return (
      <TopicsTab
        topics={lopHoc.deTai}
      />
    );
    return <InfoTab lopHoc={lopHoc} />;
  };

  return (
    <div className="cd-wrap">
      <div className="cd-hero" style={{ '--class-color': lopHoc.mauSac }}>
        <button className="cd-back-btn" onClick={() => navigate('/student/classes')}>
          <FaArrowLeft />
          Quay lại
        </button>
        <div className="cd-hero-content">
          <div className="cd-subtitle">
            <FaChalkboardTeacher />
            {lopHoc.tenGV}
          </div>
          <h1>{lopHoc.tenLop}</h1>
          <div className="cd-hero-meta">
            <span>Mã lớp: {lopHoc.maLopHoc}</span>
            <span>Môn học: {lopHoc.monHoc}</span>
            <span>{lopHoc.hocKyNamHoc}</span>
          </div>
          <div className="cd-hero-dates">
            {lopHoc.ngayBatDau} - {lopHoc.ngayKetThuc}
          </div>
        </div>
      </div>

      <div className="cd-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`cd-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="cd-content">{renderTabContent()}</div>
    </div>
  );
};

export default StudentClassDetail;
