THIẾT KẾ DATABASE

Hệ thống Quản lý Lớp học - Module Làm việc nhóm

Người viết tài liệu : Phan Nhựt Hào

# 9.1 Sơ đồ thực thể - mối liên kết (ERD)

# 9.2 Mô tả chi tiết các thực thể

## 9.2.1 Bảng CauHinhHeThong (Cấu hình hệ thống)

Mô tả: Lưu các tham số cấu hình kỹ thuật của hệ thống.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| KhoaCauHinh | varchar(50) | x |  | x | Tên khóa cấu hình |
| GiaTriCauHinh | nvarchar(max) |  |  | x | Giá trị tương ứng |
| MoTa | nvarchar(255) |  |  |  | Mô tả ý nghĩa của cấu hình |


## 9.2.2 Bảng Khoa (Khoa / Ngành đào tạo)

Mô tả: Bảng danh sách Khoa / Ngành đào tạo.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaKhoa | int | x |  | x | Mã khoa (Tự tăng) |
| TenKhoa | nvarchar(100) |  |  | x | Tên đầy đủ của khoa |
| KyHieuKhoa | varchar(20) |  | x |  | Ký hiệu viết tắt |


## 9.2.3 Bảng LopSinhVien (Lớp hành chính)

Mô tả: Bảng danh sách lớp hành chính của sinh viên.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaLopSinhVien | varchar(50) | x |  | x | Mã lớp hành chính |
| TenLopSinhVien | varchar(50) |  | x | x | Tên lớp hành chính |
| MaKhoa | int | FK |  |  | Khoa quản lý lớp |
| DangHoatDong | bit |  |  |  | Trạng thái hoạt động |


## 9.2.4 Bảng HocKy (Học kỳ / Niên khóa)

Mô tả: Bảng Học kỳ / Niên khóa.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaHocKy | int | x |  | x | Mã học kỳ (Tự tăng) |
| TenHocKy | nvarchar(50) |  |  | x | Tên học kỳ |
| NgayBatDau | date |  |  |  | Ngày bắt đầu học kỳ |
| NgayKetThuc | date |  |  |  | Ngày kết thúc học kỳ |
| LaHienTai | bit |  |  |  | Đánh dấu học kỳ hiện tại |


## 9.2.5 Bảng VaiTro (Vai trò người dùng)

Mô tả: Bảng vai trò người dùng trong hệ thống (Admin, Giảng viên, Sinh viên).

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaVaiTro | int | x |  | x | Mã vai trò (Tự tăng) |
| TenVaiTro | nvarchar(50) |  |  | x | Tên vai trò |


## 9.2.6 Bảng NguoiDung (Tài khoản người dùng)

Mô tả: Bảng tài khoản người dùng (dùng chung cho Admin, GV, SV).

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaNguoiDung | int | x |  | x | Mã người dùng (Tự tăng) |
| MaSo | varchar(20) |  | x | x | Mã định danh (MSSV, MSGV) |
| TenDangNhap | varchar(50) |  | x | x | Tên đăng nhập |
| MatKhauHash | varchar(255) |  |  | x | Mật khẩu đã mã hóa |
| HoTen | nvarchar(100) |  |  | x | Họ và tên đầy đủ |
| NgaySinh | date |  |  |  | Ngày sinh |
| GioiTinh | bit |  |  |  | Giới tính (1=Nam, 0=Nữ) |
| SoDienThoai | varchar(20) |  |  |  | Số điện thoại |
| Email | varchar(100) |  | x |  | Email |
| DiaChi | nvarchar(255) |  |  |  | Địa chỉ |
| AnhDaiDien | nvarchar(max) |  |  |  | Đường dẫn ảnh |
| MaKhoa | int | FK |  |  | Mã khoa |
| MaVaiTro | int | FK |  | x | Mã vai trò |
| LopSinhVien | varchar(50) | FK |  |  | Lớp hành chính |
| DangHoatDong | bit |  |  |  | Trạng thái hoạt động |


## 9.2.7 Bảng LopHoc (Lớp học môn học)

Mô tả: Bảng Lớp học môn học do Giảng viên tạo.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaLop | int | x |  | x | Mã lớp học (Tự tăng) |
| MaLopHoc | varchar(20) |  | x | x | Mã tham gia lớp |
| TenLop | nvarchar(100) |  |  | x | Tên lớp / môn học |
| MaGiangVien | int | FK |  | x | Mã giảng viên phụ trách |
| MaHocKy | int | FK |  | x | Mã học kỳ |
| NgayBatDau | date |  |  |  | Ngày bắt đầu |
| NgayKetThuc | date |  |  |  | Ngày kết thúc |
| ThoiGianHoc | nvarchar(255) |  |  |  | Lịch học |
| ChoPhepDangKyNhom | bit |  |  |  | Trạng thái chốt nhóm |


## 9.2.8 Bảng SinhVienLop (Sinh viên - Lớp học)

Mô tả: Bảng liên kết Sinh viên với Lớp học (N-N).

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaLop | int | x/FK |  | x | Mã lớp học |
| MaSinhVien | int | x/FK |  | x | Mã sinh viên |


## 9.2.9 Bảng DeTai (Đề tài môn học)

Mô tả: Bảng Đề tài / Chủ đề môn học do Giảng viên tạo.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaDeTai | int | x |  | x | Mã đề tài (Tự tăng) |
| TenDeTai | nvarchar(255) |  |  | x | Tên đề tài |
| MoTa | nvarchar(max) |  |  |  | Mô tả yêu cầu |
| SanPhamKyVong | nvarchar(max) |  |  |  | Sản phẩm kỳ vọng |
| MaLop | int | FK |  | x | Mã lớp học |
| PhuongThucGiao | nvarchar(50) |  |  |  | Tự do/Chỉ định |


## 9.2.10 Bảng Nhom (Nhóm học tập)

Mô tả: Bảng Nhóm học tập trong mỗi lớp.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaNhom | int | x |  | x | Mã nhóm (Tự tăng) |
| TenNhom | nvarchar(100) |  |  | x | Tên nhóm |
| SoThanhVienToiDa | int |  |  |  | Sĩ số tối đa |
| MaLop | int | FK |  | x | Mã lớp học |
| MaNhomTruong | int | FK |  |  | Mã nhóm trưởng |
| MaDeTai | int | FK |  |  | Mã đề tài |


## 9.2.11 Bảng ThanhVienNhom (Thành viên nhóm)

Mô tả: Bảng liên kết Sinh viên với Nhóm (N-N).

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaNhom | int | x/FK |  | x | Mã nhóm |
| MaSinhVien | int | x/FK |  | x | Mã sinh viên |


## 9.2.12 Bảng YeuCauChuyenNhom (Yêu cầu chuyển nhóm)

Mô tả: Lưu yêu cầu chuyển nhóm của sinh viên.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaYeuCau | int | x |  | x | Mã yêu cầu (Tự tăng) |
| MaSinhVien | int | FK |  | x | Mã sinh viên |
| MaNhomHienTai | int | FK |  | x | Mã nhóm cũ |
| MaNhomMuon | int | FK |  | x | Mã nhóm mới |
| TrangThai | nvarchar(50) |  |  |  | Chờ duyệt/Đã duyệt |


## 9.2.13 Bảng NhiemVu (Nhiệm vụ / Task)

Mô tả: Nhiệm vụ được phân công trong nhóm.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaNhiemVu | int | x |  | x | Mã nhiệm vụ (Tự tăng) |
| MaNhom | int | FK |  | x | Mã nhóm |
| TenNhiemVu | nvarchar(255) |  |  | x | Tên công việc |
| TrangThai | nvarchar(50) |  |  |  | Trạng thái |
| PhanTramHoanThanh | int |  |  |  | Tiến độ (%) |


## 9.2.14 Bảng PhanCongNhiemVu (Phân công nhiệm vụ)

Mô tả: Bảng phân công nhiệm vụ cho thành viên.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaNhiemVu | int | x/FK |  | x | Mã nhiệm vụ |
| MaNguoiDung | int | x/FK |  | x | Mã thành viên |


## 9.2.15 Bảng LichSuNhiemVu (Lịch sử cập nhật)

Mô tả: Lịch sử cập nhật tiến độ / trạng thái nhiệm vụ.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaLichSu | int | x |  | x | Mã lịch sử (Tự tăng) |
| MaNhiemVu | int | FK |  | x | Mã nhiệm vụ |
| TrangThaiMoi | nvarchar(50) |  |  |  | Trạng thái mới |
| PhanTramMoi | int |  |  |  | Phần trăm mới |


## 9.2.16 Bảng TinNhan (Tin nhắn thảo luận)

Mô tả: Tin nhắn thảo luận trong nhóm.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaTinNhan | int | x |  | x | Mã tin nhắn (Tự tăng) |
| MaNhom | int | FK |  | x | Mã nhóm |
| MaNguoiGui | int | FK |  | x | Mã người gửi |
| NoiDung | nvarchar(max) |  |  | x | Nội dung tin nhắn |


## 9.2.17 Bảng TepDinhKem (Tệp đính kèm)

Mô tả: Tệp đính kèm dùng cho tin nhắn, bài nộp, đề tài.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaTep | int | x |  | x | Mã tệp (Tự tăng) |
| MaTinNhan | int | FK |  |  | Mã tin nhắn |
| MaNhiemVu | int | FK |  |  | Mã nhiệm vụ |
| MaDeTai | int | FK |  |  | Mã đề tài |
| TenTep | nvarchar(255) |  |  | x | Tên tệp hiển thị |
| DuongDanTep | nvarchar(max) |  |  | x | Đường dẫn lưu trữ |


## 9.2.18 Bảng DiemSo (Điểm số)

Mô tả: Điểm số của sinh viên do giảng viên chấm.

| Thuộc tính | Kiểu | Key | Unique | Mandatory | Diễn giải |
| --- | --- | --- | --- | --- | --- |
| MaDiem | int | x |  | x | Mã điểm (Tự tăng) |
| MaSinhVien | int | FK | x | x | Mã sinh viên |
| MaLop | int | FK | x | x | Mã lớp học |
| DiemNhom | decimal(4,2) |  |  |  | Điểm nhóm |
| DiemCaNhan | decimal(4,2) |  |  |  | Điểm cá nhân |

