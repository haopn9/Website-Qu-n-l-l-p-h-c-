-- ============================================================
-- HỆ THỐNG QUẢN LÝ LỚP HỌC - MODULE LÀM VIỆC NHÓM
-- Phiên bản: 2.0
-- Công nghệ: React + ASP.NET + SQL Server (SSMS)
-- Mô tả: Hỗ trợ quản lý nhóm, phân công công việc,
--         theo dõi tiến độ và thảo luận trong lớp học
-- ============================================================

USE master;
GO

IF DB_ID(N'QuanLyLopHocDBv2') IS NOT NULL
BEGIN
    ALTER DATABASE QuanLyLopHocDBv2 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QuanLyLopHocDBv2;
END
GO

CREATE DATABASE QuanLyLopHocDBv2;
GO

USE QuanLyLopHocDBv2;
GO

-- ============================================================
-- CỤM 1: CẤU HÌNH HỆ THỐNG & DANH MỤC NỀN
-- ============================================================

-- Bảng lưu các tham số cấu hình kỹ thuật của hệ thống
-- (dung lượng file tối đa, định dạng cho phép, ...)
CREATE TABLE CauHinhHeThong (
    KhoaCauHinh    VARCHAR(50)      PRIMARY KEY,              -- Tên khóa cấu hình (ví dụ: MaxFileSizeMB)
    GiaTriCauHinh  NVARCHAR(MAX)    NOT NULL,                 -- Giá trị tương ứng
    MoTa           NVARCHAR(255)    NULL                      -- Mô tả ý nghĩa của cấu hình
);

-- Bảng danh sách Khoa / Ngành đào tạo
CREATE TABLE Khoa (
    MaKhoa    INT           IDENTITY(1,1) PRIMARY KEY,       -- Mã khoa (tự tăng)
    TenKhoa   NVARCHAR(100) NOT NULL,                        -- Tên đầy đủ của khoa
    KyHieuKhoa VARCHAR(20)  UNIQUE NULL                      -- Ký hiệu viết tắt (ví dụ: CNTT, KTMT)
);

-- Bảng danh mục lớp hành chính của sinh viên
-- Tách riêng với LopHoc vì LopHoc là lớp học phần do giảng viên tạo
CREATE TABLE LopSinhVien (
    MaLopSinhVien  VARCHAR(50)  PRIMARY KEY,                 -- Mã lớp hành chính (ví dụ: D23_TH01)
    TenLopSinhVien VARCHAR(50)  NOT NULL UNIQUE,             -- Tên lớp hành chính, hiện trùng với mã lớp
    MaKhoa         INT          NULL,                        -- Khoa quản lý lớp hành chính (FK)
    DangHoatDong   BIT          DEFAULT 1,                   -- Trạng thái dùng cho dropdown chọn lớp
    FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
);

-- Bảng Học kỳ / Niên khóa
CREATE TABLE HocKy (
    MaHocKy    INT           IDENTITY(1,1) PRIMARY KEY,      -- Mã học kỳ (tự tăng)
    TenHocKy   NVARCHAR(50)  NOT NULL,                       -- Tên học kỳ (ví dụ: HK1 2025-2026)
    NgayBatDau DATE          NULL,                           -- Ngày bắt đầu học kỳ
    NgayKetThuc DATE         NULL,                           -- Ngày kết thúc học kỳ
    LaHienTai  BIT           DEFAULT 0                       -- Đánh dấu học kỳ đang hoạt động (1 = hiện tại)
);

-- ============================================================
-- CỤM 2: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (RBAC)
-- ============================================================

-- Bảng vai trò người dùng trong hệ thống (Admin, Giảng viên, Sinh viên)
CREATE TABLE VaiTro (
    MaVaiTro   INT           IDENTITY(1,1) PRIMARY KEY,      -- Mã vai trò (tự tăng)
    TenVaiTro  NVARCHAR(50)  NOT NULL                        -- Tên vai trò (Admin / Giảng viên / Sinh viên)
);

-- Bảng tài khoản người dùng (dùng chung cho Admin, GV, SV)
-- Phân biệt vai trò qua cột MaVaiTro
CREATE TABLE NguoiDung (
    MaNguoiDung   INT           IDENTITY(1,1) PRIMARY KEY,   -- Mã người dùng (tự tăng, khóa chính)
    MaSo          VARCHAR(20)   UNIQUE NOT NULL,              -- Mã định danh: MSSV (SV) hoặc MSGV (GV) hoặc ADMIN
    TenDangNhap   VARCHAR(50)   NOT NULL UNIQUE,              -- Tên đăng nhập (username), không trùng
    MatKhauHash   VARCHAR(255)  NOT NULL,                     -- Mật khẩu đã được mã hóa (BCrypt/SHA256)
    HoTen         NVARCHAR(100) NOT NULL,                     -- Họ và tên đầy đủ
    NgaySinh      DATE          NULL,                         -- Ngày sinh
    GioiTinh      BIT           NULL,                         -- Giới tính: 1 = Nam, 0 = Nữ
    SoDienThoai   VARCHAR(20)   NULL,                         -- Số điện thoại liên lạc
    Email         VARCHAR(100)  UNIQUE NULL,                  -- Email (dùng để nhận thông báo, đăng nhập)
    DiaChi        NVARCHAR(255) NULL,                         -- Địa chỉ nơi ở hiện tại
    AnhDaiDien    NVARCHAR(MAX) NULL,                         -- Đường dẫn ảnh đại diện (URL hoặc path)
    MaKhoa        INT           NULL,                         -- Khoa mà người dùng thuộc về (FK)
    MaVaiTro      INT           NOT NULL,                     -- Vai trò của người dùng (FK)
    LopSinhVien   VARCHAR(50)   NULL,                         -- Lớp hành chính của sinh viên (chỉ dành cho Role=3)
    DangHoatDong  BIT           DEFAULT 1,                    -- Trạng thái: 1 = Đang hoạt động, 0 = Đã khóa (Soft Delete)
    NgayTao       DATETIME      DEFAULT GETDATE(),            -- Thời điểm tài khoản được tạo
    FOREIGN KEY (MaVaiTro) REFERENCES VaiTro(MaVaiTro),
    FOREIGN KEY (MaKhoa)   REFERENCES Khoa(MaKhoa),
    CONSTRAINT CHK_PhanQuyen_Khoa_Lop CHECK (
        (MaVaiTro = 1 AND MaKhoa IS NULL AND LopSinhVien IS NULL) OR             -- Admin: không Khoa, không Lớp
        (MaVaiTro = 2 AND MaKhoa IS NOT NULL AND LopSinhVien IS NULL) OR         -- Giảng viên: có Khoa, không Lớp
        (MaVaiTro = 3 AND MaKhoa IS NOT NULL AND LopSinhVien IS NOT NULL)        -- Sinh viên: có Khoa, có Lớp
    )
);

-- ============================================================
-- CỤM 3: QUẢN LÝ LỚP HỌC & NHÓM
-- ============================================================

-- Bảng Lớp học môn học do Giảng viên tạo
CREATE TABLE LopHoc (
    MaLop         INT           IDENTITY(1,1) PRIMARY KEY,   -- Mã lớp học (tự tăng)
    MaLopHoc      VARCHAR(20)   UNIQUE NOT NULL,             -- Mã lớp dùng để tham gia (Class Code, ví dụ: LT_WEB_01)
    TenLop        NVARCHAR(100) NOT NULL,                    -- Tên môn học / lớp học
    MaGiangVien   INT           NOT NULL,                    -- Giảng viên phụ trách lớp (FK)
    MaHocKy      INT           NOT NULL,                    -- Học kỳ lớp này thuộc về (FK)
    NgayBatDau    DATE          NULL,                        -- Ngày bắt đầu môn học
    NgayKetThuc   DATE          NULL,                        -- Ngày kết thúc môn học
    ThoiGianHoc   NVARCHAR(255) NULL,                       -- Lịch học (ví dụ: Thứ 2,4,6 18:00-20:00)
    ChoPhepDangKyNhom BIT       DEFAULT 1,                   -- Trạng thái Khóa chốt nhóm: 1 = Mở, 0 = Đã khóa
    HanDangKyNhom DATETIME      NULL,                        -- Hạn đăng ký nhóm    
    FOREIGN KEY (MaGiangVien) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaHocKy)    REFERENCES HocKy(MaHocKy)
);

-- Bảng liên kết Sinh viên với Lớp học (quan hệ N-N)
-- Một sinh viên có thể thuộc nhiều lớp, một lớp có nhiều sinh viên
CREATE TABLE SinhVienLop (
    MaLop       INT NOT NULL,                               -- Mã lớp học (FK)
    MaSinhVien  INT NOT NULL,                               -- Mã sinh viên (FK)
    PRIMARY KEY (MaLop, MaSinhVien),
    FOREIGN KEY (MaLop)      REFERENCES LopHoc(MaLop),
    FOREIGN KEY (MaSinhVien) REFERENCES NguoiDung(MaNguoiDung)
);

-- Bảng Đề tài / Chủ đề môn học do Giảng viên tạo
-- Nhóm sẽ được giao hoặc đăng ký 1 đề tài
CREATE TABLE DeTai (
    MaDeTai          INT           IDENTITY(1,1) PRIMARY KEY, -- Mã đề tài (tự tăng)
    TenDeTai         NVARCHAR(255) NOT NULL,                  -- Tên/tiêu đề đề tài
    MoTa             NVARCHAR(MAX) NULL,                      -- Mô tả yêu cầu kỹ thuật chi tiết
    SanPhamKyVong    NVARCHAR(MAX) NULL,                      -- Sản phẩm/output kỳ vọng khi hoàn thành
    MaLop            INT           NOT NULL,                  -- Lớp học sở hữu đề tài này (FK)
    NgayBatDau       DATETIME      NULL,                      -- Ngày bắt đầu thực hiện
    NgayKetThuc      DATETIME      NULL,                      -- Hạn nộp / ngày kết thúc
    PhuongThucGiao   NVARCHAR(50)  DEFAULT N'Đăng ký tự do',  -- Phương thức giao: Đăng ký tự do / Chỉ định trực tiếp
    NgayTao          DATETIME      DEFAULT GETDATE(),         -- Thời điểm tạo đề tài
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

-- Bảng Nhóm học tập trong mỗi lớp
CREATE TABLE Nhom (
    MaNhom       INT           IDENTITY(1,1) PRIMARY KEY,    -- Mã nhóm (tự tăng)
    TenNhom      NVARCHAR(100) NOT NULL,                     -- Tên nhóm (ví dụ: Nhóm 1, Team Alpha)
    SoThanhVienToiDa INT       DEFAULT 5,                    -- Số thành viên tối đa (do GV cấu hình)
    MaLop        INT           NOT NULL,                     -- Lớp học mà nhóm thuộc về (FK)
    MaNhomTruong INT           NULL,                         -- Thành viên được chỉ định làm nhóm trưởng (FK)
    MaDeTai      INT           NULL,                         -- Đề tài nhóm được giao hoặc đăng ký (FK, có thể NULL)
    NgayTao      DATETIME      DEFAULT GETDATE(),            -- Thời điểm tạo nhóm
    FOREIGN KEY (MaLop)        REFERENCES LopHoc(MaLop),
    FOREIGN KEY (MaNhomTruong) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaDeTai)      REFERENCES DeTai(MaDeTai)
);

-- Bảng liên kết Sinh viên với Nhóm (quan hệ N-N)
-- Một sinh viên chỉ thuộc 1 nhóm trong 1 lớp (được kiểm soát ở tầng ứng dụng)
CREATE TABLE ThanhVienNhom (
    MaNhom      INT NOT NULL,                               -- Mã nhóm (FK)
    MaSinhVien  INT NOT NULL,                               -- Mã sinh viên (FK)
    PRIMARY KEY (MaNhom, MaSinhVien),
    FOREIGN KEY (MaNhom)      REFERENCES Nhom(MaNhom),
    FOREIGN KEY (MaSinhVien)  REFERENCES NguoiDung(MaNguoiDung)
);
 

-- ============================================================
-- CỤM 4: QUẢN LÝ YÊU CẦU CHUYỂN NHÓM & YÊU CẦU XIN GIA NHẬP NHÓM
-- ============================================================

-- Bảng lưu yêu cầu chuyển nhóm của sinh viên
-- Quy trình: SV gửi yêu cầu -> GV xem xét -> Phê duyệt/Từ chối -> Hệ thống cập nhật ThanhVienNhom
CREATE TABLE YeuCauChuyenNhom (
    MaYeuCau        INT           IDENTITY(1,1) PRIMARY KEY, -- Mã yêu cầu (tự tăng)
    MaSinhVien      INT           NOT NULL,                  -- Sinh viên gửi yêu cầu (FK)
    MaNhomHienTai   INT           NOT NULL,                  -- Nhóm sinh viên đang ở (FK)
    MaNhomMuon      INT           NOT NULL,                  -- Nhóm sinh viên muốn chuyển sang (FK)
    LyDo            NVARCHAR(MAX) NULL,                      -- Lý do muốn chuyển nhóm
    TrangThai       NVARCHAR(50)  DEFAULT N'Chờ duyệt',      -- Trạng thái: Chờ duyệt / Đã duyệt / Từ chối
    GhiChuGiangVien NVARCHAR(MAX) NULL,                      -- Phản hồi của giảng viên khi duyệt/từ chối
    NgayGui         DATETIME      DEFAULT GETDATE(),         -- Thời điểm sinh viên gửi yêu cầu
    NgayXuLy        DATETIME      NULL,                      -- Thời điểm giảng viên phê duyệt/từ chối
    FOREIGN KEY (MaSinhVien)    REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaNhomHienTai) REFERENCES Nhom(MaNhom),
    FOREIGN KEY (MaNhomMuon)    REFERENCES Nhom(MaNhom)
);

-- ============================================================
-- CỤM 5: QUẢN LÝ CÔNG VIỆC (TASKS) & TIẾN ĐỘ
-- ============================================================

-- Bảng Nhiệm vụ được phân công trong nhóm
-- Nhóm trưởng tạo task và giao cho 1 hoặc nhiều thành viên
CREATE TABLE NhiemVu (
    MaNhiemVu        INT           IDENTITY(1,1) PRIMARY KEY, -- Mã nhiệm vụ (tự tăng)
    MaNhom           INT           NOT NULL,                  -- Nhóm sở hữu nhiệm vụ này (FK)
    MaDeTai          INT           NULL,                      -- Đề tài mà nhiệm vụ này bám sát (FK, có thể NULL)
    TenNhiemVu       NVARCHAR(255) NOT NULL,                  -- Tên / tiêu đề công việc
    MoTa             NVARCHAR(MAX) NULL,                      -- Mô tả chi tiết yêu cầu công việc
    NgayBatDau       DATETIME      NULL,                      -- Ngày bắt đầu thực hiện
    HanHoanThanh     DATETIME      NULL,                      -- Deadline hoàn thành
    MucDoUuTien      NVARCHAR(50)  NULL,                      -- Mức ưu tiên: Cao / Trung bình / Thấp
    TrangThai        NVARCHAR(50)  DEFAULT N'Chưa bắt đầu',   -- Trạng thái: Chưa bắt đầu / Đang thực hiện /Chờ duyệt/ Đã hoàn thành /Làm lại task/ Trễ hạn
    PhanTramHoanThanh INT          DEFAULT 0,                 -- Tiến độ hoàn thành (0 - 100%)
    NgayTao          DATETIME      DEFAULT GETDATE(),         -- Thời điểm tạo nhiệm vụ
    FOREIGN KEY (MaNhom)  REFERENCES Nhom(MaNhom),
    FOREIGN KEY (MaDeTai) REFERENCES DeTai(MaDeTai)
);

-- Bảng phân công nhiệm vụ cho thành viên
-- Cho phép 1 task giao cho NHIỀU người cùng lúc
CREATE TABLE PhanCongNhiemVu (
    MaNhiemVu   INT NOT NULL,                               -- Nhiệm vụ được phân công (FK)
    MaNguoiDung INT NOT NULL,                               -- Thành viên được giao việc (FK)
    PRIMARY KEY (MaNhiemVu, MaNguoiDung),
    FOREIGN KEY (MaNhiemVu)   REFERENCES NhiemVu(MaNhiemVu),
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung)
);

-- Bảng Lịch sử cập nhật tiến độ nhiệm vụ
-- Ghi lại mỗi lần thành viên hoặc nhóm trưởng thay đổi trạng thái / % hoàn thành
CREATE TABLE LichSuNhiemVu (
    MaLichSu          INT           IDENTITY(1,1) PRIMARY KEY, -- Mã bản ghi lịch sử (tự tăng)
    MaNhiemVu         INT           NOT NULL,                  -- Nhiệm vụ được cập nhật (FK)
    MaNguoiCapNhat    INT           NOT NULL,                  -- Người thực hiện cập nhật (FK)
    NgayCapNhat       DATETIME      DEFAULT GETDATE(),         -- Thời điểm cập nhật
    TrangThaiMoi      NVARCHAR(50)  NULL,                      -- Trạng thái mới sau khi cập nhật
    PhanTramMoi       INT           NULL,                      -- Phần trăm hoàn thành mới
    GhiChu            NVARCHAR(MAX) NULL,                      -- Ghi chú thêm về tình trạng thực hiện
    FOREIGN KEY (MaNhiemVu)      REFERENCES NhiemVu(MaNhiemVu),
    FOREIGN KEY (MaNguoiCapNhat) REFERENCES NguoiDung(MaNguoiDung)
);

-- ============================================================
-- CỤM 6: THẢO LUẬN NHÓM & TỆP ĐÍNH KÈM
-- ============================================================

-- Bảng Tin nhắn thảo luận trong nhóm
-- Hỗ trợ trả lời theo chuỗi (Thread) qua cột MaTinNhanCha
CREATE TABLE TinNhan (
    MaTinNhan      INT           IDENTITY(1,1) PRIMARY KEY,  -- Mã tin nhắn (tự tăng)
    MaNhom         INT           NOT NULL,                   -- Nhóm mà tin nhắn thuộc về (FK)
    MaNguoiGui     INT           NOT NULL,                   -- Người gửi tin nhắn (FK)
    NoiDung        NVARCHAR(MAX) NOT NULL,                   -- Nội dung tin nhắn
    ThoiGianGui    DATETIME      DEFAULT GETDATE(),          -- Thời gian gửi tin
    MaTinNhanCha   INT           NULL,                       -- Tin nhắn gốc (nếu đây là reply trong thread)
    FOREIGN KEY (MaNhom)       REFERENCES Nhom(MaNhom),
    FOREIGN KEY (MaNguoiGui)   REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaTinNhanCha) REFERENCES TinNhan(MaTinNhan)
);

-- Bảng Tệp đính kèm
-- Dùng chung cho 3 ngữ cảnh: đính kèm tin nhắn, nộp bài nhiệm vụ, tài liệu đề tài
CREATE TABLE TepDinhKem (
    MaTep          INT           IDENTITY(1,1) PRIMARY KEY, -- Mã tệp (tự tăng)
    MaTinNhan      INT           NULL,                      -- Nếu tệp đính kèm trong tin nhắn (FK, nullable)
    MaNhiemVu      INT           NULL,                      -- Nếu tệp là bài nộp cho nhiệm vụ (FK, nullable)
    MaDeTai        INT           NULL,                      -- Nếu tệp là tài liệu hướng dẫn của đề tài (FK, nullable)
    TenTep         NVARCHAR(255) NOT NULL,                  -- Tên hiển thị của tệp
    DuongDanTep    NVARCHAR(MAX) NOT NULL,                  -- Đường dẫn lưu trữ trên server / cloud
    DungLuong      INT           NULL,                      -- Dung lượng tệp (bytes) - dùng để so sánh với cấu hình MaxFileSizeMB
    MaNguoiUpload  INT           NULL,                      -- Người đã tải tệp lên (FK)
    NgayUpload     DATETIME      DEFAULT GETDATE(),         -- Thời điểm upload
    FOREIGN KEY (MaTinNhan)      REFERENCES TinNhan(MaTinNhan),
    FOREIGN KEY (MaNhiemVu)      REFERENCES NhiemVu(MaNhiemVu),
    FOREIGN KEY (MaDeTai)        REFERENCES DeTai(MaDeTai),
    FOREIGN KEY (MaNguoiUpload)  REFERENCES NguoiDung(MaNguoiDung)
);

-- Bảng Điểm số - Giảng viên nhập sau khi xem dashboard đóng góp
-- Lưu điểm nhóm và điểm thành phần của từng sinh viên trong từng lớp
CREATE TABLE DiemSo (
    MaDiem          INT             IDENTITY(1,1) PRIMARY KEY,  -- Mã điểm (tự tăng)
    MaSinhVien      INT             NOT NULL,                   -- Sinh viên được chấm điểm (FK)
    MaNhom          INT             NOT NULL,                   -- Nhóm sinh viên thuộc về (FK)
    MaLop           INT             NOT NULL,                   -- Lớp học (FK)
    DiemNhom        DECIMAL(4,2)    NULL,                       -- Điểm chung của cả nhóm (ví dụ: 8.5)
    DiemCaNhan      DECIMAL(4,2)    NULL,                       -- Điểm thành phần riêng của sinh viên này
    NhanXet         NVARCHAR(MAX)   NULL,                       -- Nhận xét của giảng viên về cá nhân
    MaGiangVien     INT             NOT NULL,                   -- Giảng viên thực hiện chấm điểm (FK)
    NgayCham        DATETIME        DEFAULT GETDATE(),          -- Thời điểm nhập điểm
    FOREIGN KEY (MaSinhVien)  REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaNhom)      REFERENCES Nhom(MaNhom),
    FOREIGN KEY (MaLop)       REFERENCES LopHoc(MaLop),
    FOREIGN KEY (MaGiangVien) REFERENCES NguoiDung(MaNguoiDung),
    UNIQUE (MaSinhVien, MaLop)  -- Mỗi sinh viên chỉ có 1 bản ghi điểm trong 1 lớp
);
GO

-- ============================================================
-- DỮ LIỆU MẪU BAN ĐẦU
-- ============================================================

-- 1. Vai trò người dùng
INSERT INTO VaiTro (TenVaiTro) VALUES 
    (N'Admin'),
    (N'Giảng viên'),
    (N'Sinh viên');

-- 2. Cấu hình hệ thống
INSERT INTO CauHinhHeThong (KhoaCauHinh, GiaTriCauHinh, MoTa) VALUES
    ('MaxFileSizeMB',      '20',                         N'Dung lượng file tối đa cho phép (MB)'),
    ('AllowedExtensions',  '.pdf,.docx,.zip,.jpg,.png',  N'Các định dạng file cho phép upload');

-- 3. Khoa
INSERT INTO Khoa (TenKhoa, KyHieuKhoa) VALUES
    (N'Công nghệ thông tin', 'CNTT'),
    (N'Kỹ thuật máy tính',  'KTMT'),
    (N'Hệ thống thông tin', 'HTTT');

-- 4. Lớp hành chính sinh viên
INSERT INTO LopSinhVien (MaLopSinhVien, TenLopSinhVien, MaKhoa, DangHoatDong) VALUES
    ('D20_TH01', 'D20_TH01', 1, 1),
    ('D20_TH02', 'D20_TH02', 1, 1),
    ('D21_TH01', 'D21_TH01', 1, 1),
    ('D21_TH02', 'D21_TH02', 1, 1),
    ('D21_TH03', 'D21_TH03', 1, 1),
    ('D21_TH04', 'D21_TH04', 1, 1),
    ('D21_TH05', 'D21_TH05', 1, 1),
    ('D21_TH06', 'D21_TH06', 1, 1),
    ('D21_TH09', 'D21_TH09', 1, 1),
    ('D22_TH01', 'D22_TH01', 1, 1),
    ('D22_TH02', 'D22_TH02', 1, 1),
    ('D22_TH03', 'D22_TH03', 1, 1),
    ('D22_TH04', 'D22_TH04', 1, 1),
    ('D22_TH05', 'D22_TH05', 1, 1),
    ('D23_TH01', 'D23_TH01', 1, 1),
    ('D23_TH02', 'D23_TH02', 1, 1),
    ('D23_TH03', 'D23_TH03', 1, 1),
    ('D23_TH04', 'D23_TH04', 1, 1),
    ('D23_TH05', 'D23_TH05', 1, 1);

-- 5. Học kỳ hiện tại
INSERT INTO HocKy (TenHocKy, NgayBatDau, NgayKetThuc, LaHienTai) VALUES
    (N'Học kỳ 2 2025-2026', '2026-01-01', '2026-06-30', 1);

-- ============================================================
-- TÀI KHOẢN ADMIN
-- Mật khẩu gốc: Admin@123 (đã hash SHA-256 giả định, thực tế dùng BCrypt ở backend)
-- ============================================================
INSERT INTO NguoiDung (MaSo, TenDangNhap, MatKhauHash, HoTen, Email, MaKhoa, MaVaiTro, DangHoatDong)
VALUES (
    'ADMIN001',
    'admin',
    'hashed_Admin@123',   -- Thực tế: backend hash trước khi lưu
    N'Quản trị viên hệ thống',
    'admin@stu.edu.vn',
    NULL,                 -- Admin không gắn với Khoa cụ thể
    1,                    -- MaVaiTro = 1 (Admin)
    1
);

-- ============================================================
-- TÀI KHOẢN GIẢNG VIÊN (3 giảng viên mẫu)
-- Mật khẩu tạm thời sẽ được hệ thống tự sinh và gửi qua Email
-- ============================================================
INSERT INTO NguoiDung (MaSo, TenDangNhap, MatKhauHash, HoTen, Email, MaKhoa, MaVaiTro, NgaySinh, GioiTinh)
VALUES
    ('GV001', 'gv.nguyenvana',  'hashed_TempPass001', N'Nguyễn Văn A',    'gv001@stu.edu.vn',  1, 2, '1985-03-15', 1),
    ('GV002', 'gv.tranthib',    'hashed_TempPass002', N'Trần Thị B',      'gv002@stu.edu.vn',  2, 2, '1990-07-22', 0),
    ('GV003', 'gv.lehongc',     'hashed_TempPass003', N'Lê Hồng C',       'gv003@stu.edu.vn',  3, 2, '1988-11-05', 1);

-- ============================================================
-- TÀI KHOẢN SINH VIÊN (100 sinh viên từ file dssv_mau.xlsx)
-- Username = mã sinh viên (viết thường)
-- Email = mã sinh viên + @student.stu.edu.vn
-- MaVaiTro = 3 (Sinh viên), MaKhoa = 1 (CNTT - mặc định)
-- ============================================================
INSERT INTO NguoiDung (MaSo, TenDangNhap, MatKhauHash, HoTen, Email, MaKhoa, MaVaiTro, LopSinhVien, DangHoatDong)
VALUES
('DH52200320','dh52200320','hashed_TempPass',N'Đặng Võ Phương Anh',    'DH52200320@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52300086','dh52300086','hashed_TempPass',N'Trần Quốc Anh',         'DH52300086@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52300101','dh52300101','hashed_TempPass',N'Dương Hoàng Ân',        'DH52300101@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52300141','dh52300141','hashed_TempPass',N'Hồ Gia Bảo',            'DH52300141@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52200360','dh52200360','hashed_TempPass',N'Lâm Quốc Bảo',          'DH52200360@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52200362','dh52200362','hashed_TempPass',N'Mông Quyền Gia Bảo',    'DH52200362@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52200377','dh52200377','hashed_TempPass',N'Trần Quốc Bảo',         'DH52200377@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52300129','dh52300129','hashed_TempPass',N'Bùi Công Bằng',         'DH52300129@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52102314','dh52102314','hashed_TempPass',N'Tống Thanh Bình',        'DH52102314@student.stu.edu.vn',1,3,'D21_TH01',1),
('DH52300204','dh52300204','hashed_TempPass',N'Huỳnh Tuấn Cảnh',       'DH52300204@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52300203','dh52300203','hashed_TempPass',N'Trang Hồng Cẩm',        'DH52300203@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52200422','dh52200422','hashed_TempPass',N'Lâm Đoàn Việt Cường',   'DH52200422@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52110674','dh52110674','hashed_TempPass',N'Nguyễn Trần Ngọc Diễm', 'DH52110674@student.stu.edu.vn',1,3,'D21_TH02',1),
('DH52300249','dh52300249','hashed_TempPass',N'Đặng Chí Dũng',         'DH52300249@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52300256','dh52300256','hashed_TempPass',N'Lê Trí Dũng',           'DH52300256@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52200539','dh52200539','hashed_TempPass',N'Phạm Quang Dũng',       'DH52200539@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52004120','dh52004120','hashed_TempPass',N'Hỷ Văn Đạt',            'DH52004120@student.stu.edu.vn',1,3,'D20_TH01',1),
('DH52300409','dh52300409','hashed_TempPass',N'Nguyễn Phát Đạt',       'DH52300409@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52300435','dh52300435','hashed_TempPass',N'Trần Tiến Đạt',         'DH52300435@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52100015','dh52100015','hashed_TempPass',N'Hoàng Văn Đức',         'DH52100015@student.stu.edu.vn',1,3,'D21_TH03',1),
('DH52300454','dh52300454','hashed_TempPass',N'Lê Quang Giàu',         'DH52300454@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52103503','dh52103503','hashed_TempPass',N'Nguyễn Phạm Duy Hải',   'DH52103503@student.stu.edu.vn',1,3,'D21_TH04',1),
('DH52103781','dh52103781','hashed_TempPass',N'Nguyễn Nhật Hào',       'DH52103781@student.stu.edu.vn',1,3,'D21_TH05',1),
('DH52200646','dh52200646','hashed_TempPass',N'Trần Minh Hảo',         'DH52200646@student.stu.edu.vn',1,3,'D22_TH05',1),
('DH52110884','dh52110884','hashed_TempPass',N'Nguyễn Trọng Hiền',     'DH52110884@student.stu.edu.vn',1,3,'D21_TH06',1),
('DH52100311','dh52100311','hashed_TempPass',N'Đặng Ngọc Hiếu',        'DH52100311@student.stu.edu.vn',1,3,'D21_TH01',1),
('DH52101717','dh52101717','hashed_TempPass',N'Lê Minh Hiếu',          'DH52101717@student.stu.edu.vn',1,3,'D21_TH02',1),
('DH52300591','dh52300591','hashed_TempPass',N'Võ Văn Hoài',           'DH52300591@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52300654','dh52300654','hashed_TempPass',N'Đỗ Minh Huy',           'DH52300654@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52108356','dh52108356','hashed_TempPass',N'Hoàng Gia Huy',         'DH52108356@student.stu.edu.vn',1,3,'D21_TH04',1),
('DH52300718','dh52300718','hashed_TempPass',N'Trần Nguyễn Anh Huy',   'DH52300718@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52300720','dh52300720','hashed_TempPass',N'Trần Quang Huy',        'DH52300720@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52200809','dh52200809','hashed_TempPass',N'Trần Trường Huy',       'DH52200809@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52200812','dh52200812','hashed_TempPass',N'Võ Khắc Huy',           'DH52200812@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52200755','dh52200755','hashed_TempPass',N'Huỳnh Lê Thu Hương',    'DH52200755@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52300628','dh52300628','hashed_TempPass',N'Trần Phú Hữu',          'DH52300628@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52200832','dh52200832','hashed_TempPass',N'Đinh Tấn Khang',        'DH52200832@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52200861','dh52200861','hashed_TempPass',N'Trần Thới Khanh',       'DH52200861@student.stu.edu.vn',1,3,'D22_TH05',1),
('DH52300918','dh52300918','hashed_TempPass',N'Tăng Dương Đình Khôi',  'DH52300918@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52300935','dh52300935','hashed_TempPass',N'Phạm Trần Trung Kiên',  'DH52300935@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52200944','dh52200944','hashed_TempPass',N'Dương Tuấn Kiệt',       'DH52200944@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52301080','dh52301080','hashed_TempPass',N'Nguyễn Thanh Hoàng Phi Long','DH52301080@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52200991','dh52200991','hashed_TempPass',N'Bùi Đỗ Phúc Lộc',      'DH52200991@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52200993','dh52200993','hashed_TempPass',N'Đặng Phước Lộc',        'DH52200993@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52301100','dh52301100','hashed_TempPass',N'Phan Văn Minh Luân',    'DH52301100@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52301200','dh52301200','hashed_TempPass',N'Nguyễn Hoàng Nam',      'DH52301200@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52301202','dh52301202','hashed_TempPass',N'Nguyễn Khắc Nam',       'DH52301202@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52301280','dh52301280','hashed_TempPass',N'Trương Nguyễn Tuấn Ngọc','DH52301280@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52301324','dh52301324','hashed_TempPass',N'Nguyễn Thái Nguyên',    'DH52301324@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52201138','dh52201138','hashed_TempPass',N'Lê Thành Nhân',         'DH52201138@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52201160','dh52201160','hashed_TempPass',N'Phạm Yến Nhi',          'DH52201160@student.stu.edu.vn',1,3,'D22_TH05',1),
('DH52203931','dh52203931','hashed_TempPass',N'Trần Ngọc Khánh Như',   'DH52203931@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52301477','dh52301477','hashed_TempPass',N'Nguyễn Tấn Phát',       'DH52301477@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52301482','dh52301482','hashed_TempPass',N'Nguyễn Văn Phát',       'DH52301482@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52105157','dh52105157','hashed_TempPass',N'Nguyễn Phú',            'DH52105157@student.stu.edu.vn',1,3,'D21_TH05',1),
('DH52301542','dh52301542','hashed_TempPass',N'Lê Hoàng Phúc',         'DH52301542@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52301557','dh52301557','hashed_TempPass',N'Nguyễn Văn Phúc',       'DH52301557@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52301562','dh52301562','hashed_TempPass',N'Trần Nguyễn Minh Phúc', 'DH52301562@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52105381','dh52105381','hashed_TempPass',N'Trần Huỳnh Tuấn Phương','DH52105381@student.stu.edu.vn',1,3,'D21_TH06',1),
('DH52301601','dh52301601','hashed_TempPass',N'Nguyễn Duy Quang',      'DH52301601@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52301606','dh52301606','hashed_TempPass',N'Trần Dương Quang',      'DH52301606@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52301629','dh52301629','hashed_TempPass',N'Tống Minh Quân',        'DH52301629@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52201334','dh52201334','hashed_TempPass',N'Phan Gia Quý',          'DH52201334@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52201348','dh52201348','hashed_TempPass',N'Lê Thị Mỹ Quỳnh',      'DH52201348@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52301652','dh52301652','hashed_TempPass',N'Nguyễn Thị Mỹ Quỳnh',  'DH52301652@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52201351','dh52201351','hashed_TempPass',N'Lê Văn Sắc',            'DH52201351@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52201374','dh52201374','hashed_TempPass',N'Phạm Văn Sơn',          'DH52201374@student.stu.edu.vn',1,3,'D22_TH05',1),
('DH52301721','dh52301721','hashed_TempPass',N'Đỗ Tấn Tài',            'DH52301721@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52111688','dh52111688','hashed_TempPass',N'Nguyễn Mạnh Tài',       'DH52111688@student.stu.edu.vn',1,3,'D21_TH01',1),
('DH52301734','dh52301734','hashed_TempPass',N'Nguyễn Thành Tài',      'DH52301734@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52301752','dh52301752','hashed_TempPass',N'Hoàng Thị Mỹ Tâm',     'DH52301752@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52203933','dh52203933','hashed_TempPass',N'Nguyễn Khai Tâm',       'DH52203933@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52301770','dh52301770','hashed_TempPass',N'Trịnh Duy Tân',         'DH52301770@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52201448','dh52201448','hashed_TempPass',N'Ngô Kiến Thanh',        'DH52201448@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52301814','dh52301814','hashed_TempPass',N'Nguyễn Phước Thành',    'DH52301814@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52201431','dh52201431','hashed_TempPass',N'Chung Nguyễn Quốc Thắng','DH52201431@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52301846','dh52301846','hashed_TempPass',N'Nguyễn Hữu Thiện',      'DH52301846@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52105095','dh52105095','hashed_TempPass',N'Nguyễn Cảnh Thịnh',     'DH52105095@student.stu.edu.vn',1,3,'D21_TH02',1),
('DH52301884','dh52301884','hashed_TempPass',N'Tô Duy Phúc Thịnh',     'DH52301884@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52201507','dh52201507','hashed_TempPass',N'Trần Ngọc Thịnh',       'DH52201507@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52201512','dh52201512','hashed_TempPass',N'Nguyễn Nhựt Thoại',     'DH52201512@student.stu.edu.vn',1,3,'D22_TH05',1),
('DH52301866','dh52301866','hashed_TempPass',N'Nguyễn Tấn Thống',      'DH52301866@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52006207','dh52006207','hashed_TempPass',N'Huỳnh Hồng Thuyên',     'DH52006207@student.stu.edu.vn',1,3,'D20_TH02',1),
('DH52301830','dh52301830','hashed_TempPass',N'Hàng Minh Thức',        'DH52301830@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52301984','dh52301984','hashed_TempPass',N'Lê Minh Tiến',          'DH52301984@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52111901','dh52111901','hashed_TempPass',N'Đào Đăng Đức Toàn',     'DH52111901@student.stu.edu.vn',1,3,'D21_TH03',1),
('DH52302040','dh52302040','hashed_TempPass',N'Hà Thị Huỳnh Trang',    'DH52302040@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52302074','dh52302074','hashed_TempPass',N'Nguyễn Ngọc Bảo Trân',  'DH52302074@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52302090','dh52302090','hashed_TempPass',N'Lê Minh Trí',           'DH52302090@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52201624','dh52201624','hashed_TempPass',N'Mai Hữu Trí',           'DH52201624@student.stu.edu.vn',1,3,'D22_TH01',1),
('DH52302101','dh52302101','hashed_TempPass',N'Phan Minh Trí',         'DH52302101@student.stu.edu.vn',1,3,'D23_TH02',1),
('DH52302505','dh52302505','hashed_TempPass',N'Nguyễn Trần Trọng',     'DH52302505@student.stu.edu.vn',1,3,'D23_TH03',1),
('DH52302391','dh52302391','hashed_TempPass',N'Trần Đình Trọng',       'DH52302391@student.stu.edu.vn',1,3,'D23_TH04',1),
('DH52302228','dh52302228','hashed_TempPass',N'Trần Hoàng Tuấn',       'DH52302228@student.stu.edu.vn',1,3,'D23_TH05',1),
('DH52201723','dh52201723','hashed_TempPass',N'Võ Anh Tuấn',           'DH52201723@student.stu.edu.vn',1,3,'D22_TH02',1),
('DH52201741','dh52201741','hashed_TempPass',N'Phạm Minh Tuyến',       'DH52201741@student.stu.edu.vn',1,3,'D22_TH03',1),
('DH52102853','dh52102853','hashed_TempPass',N'Dương Lê Văn',          'DH52102853@student.stu.edu.vn',1,3,'D21_TH04',1),
('DH52302292','dh52302292','hashed_TempPass',N'Đoàn Quốc Vinh',        'DH52302292@student.stu.edu.vn',1,3,'D23_TH01',1),
('DH52201776','dh52201776','hashed_TempPass',N'Nguyễn Long Vũ',        'DH52201776@student.stu.edu.vn',1,3,'D22_TH04',1),
('DH52302337','dh52302337','hashed_TempPass',N'Chu Phú Quốc Vương',    'DH52302337@student.stu.edu.vn',1,3,'D23_TH02',1);


GO

PRINT N'=== Khởi tạo Database QuanLyLopHocDB thành công! ===';
PRINT N'Đã tạo: 11 bảng chính, 1 Admin, 3 Giảng viên, 100 Sinh viên';
PRINT N'Lưu ý: Cột MatKhauHash cần được backend hash thực tế bằng BCrypt trước khi lưu!';

-- ============================================================
-- 3 TÀI KHOẢN TEST (TẠO THÊM THEO YÊU CẦU)
-- ============================================================
INSERT INTO NguoiDung (MaSo, TenDangNhap, MatKhauHash, HoTen, Email, MaKhoa, MaVaiTro, LopSinhVien, DangHoatDong)
VALUES
('ADMIN999', 'admin_test', '123456', N'Tài khoản Admin Test', 'admin_test@stu.edu.vn', NULL, 1, NULL, 1),
('GV999', 'gv_test', '123456', N'Tài khoản Giảng viên Test', 'gv_test@stu.edu.vn', 1, 2, NULL, 1),
('SV999', 'sv_test', '123456', N'Tài khoản Sinh viên Test', 'sv_test@student.stu.edu.vn', 1, 3, 'D21_TH09', 1);

