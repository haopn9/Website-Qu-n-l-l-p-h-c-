**TÀI LIỆU ĐẶC TẢ**

**GIAO DIỆN NGƯỜI DÙNG (UI/UX)**

*Website quản lý Lớp học – Module: Quản lý nhóm*

Nhóm thực hiện: Nhóm 2

Người viết tài liệu: Phan Nhựt Hào

# 1. THÔNG TIN TÀI LIỆU

## 1.1 Mục đích tài liệu

Tài liệu này mô tả đặc tả giao diện người dùng (UI/UX) của Website quản lý lớp học và nhóm học tập do Nhóm 2 xây dựng. Tài liệu phục vụ cho việc phát triển, kiểm thử và bàn giao sản phẩm.

## 1.2 Phạm vi hệ thống

Hệ thống được xây dựng trên nền tảng web, hỗ trợ ba nhóm người dùng chính:

Sinh viên: Xem lớp học, quản lý nhóm, theo dõi nhiệm vụ và thảo luận

Giảng viên: Quản lý lớp, chủ đề, nhóm và theo dõi tiến độ sinh viên

Admin: Quản lý hệ thống, người dùng, lớp học và khoa/phòng ban

# 2. Trang chủ

## 2.1 Tổng quan

| Thuộc tính | Giá trị |
| --- | --- |
| Tên màn hình | Trang chủ |
| Đường dẫn (URL) | / |
| Vai trò truy cập | Tất cả người dùng (chưa đăng nhập) |
| Mục đích | Giới thiệu hệ thống và điều hướng người dùng đến trang đăng nhập |


## 2.2 Hình ảnh minh họa tổng thể

## 2.3 Ngôn ngữ thiết kế và Màu sắc

Trang chủ sử dụng phong cách Dark Mode hiện đại với hiệu ứng ánh sáng radial gradient.

| Thành phần | Giá trị / Thuộc tính CSS |
| --- | --- |
| Màu nền (Background) | Radial Gradient (#1a237e -> #0a0e14) |
| Màu chữ chính | White (#ffffff) |
| Màu nhấn (Accent) | Blue (#0081ff) |
| Phông chữ (Typography) | Inter, sans-serif |
| Hiệu ứng tương tác | Transition: 0.3s ease cho các liên kết và nút. |


## 2.4 Cấu trúc bố cục (Layout)

Giao diện được chia thành 4 phân vùng chính theo chiều dọc (Vertical Stack):

**Navbar (Thanh điều hướng): **Cố định phía trên, chứa Logo, Menu và nút Đăng nhập.

**Hero Section (Khu vực trọng tâm): **Chứa thông điệp chính, Badge và nút kêu gọi hành động (CTA).

**App Preview (Xem trước ứng dụng): **Khối hiển thị hình ảnh minh họa giao diện phần mềm bên trong.

**Footer (Chân trang): **Hệ thống liên kết thông tin chia làm 3 cột.

## 2.5 Chi tiết các thành phần UI

### 2.5.1 Navbar

Logo: Văn bản "Nhóm 2", font-weight: bold, cỡ 24px.

Nav-links: Gồm Trang chủ, Giải pháp, Giới thiệu. Có hiệu ứng đổi màu sang #0081ff khi hover.

Nút Đăng nhập: Nền xanh #0081ff, bo góc 20px. Hiệu ứng hover: Đậm màu và nẩy nhẹ (translateY).

### 2.5.2 Hero Section

Badge: Văn bản "Hãy làm việc hiệu quả hơn", nền trong suốt có viền mờ (rgba 255, 0.2).

Tiêu đề (H1): Cỡ chữ 48px, căn giữa, tối đa chiều rộng 700px.

Nút Bắt đầu ngay: Nền xanh, bo góc 25px, có đổ bóng phát sáng (box-shadow) khi hover.

### 2.5.3 App Preview & Footer

App Preview: Container nền trắng, bo góc phía trên 20px để tạo sự tách biệt với nền tối.

Footer: Chia làm 3 cột (Công ty, Sản phẩm, Tài nguyên) với lưới (grid) 3 cột đều nhau.

## 2.5 Logic chuyển trang (Routing)

Dựa trên file App.js, các liên kết điều hướng như sau:

| Thành phần nhấn | Đường dẫn (Path) |
| --- | --- |
| Nút Đăng nhập (Navbar) | /login |
| Nút Bắt đầu ngay (Hero) | /login |
| Tuyến đường mặc định | / |


# 3. Trang đăng nhập

## 3.1 Tổng quan

| Thuộc tính | Giá trị |
| --- | --- |
| Tên màn hình | Trang đăng nhập |
| Đường dẫn (URL) | /login |
| Vai trò truy cập | Tất cả người dùng (chưa đăng nhập) |
| Mục đích | Người dung đăng nhập vào trang web |


## 3.2 Hình ảnh minh họa tổng thể

## 3.3 Tổng quan bố cục

Giao diện trang Đăng nhập sử dụng cấu trúc chia đôi (Split Layout) với tỷ lệ 1.2 : 0.8.

| Phần | Nội dung & Đặc điểm |
| --- | --- |
| Bên trái (Login Left) | Chiếm 60% chiều rộng. Nền trắng xám (#f0f2ff). Chứa form đăng nhập tập trung vào trải nghiệm người dùng. |
| Bên phải (Login Right) | Chiếm 40% chiều rộng. Nền xanh nhạt (#b2b9ff). Chứa hình ảnh minh họa (Laptop Illustration) và các họa tiết trang trí (Blob). |


## 3.4 Chi tiết các thành phần Form

### 3.4.1 Liên kết quay lại (Back Link)

Vị trí: Phía trên cùng bên trái form.
Icon: FaArrowLeft.
Hiệu ứng: Chuyển sang màu xanh #0081ff khi hover.

### 3.4.2 Các trường nhập liệu (Input Groups)

Cấu trúc chung: Label (20px, bold) nằm trên ô Input.
Ô nhập liệu: Viền bo tròn (30px), padding rộng (14px 25px) tạo cảm giác hiện đại.

**Tên đăng nhập: **Loại text. Hiển thị thông báo lỗi "Vui lòng nhập tên đăng nhập" nếu để trống sau khi chạm vào.

**Mật khẩu: **Mặc định ẩn (type=password). Có icon "Con mắt" (FaEye/FaEyeSlash) ở góc phải để chuyển đổi chế độ xem. Có liên kết "Quên mật khẩu?" phía dưới.

### 3.4.3 Nút hành động (Login Button)

Màu sắc: Tím xanh (#7b89dd).
Đổ bóng: Box-shadow 0 4px 15px tạo độ nổi.
Trạng thái Vô hiệu hóa (Disabled): Chuyển sang màu xám (#cbd5e1) khi các trường đang trống hoặc đang trong quá trình gửi yêu cầu (loading).

## 3.5 Đặc tả Modal Quên mật khẩu

Modal sử dụng hiệu ứng Backdrop Blur (làm mờ nền) và hoạt ảnh Slide Up.

**Bước 1: Nhập Email: **Yêu cầu người dùng nhập Email để nhận mã OTP. Nút "Gửi mã" chỉ sáng khi đã nhập email.

**Bước 2: Xác thực OTP: **Ô nhập mã 6 chữ số. Tích hợp Timer đếm ngược (5 phút). Có chức năng "Gửi lại mã" nếu hết hạn.

**Bước 3: Đặt lại mật khẩu: **Giao diện bao gồm 2 ô nhập mật khẩu mới và bảng kiểm tra (Validation) thời gian thực.

### 3.5.1 Quy tắc bảo mật mật khẩu mới

Hệ thống kiểm tra 9 điều kiện bắt buộc, hiển thị dấu ✔ xanh nếu đạt:

Tối thiểu 8 ký tự

Có chữ hoa & chữ thường

Có chữ số

Có ký tự đặc biệt

Không có khoảng trắng

Mật khẩu nhập lại phải khớp

Không chứa tên user

Không trùng mật khẩu cũ

## 3.6 Xử lý thông báo lỗi

Lỗi Validation: Hiển thị chữ đỏ ngay dưới ô nhập liệu.

Lỗi API (Sai tài khoản/mật khẩu): Hiển thị trong một khung Alert nền hồng, viền đỏ phía trên nút Đăng nhập.

# 4 Trang Admin

## 4.1 Tổng quan

| Thuộc tính | Giá trị |
| --- | --- |
| Tên màn hình | Trang admin |
| Đường dẫn (URL) | /admin |
| Vai trò truy cập | Admin |
| Mục đích | Quản lý hệ thống, người dùng, lớp học và khoa/phòng ban |


## 4.2 Bố cục chung (AdminLayout)

Tất cả các trang Admin đều nằm trong một khung giao diện đồng nhất với Sidebar bên trái và Content bên phải.

### 4.2.1 Sidebar (Thanh điều hướng)

Thành phần:

Profile Admin: Hiển thị ảnh đại diện (tròn), Họ tên (Nguyễn Việt Anh) và vai trò "Quản trị viên".

Menu: Gồm 6 mục chính: Trang chính, Quản lý người dùng, Quản lý khoa, Quản lý lớp môn học, Cấu hình hệ thống, Hồ sơ cá nhân.

Hiệu ứng: Mục đang chọn sẽ có trạng thái "active" (đổi màu nền/chữ).

## 4.3 Đặc tả chi tiết các trang con

### 4.3.1 Trang chủ (Dashboard)

#### 4.3.1.1 Mô tả:

Tổng quan tình trạng hệ thống.

Thành phần chính:

Header: Lời chào và khung hiển thị "Học kỳ hiện tại" (màu xanh Indigo).

Stats Grid: 8 thẻ thống kê (Người dùng, GV, SV, Khoa, Lớp HC, Lớp môn học, Nhóm, Công việc) với màu sắc icon khác biệt.

Recent Classes: Hiển thị 3 lớp học mới nhất dưới dạng Card với nút "Xem chi tiết".

#### 4.3.1.2 Hình ảnh trang :

### 4.3.2 Quản lý người dùng (UserManagement)

#### 4.3.2.1 Giao diện chính:

Bảng dữ liệu (Data Table) chứa danh sách tài khoản.

Công cụ:

Toolbar: Nút Thêm người dùng (Xanh dương), Import Excel (Xanh lá).

Bộ lọc: Thanh tìm kiếm mã/tên và Dropdown lọc theo Vai trò (Admin/GV/SV).

Action: Sửa (Icon Edit) và Khóa/Mở khóa (Icon Lock/Unlock).

Modal: Form popup cho Thêm/Sửa tích hợp nút "Ngẫu nhiên" để sinh mật khẩu bảo mật.

#### 4.3.2.2 Hình ảnh :

### 4.3.3 Quản lý Khoa & Lớp sinh viên (DepartmentManagement)

#### 4.3.3.1 Bố cục:

Master-Detail (Cột trái danh sách Khoa - Cột phải chi tiết Khoa).

Tab nội dung (Cột phải):

Tab Lớp Hành chính: Quản lý danh sách lớp (Mã, Tên) thuộc khoa.

Tab Giảng viên/Sinh viên: Danh sách nhân sự thuộc khoa có chức năng tìm kiếm/lọc.

#### 4.3.3.2 Hình ảnh trang

### 4.3.4 Quản lý Lớp môn học & Nhóm (ClassManagement)

### 4.3.4.1 Giao diện

Giao diện Card Grid: Mỗi thẻ lớp hiển thị Mã lớp, GV, Học kỳ và sĩ số SV/Nhóm.

Trang chi tiết lớp:

Phần thống kê nhanh: 3 thẻ chỉ số (SV, Nhóm, Đề tài).

Danh sách Nhóm: Sử dụng cơ chế Accordion (Dropdown) để mở xem thành viên từng nhóm.

#### 4.3.4.2 Hình ảnh trang

### 4.3.5 Cấu hình hệ thống (SystemSettings)

#### 4.3.5.1 giao diện

Cấu hình File: Sử dụng thanh trượt (Range Slider) để chỉnh dung lượng và Tag Input để quản lý đuôi file (.pdf, .docx...).

Quản lý Học kỳ: Bảng danh sách năm học với nút "Đặt hiện tại" (Icon Star).

#### 4.3.5.2 hình ảnh

5. Trang giảng viên

## 5.1 Tổng quan

| Thuộc tính | Giá trị |
| --- | --- |
| Tên màn hình | Trang giảng viên |
| Đường dẫn (URL) | /teacher |
| Vai trò truy cập | Giảng viên |
| Mục đích | Giảng viên: Quản lý lớp, chủ đề, nhóm và theo dõi tiến độ sinh viên |


## 5.2 Đặc tả Bố cục chung (TeacherLayout)

Phân hệ giảng viên sử dụng cấu trúc Sidebar cố định bên trái và vùng nội dung Outlet bên phải.

### 5.2.1 Sidebar & Profile

Vùng Profile: Chứa ảnh đại diện tròn (Avatar), tên Giảng viên (font-weight: 700) và mã số giảng viên bên dưới.

Menu điều hướng: Danh sách liên kết với các icon tương ứng (FaHome, FaChalkboard, FaBookOpen, FaUsers, FaChartLine, FaUserEdit, FaSignOutAlt).

Trạng thái Hover: Các mục menu thay đổi màu nền hoặc độ đậm khi người dùng di chuột qua.

## 5.3 Đặc tả Trang chủ (Teacher Dashboard)

### 5.3.1 Giao diện

Dashboard cung cấp cái nhìn tổng thể về các lớp học phần và yêu cầu chờ xử lý.

#### 5.3.1.1 Thẻ thống kê nhanh (Quick Stats)

Hiển thị 4 thẻ chính với màu nền Pastel khác nhau:

Lớp đang dạy (Xanh dương): Tổng số lớp học phần đang phụ trách.

Tổng nhóm quản lý (Xanh lá): Số lượng nhóm sinh viên đã được tạo.

Nhiệm vụ trễ hạn (Đỏ): Cảnh báo các đầu việc quá deadline.

Yêu cầu chuyển nhóm (Cam): Số lượng yêu cầu sinh viên đang chờ duyệt.

#### 5.3.1.2 Tổng quan lớp học (Class Overview)

Sử dụng cơ chế Accordion để hiển thị danh sách nhóm bên trong từng lớp.

Thông tin hiển thị: Tên lớp, mã lớp, tiến độ tổng thể (ProgressBar), số lượng sinh viên/nhóm.

Cảnh báo: Badge đỏ hiển thị số lượng "Nhóm chưa có trưởng" để giảng viên lưu ý.

### 5.3.2 hình ảnh trang

## 5.4 Quản lý Lớp học (ManageClasses)

### 5.4.1 Giao diện

Mô tả: Giao diện quản trị các lớp học phần, hỗ trợ tìm kiếm và lọc theo học kỳ.

Bảng dữ liệu (Data Table):

Các cột: Mã lớp (Tag), Tên môn học (Bold), Học kỳ, Sĩ số, Số nhóm, Trạng thái (Badge).

Cột thao tác: Icon Xem chi tiết (Mắt), Chỉnh sửa (Bút chì), Xóa (Thùng rác).

Modal Chi tiết lớp: Hiển thị danh sách sinh viên bên trong, tích hợp nút "Import Excel" để thêm sinh viên hàng loạt.

### 5.4.2 Hình ảnh trang

## 5.5 Quản lý Nhóm học tập (ManageGroups)

### 5.5.1 giao diện

Mô tả: Giao diện tập trung vào việc điều phối nhóm và xử lý yêu cầu thay đổi nhóm.

#### 5.5.1.1 Tab Quản lý Nhóm

Giao diện Card Grid: Mỗi thẻ nhóm hiển thị tên nhóm, lớp học, tỉ lệ thành viên (ví dụ: 4/5).

Chức năng điều phối: Nút "Chốt danh sách nhóm" (để khóa đăng ký) và "Chỉ định trưởng" (icon Vương miện).

Nút "Phân nhóm ngẫu nhiên": Chức năng hỗ trợ chia các sinh viên chưa có nhóm vào nhóm tự động.

#### 5.5.1.2 Tab Xử lý yêu cầu chuyển nhóm

Dạng bảng: Liệt kê các yêu cầu của sinh viên gồm: Nhóm cũ, nhóm mới, lý do chuyển nhóm.

Modal xử lý: Cho phép giảng viên viết phản hồi và chọn "Đồng ý" (Xanh) hoặc "Từ chối" (Đỏ).

### 5.5.2 hình ảnh trang

## 5.6 Quản lý Đề tài (ManageTopics)

### 5.6.1 Giao diện

Mô tả: Giao diện quản lý kho đề tài và tài liệu hướng dẫn.

Thẻ đề tài (Topic Card):

Phần Header: Tên đề tài và các icon tác vụ (Giao bài, Sửa, Xóa).

Phần Body: Mô tả yêu cầu, thời gian thực hiện, sản phẩm kỳ vọng.

Phần Footer: Hiển thị nhóm đã được giao (nếu có) hoặc nhãn "Chưa giao nhóm".

Modal Giao đề tài: Cung cấp 2 lựa chọn "Chỉ định trực tiếp" (chọn nhóm từ danh sách) hoặc "Đăng ký tự do".

### 5.6.2 hình ảnh trang

## 5.7 Giám sát & Đánh giá (Tracking)

### 5.7.1 Giao diện

Đây là giao diện phức tạp nhất gồm 3 phân hệ giám sát:

#### 5.7.1.2 Tab Tiến độ nhóm (Progress)

Hiển thị biểu đồ tiến độ tổng thể của nhóm và thống kê trạng thái Task (Hoàn thành, Đang làm, Trễ hạn).

Danh sách cá nhân: Dropdown "Xem chi tiết nhiệm vụ" hiển thị các đầu việc cụ thể của từng sinh viên.

#### 5.7.1.3 Tab Giám sát thảo luận (Discussion)

Cấu trúc Split-view: Bên trái là danh sách nhóm, bên phải là khung Chat history.

Mô tả tin nhắn: Hiển thị Avatar (chữ cái đầu), tên người gửi, nội dung thảo luận và file đính kèm.

#### 5.7.1.4 Tab Đánh giá & Chấm điểm (Evaluation)

Bảng tổng hợp: Thống kê số lượng Task đã xong, tiến độ cá nhân và nhãn "Mức đóng góp" (Tích cực/Trung bình/Thấp).

Modal Chấm điểm: Cho phép nhập điểm tổng nhóm (0-10) và điểm riêng biệt cho từng thành viên.

### 5.7.2 hình ảnh trang

# 6 Trang sinh viên

## 6.1 Tổng quan

| Thuộc tính | Giá trị |
| --- | --- |
| Tên màn hình | Trang giảng viên |
| Đường dẫn (URL) | /student |
| Vai trò truy cập | Sinh viên |
| Mục đích | Xem lớp học, quản lý nhóm, theo dõi nhiệm vụ và thảo luận |


## 6.2 Đặc tả Bố cục chung (StudentLayout)

Phân hệ sinh viên sử dụng cấu trúc Sidebar (Khung xanh) bên trái và Main Content (Khung trắng) bên phải.

### 6.2.1 Sidebar & Profile

Thành phần:

Sidebar Profile: Chứa ảnh đại diện tròn, Họ tên sinh viên (font-weight: 700) và Mã số sinh viên.

Menu điều hướng: Gồm 7 mục chính: Trang chính, Hồ sơ cá nhân, Lớp học của tôi, Nhóm học tập, Nhiệm vụ & tiến độ, Không gian thảo luận, Điều phối nhóm (dành cho nhóm trưởng).

Icon: Sử dụng bộ FontAwesome (FaHome, FaBook, FaUsers, FaTasks, FaComments, FaSitemap, FaSignOutAlt).

## 6.3 Đặc tả Trang chủ (Student Dashboard)

### 6.3.1 giao diện

Dashboard là trung tâm thông báo và theo dõi tiến độ nhanh của sinh viên.

#### 6.3.1.1Thẻ thống kê (Quick Stats)

Lưới 4 thẻ thống kê với màu sắc Pastel:

Lớp đang học (Xanh dương), Nhóm tham gia (Xanh lá), Nhiệm vụ đang làm (Cam), Nhiệm vụ trễ hạn (Đỏ).

#### 6.3.1.2 Các khối thông tin (Info Cards)

My Tasks: Liệt kê nhiệm vụ cá nhân kèm ProgressBar và nhãn trạng thái (Trễ hạn, Đang làm).

Group Progress: Biểu đồ hình tròn hoặc thanh tiến độ tổng thể của nhóm.

Deadlines: Danh sách các mốc thời gian quan trọng sắp tới.

Activity Feed: Nhật ký hoạt động của nhóm (ai vừa nộp bài, ai vừa nhắn tin).

### 6.3.2 hình ảnh trang

## 6.4 Lớp học & Chi tiết lớp học

### 6.4.1 giao diện

#### 6.4.1.1 Màn hình Lớp học (StudentClasses)

Chức năng "Tham gia lớp": Nút mở Modal nhập "Mã lớp" (Class Code).

Class Card: Hiển thị tên môn, giảng viên, học kỳ và màu sắc nhận diện riêng cho từng lớp.

Group Card: Hiển thị thông tin nhóm hiện tại của sinh viên trong lớp đó.

#### 6.4.1.2 hình ảnh màn hình

#### 6.4.1.3 Chi tiết lớp (StudentClassDetail)

Hero Section: Hiển thị tên lớp nổi bật trên nền màu chủ đạo của lớp.

Hệ thống Tab:

Thông tin lớp: Mô tả môn học, đề cương.

Sinh viên: Bảng danh sách bạn học cùng lớp.

Nhóm: Danh sách các nhóm đã hình thành trong lớp.

Đề tài: Danh sách các đề tài mà giảng viên đã công bố.

#### 6.4.1.4 hình ảnh màn hình

## 6.5 Nhiệm vụ & Tiến độ (StudentTasks)

### 6.5.1 giao diện

Phân loại xem: Gồm 2 tab chính "Nhiệm vụ của tôi" và "Nhiệm vụ nhóm".

Bộ lọc (Filter Bar): Lọc theo học kỳ, trạng thái (Đang làm, Đã xong, Trễ hạn) và mức độ ưu tiên (Cao, Trung bình, Thấp).

Task Card: Hiển thị tên nhiệm vụ, tên nhóm, deadline và nút "Nộp bài".

Modal Nộp bài: Giao diện cho phép sinh viên viết ghi chú và đính kèm file sản phẩm.

### 6.5.2 hình ảnh trang

## 6.6 Không gian thảo luận (StudentChat)

### 6.6.1 giao diện

Mô tả: Giao diện nhắn tin thời gian thực.

Sidebar Chat: Danh sách các phòng chat của từng nhóm, hiển thị tin nhắn mới nhất và số tin chưa đọc.

Khung Chat chính:

Header: Tên nhóm, số thành viên, nút xem thông tin nhóm/QR Code.

Message Bubbles: Tin nhắn của "Tôi" (Bên phải, màu xanh) và tin nhắn thành viên khác (Bên trái, màu xám/trắng).

Input Area: Ô nhập văn bản tích hợp nút đính kèm file (📎).

### 6.6.2 hình ảnh trang

## 6.7 Điều phối nhóm (StudentManageGroup)

### 6.7.1 giao diện

Đây là trang dành riêng cho Nhóm trưởng để quản lý đề tài và nhân sự.

#### 6.7.1.1 Quản lý thành viên & Đề tài

Member Rows: Danh sách thành viên kèm chỉ số đóng góp (số task đã nhận). Có thể mở rộng để xem chi tiết task của từng người.

Đăng ký đề tài: Nút mở Modal chọn đề tài từ danh sách giảng viên cung cấp.

#### 6.7.1.2 Bảng Kanban

Quy trình 4 cột:

To do: Các công việc vừa tạo, chưa có người nhận hoặc chưa bắt đầu.

Doing: Các công việc đang trong quá trình thực hiện.

Review: Các công việc sinh viên đã nộp bài, chờ nhóm trưởng duyệt.

Done: Các công việc đã hoàn thành đạt yêu cầu.

Action: Nhóm trưởng có quyền "Duyệt" (Approve) để chuyển sang Done hoặc yêu cầu "Làm lại" (Redo).

### 6.7.2 hình ảnh trang

## 6.8 Nhóm học tập (StudentGroups)

### 6.8.1 giao diện

#### 6.8.1.1 Thanh tiêu đề và Nút hành động

Tiêu đề trang: "Nhóm học tập" (font-size: 24px, bold).

Nhóm nút chức năng (phía bên phải):

Nút "Tham gia nhóm mới": Icon FaUserPlus, nền xanh lá. Dùng để mở Modal tìm và gia nhập nhóm có sẵn.

Nút "Yêu cầu chuyển nhóm": Icon FaExchangeAlt, nền xanh dương. Dùng để gửi yêu cầu chuyển sang nhóm khác cho giảng viên duyệt.

#### 6.8.1.2 Phân hệ Nhóm đang tham gia (Active Groups)

Hiển thị dưới dạng lưới (Grid 2-3 cột). Mỗi nhóm là một thẻ Card chứa thông tin:

Header của Card:

Tên nhóm (ví dụ: Nhóm 1).

Huy hiệu (Badge) "Nhóm trưởng": Màu vàng, chỉ xuất hiện nếu sinh viên đang đóng vai trò leader.

Nội dung chi tiết:

Thông tin lớp: Tên lớp và Giảng viên hướng dẫn.

Đề tài: Tên đề tài (Click vào để xem Modal chi tiết đề tài).

Thanh tiến độ (Progress Bar): Hiển thị % hoàn thành công việc chung của nhóm.

Bảng chỉ số (Stats Table):

Hiển thị 5 chỉ số công việc: Tổng task, Hoàn thành, Trễ hạn, Đang làm, Chờ duyệt.

Danh sách thành viên:

Hiển thị dãy Avatar (Chữ cái đầu tên) của các thành viên. Khi hover vào sẽ hiện tên đầy đủ.

#### 6.8.1.3 Phân hệ Lịch sử yêu cầu (Request History)

Bộ lọc: Dropdown chọn học kỳ để xem các yêu cầu cũ.

Thẻ yêu cầu (Request Card):

Tiêu đề yêu cầu và Ngày gửi.

Trạng thái (Badge): Chờ duyệt (Xám), Đồng ý (Xanh lá), Từ chối (Đỏ).

Nội dung: Lý do sinh viên viết và Phản hồi (ghi chú) từ giảng viên.

#### 6.8.1.4 Đặc tả các Modal tương tác (Popups)

6.8.1.4.1 Modal Tham gia nhóm

Hiển thị danh sách các nhóm còn trống chỗ trong những lớp sinh viên chưa có nhóm. Mỗi dòng gồm: Tên nhóm, Số lượng hiện tại (ví dụ: 4/5) và nút "Tham gia".

6.8.1.4.2 Modal Yêu cầu chuyển nhóm

Form nhập liệu gồm:

Dropdown chọn nhóm hiện tại.

Dropdown chọn nhóm muốn chuyển đến.

Ô nhập văn bản (Textarea) "Lý do chuyển nhóm".

6.8.1.4.3 button rời nhóm

Cho phép sinh viên rời nhóm trong quá trình đăng ký nhóm trong khoảng thời gian đăng ký nhóm cho phép . nếu giảng viên chốt danh sách nhóm thì button rời nhóm disable

### 6.8.2 Hình ảnh trang
