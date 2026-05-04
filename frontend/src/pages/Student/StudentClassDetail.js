import React, { useMemo, useState } from 'react';
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

const mockClassData = {
  1: {
    maLop: 1,
    maLopHoc: 'LT_WEB_01',
    tenLop: 'Lập trình Web',
    monHoc: 'Công nghệ Web',
    tenGV: 'Nguyễn Văn A',
    hocKyNamHoc: 'Học kỳ 2, năm học 2025-2026',
    ngayBatDau: '03/03/2026',
    ngayKetThuc: '20/06/2026',
    mauSac: '#378add',
    sinhVien: [
      { mssv: 'DH52200320', hoTen: 'Đặng Võ Phương Anh', lop: 'D22_TH01' },
      { mssv: 'DH52300001', hoTen: 'Trần Thị Bích', lop: 'D23_TH02' },
      { mssv: 'DH52300002', hoTen: 'Lê Văn Cường', lop: 'D23_TH02' },
      { mssv: 'DH52300003', hoTen: 'Phạm Thị Dung', lop: 'D23_TH01' },
      { mssv: 'DH52300004', hoTen: 'Nguyễn Quốc Huy', lop: 'D23_TH03' },
    ],
    nhom: [
      { tenNhom: 'Nhóm 1', truongNhom: 'Trần Thị Bích', soThanhVien: 5, deTai: 'Website quản lý lớp học' },
      { tenNhom: 'Nhóm 2', truongNhom: 'Hoàng Thị Hoa', soThanhVien: 4, deTai: 'Ứng dụng đặt lịch khám bệnh' },
      { tenNhom: 'Nhóm 3', truongNhom: 'Chưa có', soThanhVien: 3, deTai: 'Chưa đăng ký đề tài' },
      { tenNhom: 'Nhóm 4', truongNhom: 'Đỗ Quang Khải', soThanhVien: 5, deTai: 'Hệ thống quản lý kho' },
    ],
    deTai: [
      { tenDeTai: 'Website quản lý lớp học', moTa: 'Quản lý lớp, nhóm, đề tài và tiến độ sinh viên.', sanPhamKyVong: 'Web app React + ASP.NET API, báo cáo và source code.', ngayBatDau: '03/03/2026', ngayKetThuc: '20/06/2026', tepDinhKem: 'YeuCau_Web_QuanLyLopHoc.pdf', nhomDangKy: 'Nhóm 1', trangThai: 'Đã duyệt' },
      { tenDeTai: 'Ứng dụng đặt lịch khám bệnh', moTa: 'Cho phép bệnh nhân đặt lịch và theo dõi lịch khám.', sanPhamKyVong: 'Prototype đầy đủ luồng đặt lịch, xác nhận, hủy lịch.', ngayBatDau: '03/03/2026', ngayKetThuc: '20/06/2026', tepDinhKem: 'MoTa_DatLichKham.pdf', nhomDangKy: 'Nhóm 2', trangThai: 'Đã đăng ký' },
      { tenDeTai: 'Hệ thống quản lý kho', moTa: 'Theo dõi nhập xuất tồn và báo cáo hàng hóa.', sanPhamKyVong: 'Dashboard tồn kho, phiếu nhập/xuất, báo cáo Excel.', ngayBatDau: '05/03/2026', ngayKetThuc: '15/06/2026', tepDinhKem: 'QuanLyKho_Requirement.docx', nhomDangKy: 'Nhóm 4', trangThai: 'Đã duyệt' },
      { tenDeTai: 'Sàn trao đổi tài liệu học tập', moTa: 'Sinh viên chia sẻ, tìm kiếm và đánh giá tài liệu.', sanPhamKyVong: 'Có phân quyền, upload file, tìm kiếm và thống kê lượt tải.', ngayBatDau: '10/03/2026', ngayKetThuc: '20/06/2026', tepDinhKem: 'TaiLieu_SanTraoDoi.zip', nhomDangKy: 'Chưa có', trangThai: 'Chưa đăng ký' },
    ],
  },
  2: {
    maLop: 2,
    maLopHoc: 'CSDL_02',
    tenLop: 'Cơ sở dữ liệu',
    monHoc: 'Cơ sở dữ liệu',
    tenGV: 'Trần Thị B',
    hocKyNamHoc: 'Học kỳ 2, năm học 2025-2026',
    ngayBatDau: '04/03/2026',
    ngayKetThuc: '18/06/2026',
    mauSac: '#1d9e75',
    sinhVien: [
      { mssv: 'DH52300591', hoTen: 'Võ Văn Hoài', lop: 'D23_TH01' },
      { mssv: 'DH52300086', hoTen: 'Trần Quốc Anh', lop: 'D23_TH03' },
      { mssv: 'DH52300114', hoTen: 'Nguyễn Thu Hà', lop: 'D23_TH02' },
      { mssv: 'DH52300207', hoTen: 'Lê Minh Tuấn', lop: 'D23_TH01' },
    ],
    nhom: [
      { tenNhom: 'Nhóm 1', truongNhom: 'Lê Minh Tuấn', soThanhVien: 4, deTai: 'Quản lý thư viện' },
      { tenNhom: 'Nhóm 2', truongNhom: 'Nguyễn Thu Hà', soThanhVien: 4, deTai: 'Hệ thống bán hàng' },
      { tenNhom: 'Nhóm 3', truongNhom: 'Võ Văn Hoài', soThanhVien: 3, deTai: 'Hệ thống thư viện' },
    ],
    deTai: [
      { tenDeTai: 'Quản lý thư viện', moTa: 'Quản lý sách, độc giả, mượn trả và thống kê.', sanPhamKyVong: 'Web app + tài liệu thiết kế + demo.', ngayBatDau: '04/03/2026', ngayKetThuc: '18/06/2026', tepDinhKem: 'QuanLyThuVien.pdf', nhomDangKy: 'Nhóm 1', trangThai: 'Đã duyệt' },
      { tenDeTai: 'Hệ thống bán hàng', moTa: 'Quản lý sản phẩm, đơn hàng và doanh thu.', sanPhamKyVong: 'Website bán hàng, báo cáo kỹ thuật và source code.', ngayBatDau: '04/03/2026', ngayKetThuc: '18/06/2026', tepDinhKem: 'HeThongBanHang.docx', nhomDangKy: 'Nhóm 2', trangThai: 'Đã đăng ký' },
      { tenDeTai: 'Ứng dụng tuyển dụng', moTa: 'Kết nối ứng viên và nhà tuyển dụng.', sanPhamKyVong: 'Prototype quy trình đăng tin, ứng tuyển, duyệt hồ sơ.', ngayBatDau: '10/03/2026', ngayKetThuc: '18/06/2026', tepDinhKem: 'UngDungTuyenDung.pdf', nhomDangKy: 'Chưa có', trangThai: 'Chưa đăng ký' },
    ],
  },
  3: {
    maLop: 3,
    maLopHoc: 'MMT_03',
    tenLop: 'Mạng máy tính',
    monHoc: 'Mạng máy tính',
    tenGV: 'Lê Hồng C',
    hocKyNamHoc: 'Học kỳ 2, năm học 2025-2026',
    ngayBatDau: '07/03/2026',
    ngayKetThuc: '27/06/2026',
    mauSac: '#ef9f27',
    sinhVien: [
      { mssv: 'DH52300086', hoTen: 'Trần Quốc Anh', lop: 'D23_TH03' },
      { mssv: 'DH52300100', hoTen: 'Nguyễn Minh Tú', lop: 'D23_TH02' },
      { mssv: 'DH52300108', hoTen: 'Dương Bảo Châu', lop: 'D23_TH01' },
      { mssv: 'DH52300221', hoTen: 'Võ Minh Khoa', lop: 'D23_TH03' },
    ],
    nhom: [
      { tenNhom: 'Nhóm 1', truongNhom: 'Võ Minh Khoa', soThanhVien: 4, deTai: 'Thiết kế mạng LAN' },
      { tenNhom: 'Nhóm 2', truongNhom: 'Chưa có', soThanhVien: 3, deTai: 'Chưa đăng ký đề tài' },
      { tenNhom: 'Nhóm 3', truongNhom: 'Dương Bảo Châu', soThanhVien: 4, deTai: 'Phân tích TCP/IP' },
    ],
    deTai: [
      { tenDeTai: 'Thiết kế mạng LAN', moTa: 'Phân tích yêu cầu và đề xuất mô hình mạng doanh nghiệp.', sanPhamKyVong: 'Sơ đồ mạng, bảng thiết bị, báo cáo phân tích chi phí.', ngayBatDau: '07/03/2026', ngayKetThuc: '27/06/2026', tepDinhKem: 'MMT_LAN_DoanhNghiep.pdf', nhomDangKy: 'Nhóm 1', trangThai: 'Đã đăng ký' },
      { tenDeTai: 'Phân tích TCP/IP', moTa: 'Mô phỏng và đánh giá hoạt động của bộ giao thức TCP/IP.', sanPhamKyVong: 'Báo cáo phân tích, demo mô phỏng bằng công cụ mạng.', ngayBatDau: '07/03/2026', ngayKetThuc: '27/06/2026', tepDinhKem: 'TCPIP_Analysis.pdf', nhomDangKy: 'Nhóm 3', trangThai: 'Đã duyệt' },
      { tenDeTai: 'Giám sát mạng nội bộ', moTa: 'Theo dõi thiết bị, cảnh báo lỗi và xuất báo cáo.', sanPhamKyVong: 'Dashboard giám sát, cảnh báo lỗi và báo cáo.', ngayBatDau: '07/03/2026', ngayKetThuc: '27/06/2026', tepDinhKem: 'GiamSatMang.docx', nhomDangKy: 'Chưa có', trangThai: 'Chưa đăng ký' },
    ],
  },
};

const tabs = [
  { key: 'info', label: 'Thông tin lớp', icon: <FaBookOpen /> },
  { key: 'students', label: 'Sinh viên', icon: <FaUsers /> },
  { key: 'groups', label: 'Nhóm', icon: <FaLayerGroup /> },
  { key: 'topics', label: 'Đề tài', icon: <FaClipboardList /> },
];

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
          <div className="cd-detail-file">
            <span>Tài liệu đính kèm</span>
            <strong>{topic.tepDinhKem || 'Chưa có tài liệu đính kèm'}</strong>
          </div>
        </div>
        <div className="cd-modal-footer">
          <button className="cd-modal-primary" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ topics }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <div className="cd-panel">
      <div className="cd-panel-title">Danh sách đề tài</div>
      <div className="cd-topic-list">
        {topics.map((topic) => (
          <div className="cd-topic-item" key={topic.tenDeTai}>
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
        <TopicDetailModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
      )}
    </div>
  );
}

const StudentClassDetail = () => {
  const { maLop } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const lopHoc = mockClassData[Number(maLop)];

  if (!lopHoc) {
    return (
      <div className="cd-wrap">
        <div className="cd-not-found">
          <p>Không tìm thấy lớp học.</p>
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
    if (activeTab === 'topics') return <TopicsTab topics={lopHoc.deTai} />;
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
