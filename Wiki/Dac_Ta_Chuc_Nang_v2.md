**TÀI LIỆU ĐẶC TẢ**

**CHỨC NĂNG **

*Website quản lý Lớp học – Module: Quản lý nhóm*

Nhóm thực hiện: Nhóm 2

Người viết tài liệu : Phan Nhựt Hào

# 1. Chức năng đăng nhập

## 1.1 Thông tin chung

| Tên chức năng | Đăng Nhập |
| --- | --- |
| Thuộc module | Xác Thực (Authentication) |
| Người sử dụng | Admin · Giảng viên · Sinh viên |


## 1.2 Mô tả tổng quan

Chức năng Đăng Nhập cho phép người dùng xác thực danh tính để truy cập vào hệ thống Quản Lý Lớp Học. Hệ thống hỗ trợ ba nhóm người dùng với quyền hạn khác nhau: Admin, Giảng viên và Sinh viên. Sau khi đăng nhập thành công, hệ thống sẽ tự động điều hướng người dùng đến giao diện tương ứng với vai trò của họ.

## 1.3 Người dùng & vai trò

| Vai trò | Mã vai trò | Điều hướng sau đăng nhập |
| --- | --- | --- |
| Admin | maVaiTro = 1 | /admin/dashboard |
| Giảng viên | maVaiTro = 2 | /teacher/dashboard |
| Sinh viên | maVaiTro = 3 | /student/dashboard |


## 1.4 Mô tả luồng chính

Người dùng truy cập trang đăng nhập và nhìn thấy giao diện gồm hai phần: bên trái là form nhập thông tin, bên phải là hình minh họa trang trí. Người dùng nhập tên đăng nhập và mật khẩu, sau đó nhấn nút Đăng Nhập. Hệ thống kiểm tra thông tin phía frontend trước, sau đó gửi yêu cầu lên backend để xác thực. Nếu thành công, hệ thống lưu token JWT vào localStorage và điều hướng đến dashboard tương ứng với vai trò.

## 1.5 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Tên đăng nhập | Chuỗi ký tự | Có | Không được để trống |
| Mật khẩu | Chuỗi ký tự | Có | Không được để trống; ẩn/hiện bằng icon mắt |


## 1.6 Output (khi thành công)

| Trường | Mô tả |
| --- | --- |
| token | JWT token dùng cho các request sau |
| maNguoiDung | Mã định danh nội bộ của người dùng |
| maSo | MSSV / Mã giảng viên / ADMIN |
| tenDangNhap | Tên đăng nhập |
| hoTen | Họ và tên đầy đủ |
| anhDaiDien | Đường dẫn ảnh đại diện |
| email | Địa chỉ email |
| maVaiTro | Mã vai trò: 1 = Admin, 2 = Giảng viên, 3 = Sinh viên |
| tenVaiTro | Tên vai trò dạng chuỗi |


## 1.7 Quy tắc ngiệp vụ

Nút Đăng Nhập bị vô hiệu hóa (disabled, chuyển màu xám) khi một trong hai trường còn trống. Người dùng không thể submit form trong trạng thái này.

Thông báo lỗi đỏ xuất hiện ngay dưới ô nhập liệu khi người dùng đã chạm vào ô đó nhưng để trống, hoặc khi ô còn lại đã có nội dung.

Trong khi hệ thống đang xử lý yêu cầu đăng nhập, nút hiển thị chữ "Đang đăng nhập..." và bị vô hiệu hóa để tránh gửi nhiều request.

Tài khoản phải đang ở trạng thái hoạt động (DangHoatDong = true) thì mới được phép đăng nhập. Tài khoản bị vô hiệu hóa sẽ nhận thông báo sai tài khoản hoặc mật khẩu (không tiết lộ lý do cụ thể vì lý do bảo mật).

Mật khẩu được so sánh với giá trị lưu trong cột MatKhauHash của bảng NguoiDung.

Sau khi đăng nhập thành công, JWT token có thời hạn 24 giờ kể từ thời điểm cấp phát.

Hệ thống điều hướng dựa trên giá trị maVaiTro trong dữ liệu trả về, không dựa trên tên vai trò.

## 1.8 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị |
| --- | --- |
| Để trống tên đăng nhập | "Vui lòng nhập tên đăng nhập" – hiện dưới ô input màu đỏ |
| Để trống mật khẩu | "Vui lòng nhập mật khẩu" – hiện dưới ô input màu đỏ |
| Sai tên đăng nhập hoặc mật khẩu | "Sai tài khoản hoặc mật khẩu" – hiện trong khung đỏ phía trên nút đăng nhập |
| Tài khoản không hoạt động | "Sai tài khoản hoặc mật khẩu" – không tiết lộ lý do cụ thể |
| Lỗi kết nối server | Hiển thị thông báo lỗi từ exception; ghi log phía backend |


## 1.9 Thông tin API

| Endpoint | POST /api/xacthuc/dangnhap |
| --- | --- |
| Content-Type | application/json |
| Xác thực | Không yêu cầu token (public endpoint) |
| Request Body | { "tenDangNhap": "string", "matKhau": "string" } |
| Thành công | HTTP 200 – trả về token và thông tin người dùng |
| Thất bại | HTTP 401 – { "thongBao": "Sai tài khoản hoặc mật khẩu" } |


# 2 . Hồ sơ người dùng

## 2.1 Thông tin chung

| Tên chức năng | Hồ Sơ Người Dùng |
| --- | --- |
| Thuộc module | Quản Lý Người Dùng |
| Người sử dụng | Admin · Giảng viên · Sinh viên |


## 2.2 Mô tả tổng quan

Module Hồ Sơ Người Dùng cho phép mỗi người dùng xem thông tin cá nhân của mình sau khi đăng nhập. Giao diện hiển thị ảnh đại diện, họ tên, vai trò và toàn bộ thông tin hồ sơ trên một trang duy nhất. Từ trang này, người dùng có thể thực hiện hai thao tác chính: cập nhật thông tin liên hệ cá nhân và đổi mật khẩu tài khoản, đều thông qua cửa sổ popup (modal) mà không cần chuyển trang.

## 2.3 Người dùng & vai trò

| Vai trò | Quyền xem hồ sơ | Quyền chỉnh sửa |
| --- | --- | --- |
| Admin | Xem hồ sơ của chính mình | Cập nhật SĐT, email, địa chỉ; đổi MK |
| Giảng viên | Xem hồ sơ của chính mình | Cập nhật SĐT, email, địa chỉ; đổi MK |
| Sinh viên | Xem hồ sơ của chính mình | Cập nhật SĐT, email, địa chỉ; đổi MK |


## 2.4 Chức năng cập nhật thông tin người dùng

### 2.4.1 Mô tả luồng chính

Người dùng truy cập trang Hồ Sơ và nhấn nút "Cập nhật hồ sơ" ở cuối card thông tin. Một cửa sổ modal xuất hiện gồm hai vùng rõ ràng: vùng trên là thông tin định danh chỉ đọc (mã số, họ tên, ngày sinh, giới tính, khoa, lớp) hiển thị nền xám nhạt, không thể chỉnh sửa. Vùng dưới là thông tin liên hệ có thể chỉnh sửa gồm số điện thoại, email và địa chỉ. Sau khi chỉnh sửa, người dùng nhấn "Lưu thay đổi". Hệ thống gửi request lên backend, cập nhật cơ sở dữ liệu và cập nhật lại dữ liệu hiển thị trên trang. Người dùng cũng có thể nhấn "Hủy" hoặc click ra ngoài modal để đóng mà không lưu.

### 2.4.2 Input

| Trường | Bắt buộc | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- | --- |
| Số điện thoại | Có | Chuỗi ký tự | Chỉnh sửa được |
| Email | Có | Chuỗi email | Không được trùng với tài khoản khác |
| Địa chỉ | Không | Chuỗi ký tự | Tùy chọn, nhiều dòng |


Lưu ý: Các trường Mã số, Họ tên, Ngày sinh, Giới tính, Khoa, Lớp hiển thị trong modal nhưng ở chế độ chỉ đọc. Chỉ Admin mới có quyền thay đổi các trường định danh này.

### 2.4.3 Output(khi thành công)

Khi cập nhật thành công, backend trả về HTTP 200 với thông báo "Cập nhật thông tin cá nhân thành công". Frontend cập nhật lại dữ liệu hiển thị trên trang hồ sơ ngay lập tức mà không cần tải lại trang. Modal tự động đóng lại.

### 2.4.4 Quy tắc nghiệp vụ

Thông tin định danh (mã số, họ tên, ngày sinh, giới tính, khoa, lớp) là chỉ đọc với mọi người dùng. Chỉ Admin mới có thể thay đổi qua chức năng quản lý người dùng riêng.

Email mới không được trùng với email của bất kỳ tài khoản nào khác trong hệ thống. Backend kiểm tra và trả lỗi nếu vi phạm.

Sinh viên thấy thêm hai trường Khoa và Lớp trong vùng chỉ đọc. Giảng viên thấy thêm trường Khoa. Admin không thấy hai trường này.

Người dùng có thể đóng modal bất kỳ lúc nào bằng cách nhấn nút X, nhấn "Hủy", hoặc click vào vùng nền tối bên ngoài modal. Dữ liệu chưa lưu sẽ bị hủy.

Dữ liệu trong modal được khởi tạo từ thông tin hiện tại của người dùng lấy từ localStorage mỗi khi mở modal.

### 2.4.5 Xử lý lỗi

| Tình huống lỗi | Xử lý |
| --- | --- |
| Email trùng với tài khoản khác | Backend trả HTTP 400: "Email đã được sử dụng bởi tài khoản khác"; hiển thị thông báo lỗi trong modal |
| Để trống số điện thoại hoặc email | Trình duyệt chặn submit (required); hiển thị gợi ý nhập liệu |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; modal giữ nguyên dữ liệu để người dùng thử lại |
| Token hết hạn | Backend trả HTTP 401; hệ thống chuyển hướng về trang đăng nhập |


## 2.5 Chức năng đổi mật khẩu

### 2.5.1 Mô tả luồng chính

Người dùng nhấn nút "Đổi mật khẩu" ở cuối card hồ sơ. Modal đổi mật khẩu xuất hiện với ba ô nhập liệu: mật khẩu cũ, mật khẩu mới và nhập lại mật khẩu mới. Cả ba ô đều có icon con mắt để ẩn/hiện nội dung. Ngay khi người dùng bắt đầu nhập mật khẩu mới, một checklist gồm 9 tiêu chí bảo mật hiện ra ngay bên dưới, mỗi tiêu chí chuyển sang màu xanh khi đạt yêu cầu. Ô nhập lại mật khẩu hiển thị thông báo xanh "Mật khẩu khớp" hoặc đỏ "Chưa khớp" theo thời gian thực. Nút "Xác nhận" chỉ kích hoạt khi tất cả 9 tiêu chí đạt và hai ô mật khẩu mới khớp nhau. Sau khi xác nhận, hệ thống gọi API backend để kiểm tra mật khẩu cũ và lưu mật khẩu mới. Nếu thành công, modal đóng lại và người dùng nhận thông báo.

### 2.5.2 Input

| Trường | Bắt buộc | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- | --- |
| Mật khẩu cũ | Có | Chuỗi ký tự | Xác thực phía backend bằng BCrypt |
| Mật khẩu mới | Có | Chuỗi ký tự | Phải đạt đủ 9 tiêu chí bảo mật |
| Nhập lại mật khẩu mới | Có | Chuỗi ký tự | Phải khớp chính xác với mật khẩu mới |


**Tiêu chí mật khẩu mới (9 tiêu chí, kiểm tra real-time):**

Độ dài tối thiểu 8 ký tự

Có ít nhất một chữ hoa (A–Z)

Có ít nhất một chữ thường (a–z)

Có ít nhất một chữ số (0–9)

Có ít nhất một ký tự đặc biệt (!@#$%^&*...)

Không chứa khoảng trắng

Không chứa mã số tài khoản (maSo)

Không chứa tên đăng nhập (tenDangNhap)

Không trùng với mật khẩu cũ đang nhập

### 2.5.3 Output(khi thành công)

Khi đổi mật khẩu thành công, backend trả về HTTP 200 với thông báo "Đổi mật khẩu thành công". Frontend hiển thị thông báo thành công, đóng modal và xóa toàn bộ dữ liệu đã nhập. Người dùng nên đăng nhập lại với mật khẩu mới vì token hiện tại vẫn còn hợp lệ đến khi hết 24 giờ.

### 2.5.4 Quy tắc nghiệp vụ

Nút "Xác nhận" bị vô hiệu hóa (màu xám) khi: ô mật khẩu cũ còn trống, hoặc mật khẩu mới chưa đạt đủ 9 tiêu chí, hoặc hai ô mật khẩu mới chưa khớp.

Checklist 9 tiêu chí chỉ hiện ra sau khi người dùng bắt đầu gõ vào ô mật khẩu mới. Mỗi tiêu chí chuyển màu xanh ngay khi điều kiện được thỏa mãn.

Việc kiểm tra mật khẩu cũ có đúng hay không chỉ thực hiện phía backend (dùng BCrypt.Verify). Frontend không tự kiểm tra được.

Nếu mật khẩu cũ sai, backend trả lỗi HTTP 400; frontend hiển thị thông báo lỗi màu đỏ ngay dưới ô mật khẩu cũ.

Mật khẩu mới được hash bằng BCrypt trước khi lưu vào cơ sở dữ liệu, thay thế giá trị MatKhauHash cũ.

Khi đóng modal (dù bằng X, Hủy, hay click ngoài), toàn bộ dữ liệu trong ba ô nhập liệu bị xóa sạch và trạng thái ẩn/hiện mật khẩu được đặt lại.

### 2.5.5 Xử lý lỗi

| Tình huống lỗi | Xử lý |
| --- | --- |
| Mật khẩu cũ không đúng | Backend trả HTTP 400; hiển thị lỗi đỏ dưới ô mật khẩu cũ: "Mật khẩu cũ không đúng, vui lòng kiểm tra lại" |
| Mật khẩu mới chưa đủ tiêu chí | Nút Xác nhận bị disable; checklist hiện màu xám ở các tiêu chí chưa đạt; không gọi API |
| Mật khẩu nhập lại không khớp | Hiển thị lỗi đỏ dưới ô nhập lại: "Mật khẩu nhập lại không khớp với mật khẩu mới"; không gọi API |
| Mật khẩu mới trùng mật khẩu cũ | Tiêu chí "Không trùng mật khẩu cũ" hiển thị màu xám; nút Xác nhận bị disable |
| Token hết hạn | Backend trả HTTP 401; hệ thống chuyển hướng về trang đăng nhập |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; modal giữ nguyên để người dùng thử lại |


## 2.6 Thông tin API

**API 1: Lấy thông tin cá nhân**

| Endpoint | GET /api/nguoidung/me |
| --- | --- |
| Xác thực | Yêu cầu JWT token trong header Authorization |
| Thành công | HTTP 200 – trả về toàn bộ thông tin hồ sơ người dùng |
| Thất bại | HTTP 401 nếu token không hợp lệ hoặc hết hạn |


**API 2: Cập nhật thông tin cá nhân**

| Endpoint | PUT /api/nguoidung/me |
| --- | --- |
| Xác thực | Yêu cầu JWT token trong header Authorization |
| Request Body | { "soDienThoai": "string", "email": "string", "diaChi": "string" } |
| Thành công | HTTP 200 – { "thongBao": "Cập nhật thông tin cá nhân thành công" } |
| Thất bại | HTTP 400 nếu email trùng | HTTP 401 nếu token không hợp lệ |


**API 3: Đổi mật khẩu**

| Endpoint | PUT /api/nguoidung/doi-mat-khau |
| --- | --- |
| Xác thực | Yêu cầu JWT token trong header Authorization |
| Request Body | { "matKhauCu": "string", "matKhauMoi": "string" } |
| Thành công | HTTP 200 – { "thongBao": "Đổi mật khẩu thành công" } |
| Thất bại | HTTP 400 nếu mật khẩu cũ sai hoặc mật khẩu mới < 6 ký tự | HTTP 401 nếu token không hợp lệ |


**ADMIN**

# 3. QUẢN LÝ NGƯỜI DÙNG

## 3.1 Thông tin chung

| Tên chức năng | Quản Lý Người Dùng |
| --- | --- |
| Thuộc module | Admin |
| Người sử dụng | Admin |


## 3.2 Mô tả tổng quan

Module Quản Lý Người Dùng cho phép Admin thực hiện các thao tác CRUD trên tài khoản người dùng trong hệ thống. Giao diện hiển thị danh sách toàn bộ người dùng dưới dạng bảng, hỗ trợ tìm kiếm theo tên/mã số và lọc theo vai trò. Admin có thể thêm tài khoản thủ công, chỉnh sửa thông tin, khóa/mở khóa tài khoản và xóa mềm (soft-delete) người dùng mà không xóa dữ liệu khỏi cơ sở dữ liệu. Mọi thao tác đều thực hiện qua modal popup ngay trên trang quản lý.

## 3.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Admin | Toàn quyền: thêm, sửa, xóa mềm, khóa/mở khóa tài khoản người dùng |
| Giảng viên | Không có quyền truy cập module này |
| Sinh viên | Không có quyền truy cập module này |


## 3.4 Chức năng thêm người dùng (thủ công)

### 3.4.1 Mô tả luồng chính

Admin nhấn nút "+ Thêm người dùng" trên thanh công cụ. Một modal xuất hiện chứa form nhập thông tin. Admin điền đầy đủ các trường bắt buộc bao gồm mã số, tên đăng nhập, mật khẩu, họ tên, email, vai trò. Hệ thống hỗ trợ nút tạo mật khẩu ngẫu nhiên để sinh mật khẩu tự động. Sau khi điền xong, Admin nhấn "Lưu". Hệ thống gửi request POST lên backend để kiểm tra trùng lặp và lưu vào database. Nếu thành công, modal đóng lại và danh sách người dùng được tải lại để hiển thị tài khoản mới.

### 3.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã số (MaSo) | Chuỗi ký tự | Có | Phải là duy nhất trong hệ thống |
| Tên đăng nhập (TenDangNhap) | Chuỗi ký tự | Có | Phải là duy nhất trong hệ thống |
| Mật khẩu (MatKhau) | Chuỗi ký tự | Có | Có thể điền mật khẩu thủ công tuân thủ theo rule check password (8-12 ký tự , có chữ hoa , chữ thường , số , ký tự đặc biệt) hoặc sử dụng nút hỗ trợ để tạo mật khẩu ngẫu nhiên |
| Họ tên (HoTen) | Chuỗi ký tự | Có | Họ và tên đầy đủ |
| Email | Chuỗi email | Có | Phải là duy nhất; định dạng email hợp lệ |
| Giới tính (GioiTinh) | Boolean | Không | true = Nam, false = Nữ |
| Ngày sinh (NgaySinh) | DateOnly | Không | Định dạng ngày tháng năm |
| Khoa (MaKhoa) | Integer | Không | Chọn từ danh sách khoa có sẵn |
| Vai trò (MaVaiTro) | Integer | Có | 1=Admin, 2=Giảng viên, 3=Sinh viên |
| Lớp sinh viên (LopSinhVien) | Chuỗi ký tự | Không | Chỉ áp dụng cho sinh viên |


### 3.4.3 Output(khi thành công)

Khi thêm thành công, backend trả về HTTP 200 với thông báo "Thêm người dùng thành công" kèm maNguoiDung mới. Frontend hiển thị toast thông báo thành công, đóng modal và tải lại danh sách người dùng để hiển thị bản ghi vừa thêm. Tài khoản mới có trạng thái DangHoatDong = true (hoạt động) theo mặc định.

### 3.4.4 Quy tắc nghiệp vụ

Các quy tắc áp dụng khi thêm người dùng:

Mã số phải là duy nhất; hệ thống kiểm tra trùng trước khi lưu và trả lỗi nếu vi phạm.

Tên đăng nhập phải là duy nhất; hệ thống kiểm tra tương tự mã số.

Email phải là duy nhất và đúng định dạng email.

Mật khẩu được lưu dưới dạng plain text vào cột MatKhauHash

Mật khẩu có thể được điền thủ công & tuân thủ theo rule check password :

Độ dài mật khẩu 8-12 ký tự

Có chữ hoa (A-Z)

Có chữ thường(a-z)

Có số(0-9)

Có ký tự đặc biệt(@,!,#,….)

Nút "Tạo mật khẩu ngẫu nhiên" sinh chuỗi mật khẩu có độ phức tạp cao và tự động điền vào ô nhập.

Tài khoản được tạo luôn có DangHoatDong = true; Admin không thể tạo tài khoản ở trạng thái khóa.

Trường LopSinhVien chỉ có ý nghĩa khi vai trò là Sinh viên (MaVaiTro = 3).

Nút "Lưu" chỉ kích hoạt khi tất cả trường bắt buộc đã được điền.

### 3.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Mã số đã tồn tại | Backend trả HTTP 400: "Mã số này đã tồn tại trong hệ thống" |
| Tên đăng nhập đã tồn tại | Backend trả HTTP 400: "Tên đăng nhập này đã được sử dụng" |
| Email đã tồn tại | Backend trả HTTP 400: "Email này đã được sử dụng" |
| Bỏ trống trường bắt buộc | Frontend hiển thị lỗi đỏ ngay dưới ô nhập; không gọi API |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; modal giữ nguyên để Admin thử lại |
| Mật khẩu điền thủ công không đúng rule check password | Backend trả HTTP 400: "Mật khẩu phải dài 8-12 ký tự , có chữ hoa , chữ thường , số & ký tự đặc biệt" |


## 3.5 Chức năng cập nhật thông tin người dùng

### 3.5.1 Mô tả luồng chính

Admin nhấn nút chỉnh sửa (icon bút) trên dòng của người dùng cần cập nhật trong bảng danh sách. Modal chỉnh sửa xuất hiện với các ô nhập được điền sẵn thông tin hiện tại của người dùng. Admin thay đổi các thông tin cần thiết (trừ mã số và tên đăng nhập là không thể sửa). Sau khi hoàn tất, Admin nhấn "Lưu". Hệ thống gửi request PUT lên backend, cập nhật database và làm mới danh sách. Admin cũng có thể nhấn "Hủy" hoặc click ngoài modal để thoát mà không lưu.

### 3.5.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã số | Chuỗi ký tự | Có | Không được trùng với mã số của user khác (bỏ qua chính mình) |
| Tên đăng nhập | Chuỗi ký tự | Có | Không được trùng với tên đăng nhập của user khác (bỏ qua chính mình) |
| Họ tên (HoTen) | Chuỗi ký tự | Có |  |
| Email | Chuỗi email | Có | Không được trùng với tài khoản khác (bỏ qua chính mình) |
| Giới tính (GioiTinh) | Boolean | Không | true = Nam, false = Nữ |
| Ngày sinh (NgaySinh) | DateOnly | Không |  |
| Khoa (MaKhoa) | Integer | Không | Chọn từ danh sách |
| Vai trò (MaVaiTro) | Integer | Có | 1=Admin, 2=Giảng viên, 3=Sinh viên |
| Lớp sinh viên (LopSinhVien) | Chuỗi ký tự | Không | Chỉ áp dụng cho sinh viên |


### 3.5.3 Output(khi thành công)

Khi cập nhật thành công, backend trả về HTTP 200 với thông báo "Cập nhật thông tin thành công". Frontend hiển thị toast thông báo, đóng modal và tải lại danh sách để phản ánh thông tin đã thay đổi.

### 3.5.4 Quy tắc nghiệp vụ

Mã số mới không được trùng với mã số  của bất kỳ user khác (backend kiểm tra, bỏ qua chính tài khoản đang sửa).

Tên đăng nhập mới không được trùng với tên đăng nhập của bất kỳ tài khoản khác (backend kiểm tra, bỏ qua chính tài khoản đang sửa).

Email mới không được trùng với email của bất kỳ tài khoản khác (backend kiểm tra, bỏ qua chính tài khoản đang sửa).

Admin có thể thay đổi vai trò (MaVaiTro) của người dùng, kể cả đổi từ Sinh viên sang Giảng viên hoặc Admin.

Khi đóng modal, mọi thay đổi chưa lưu sẽ bị hủy; lần mở tiếp theo sẽ tải lại dữ liệu hiện tại từ server.

### 3.5.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Không tìm thấy người dùng | Backend trả HTTP 404: "Không tìm thấy người dùng" |
| Mã số trùng với tài khoản khác | Backend trả HTTP 400: " Mã số này đã tồn tại trong hệ thống!" |
| Tên đăng nhập trùng với tài khoản khác | Backend trả HTTP 400: " Tên đăng nhập này đã được sử dụng!" |
| Email trùng với tài khoản khác | Backend trả HTTP 400: "Email này đã được sử dụng bởi tài khoản khác" |
| Bỏ trống trường bắt buộc | Frontend hiển thị lỗi đỏ dưới ô nhập; không gọi API |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; modal giữ nguyên để Admin thử lại |


## 3.6 Chức năng xóa người dùng (xóa mềm)

### 3.6.1 Mô tả luồng chính

Admin nhấn nút xóa (icon thùng rác) trên dòng của người dùng cần xóa trong bảng danh sách. Hệ thống hiển thị hộp thoại xác nhận hỏi Admin có chắc chắn muốn xóa không. Nếu Admin xác nhận, hệ thống gửi request DELETE lên backend. Backend thực hiện xóa mềm bằng cách đặt DangHoatDong = false thay vì xóa bản ghi khỏi database. Sau đó danh sách được tải lại; tài khoản vừa xóa hiển thị với trạng thái "Không hoạt động" (hoặc bị ẩn khỏi danh sách tuỳ cấu hình lọc).

### 3.6.2 Input

| Trường | Mô tả |
| --- | --- |
| maNguoiDung (id) | Mã định danh người dùng, lấy từ URL parameter |


### 3.6.3 Output(khi thành công)

Khi xóa thành công, backend trả về HTTP 200 với thông báo "Xóa người dùng thành công". Dữ liệu người dùng vẫn tồn tại trong database nhưng trường DangHoatDong được đặt thành false. Tài khoản bị xóa mềm sẽ không thể đăng nhập vào hệ thống.

### 3.6.4 Quy tắc nghiệp vụ

Xóa là xóa mềm (soft delete): backend chỉ đặt DangHoatDong = false, không xóa bản ghi khỏi database.

Tài khoản bị xóa mềm không thể đăng nhập; nếu cố đăng nhập sẽ nhận thông báo sai tài khoản hoặc mật khẩu (không tiết lộ lý do).

Admin nên cân nhắc dùng chức năng Khóa thay vì Xóa nếu muốn dễ khôi phục sau này; về mặt kỹ thuật cả hai đều đặt DangHoatDong = false.

Dữ liệu liên quan (điểm, lịch học, v.v.) không bị ảnh hưởng bởi xóa mềm; chỉ trạng thái tài khoản thay đổi.

### 3.6.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Không tìm thấy người dùng | Backend trả HTTP 404: "Không tìm thấy người dùng" |
| Admin hủy hộp thoại xác nhận | Không có hành động nào được thực hiện; danh sách giữ nguyên |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; yêu cầu Admin thử lại |


## 3.7 chức năng khóa / mở khóa người dùng

### 3.7.1 Mô tả luồng chính

Admin nhìn vào cột "Trạng thái" trong bảng danh sách. Mỗi tài khoản hiển thị badge trạng thái: "Hoạt động" (màu xanh) hoặc "Đã khóa" (màu đỏ). Admin nhấn nút toggle trạng thái (icon khóa) trên dòng tương ứng. Hệ thống gửi request PUT lên endpoint /api/nguoidung/{id}/trangthai. Backend tự động đảo ngược trạng thái (true → false hoặc false → true). Không cần xác nhận thêm; danh sách cập nhật trực tiếp sau khi nhận phản hồi thành công.

### 3.7.2 Input

| Trường | Mô tả |
| --- | --- |
| maNguoiDung (id) | Mã định danh người dùng, lấy từ URL parameter |
| (Không có body) | Request body rỗng {}; backend tự lấy trạng thái hiện tại và đảo ngược |


### 3.7.3 Output(khi thành công)

Backend trả về HTTP 200 với thông báo "Cập nhật trạng thái thành công" và trường trangThai chứa giá trị boolean mới. Frontend cập nhật badge trạng thái ngay lập tức mà không cần tải lại toàn trang. Nếu tài khoản bị khóa (DangHoatDong = false), người dùng sẽ không thể đăng nhập từ lần tiếp theo.

### 3.7.4 Quy tắc nghiệp vụ

Khóa tài khoản chỉ ngăn người dùng đăng nhập mới; phiên đăng nhập (JWT token) hiện tại vẫn còn hiệu lực đến khi hết hạn 24 giờ.

Thao tác là toggle hai chiều: khóa tài khoản đang hoạt động, hoặc mở khóa tài khoản đang bị khóa, chỉ bằng một lần nhấn nút.

Admin không thể tự khóa tài khoản của chính mình (frontend nên vô hiệu hóa nút toggle cho tài khoản đang đăng nhập).

Khi tài khoản bị khóa, hệ thống xác thực trả thông báo sai tài khoản hoặc mật khẩu, không tiết lộ lý do khóa.

Dữ liệu của người dùng (điểm, lịch học) không bị ảnh hưởng khi khóa/mở khóa; chỉ quyền đăng nhập thay đổi.

### 3.7.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Không tìm thấy người dùng | Backend trả HTTP 404: "Không tìm thấy người dùng" |
| Admin tự khóa chính mình | Frontend vô hiệu hóa nút toggle; không gọi API |
| Lỗi kết nối server | Hiển thị thông báo lỗi chung; trạng thái hiển thị trên UI không thay đổi |


## 3.8. Thông tin API

| API | Lấy danh sách người dùng |
| --- | --- |
| Endpoint | GET /api/nguoidung |
| Xác thực | Yêu cầu JWT token (Admin) |
| Thành công | HTTP 200 – trả về mảng danh sách người dùng kèm tên vai trò |
| API | Thêm người dùng mới |
| Endpoint | POST /api/nguoidung |
| Content-Type | application/json |
| Request Body | { maSo, tenDangNhap, matKhau, hoTen, email, gioiTinh, ngaySinh, maKhoa, maVaiTro, lopSinhVien } |
| Thành công | HTTP 200 – { thongBao: "Thêm người dùng thành công", maNguoiDung } |
| Thất bại | HTTP 400 – { thongBao: mô tả lỗi trùng mã số / tên đăng nhập / email } |
| API | Cập nhật thông tin người dùng |
| Endpoint | PUT /api/nguoidung/{id} |
| Content-Type | application/json |
| Request Body | { hoTen, email, gioiTinh, ngaySinh, maKhoa, maVaiTro, lopSinhVien } |
| Thành công | HTTP 200 – { thongBao: "Cập nhật thông tin thành công" } |
| Thất bại | HTTP 404 nếu không tìm thấy │ HTTP 400 nếu email trùng |
| API | Khóa / mở khóa tài khoản |
| Endpoint | PUT /api/nguoidung/{id}/trangthai |
| Request Body | {} (rỗng) |
| Thành công | HTTP 200 – { thongBao: "Cập nhật trạng thái thành công", trangThai: bool } |
| Thất bại | HTTP 404 nếu không tìm thấy người dùng |
| API | Xóa mềm người dùng |
| Endpoint | DELETE /api/nguoidung/{id} |
| Thành công | HTTP 200 – { thongBao: "Xóa người dùng thành công" } | DangHoatDong → false |
| Thất bại | HTTP 404 nếu không tìm thấy người dùng |


# 4. QUẢN LÝ KHOA

## 4.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Khoa |
| Thuộc module | Quản Trị Hệ Thống (Admin) |
| Người sử dụng | Admin |


## 4.2 Mô tả tổng quan

Module Quản Lý Khoa cho phép Admin thiết lập và quản lý danh sách các khoa/ngành đào tạo trong trường. Giao diện được thiết kế dạng 2 cột: cột bên trái là danh sách các khoa, cột bên phải hiển thị chi tiết của khoa đang được chọn (bao gồm danh sách Lớp hành chính, Giảng viên và Sinh viên thuộc khoa đó). Admin có thể thực hiện thao tác Thêm, Sửa (inline-edit) và Xóa khoa trực tiếp trên danh sách ở cột trái.

## 4.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Admin | Toàn quyền: thêm, sửa, xóa thông tin khoa. |
| Giảng viên | Chỉ xem danh sách (dùng cho các dropdown chọn khoa). |
| Sinh viên | Chỉ xem danh sách (dùng cho các dropdown chọn khoa). |


## 4.4 Chức năng thêm khoa

### 4.4.1 Mô tả luồng chính

Tại đầu cột danh sách Khoa (bên trái), Admin nhập thông tin vào hai ô: *Mã Khoa (Ký hiệu khoa)* và *Tên Khoa mới*.

Admin nhấn nút **"+"** (màu xanh).

Hệ thống gửi request POST lên backend để kiểm tra dữ liệu và lưu vào cơ sở dữ liệu.

Nếu thành công, ô nhập liệu được làm trống và danh sách khoa tải lại để hiển thị khoa vừa thêm.

### 4.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Ký hiệu khoa (KyHieuKhoa) | Chuỗi ký tự | Có | Ví dụ: CNTT, KTMT. Không được trùng lặp. Tự động chuyển in hoa (Upper) trước khi lưu. |
| Tên khoa (TenKhoa) | Chuỗi ký tự | Có | Không được trùng lặp (không phân biệt hoa thường). |


### 4.4.3 Output(khi thành công)

Backend trả về HTTP 200 kèm thông báo *"Thêm khoa thành công"*. Frontend làm mới danh sách khoa, hiển thị khoa mới ở cột bên trái.

### 4.4.4 Quy tắc nghiệp vụ

Tên khoa và Ký hiệu khoa đều không được phép để trống hoặc chỉ chứa khoảng trắng.

Backend tự động loại bỏ khoảng trắng thừa (Trim) ở hai đầu trước khi kiểm tra.

Tên khoa không được trùng với khoa đã có trong hệ thống (kiểm tra không phân biệt chữ hoa/chữ thường).

Ký hiệu khoa không được trùng với ký hiệu đã có trong hệ thống.

### 4.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Bỏ trống dữ liệu | Frontend hiển thị alert: "Vui lòng nhập tên và ký hiệu khoa". Không gọi API. |
| Trùng tên khoa | Backend trả HTTP 400: "Tên khoa này đã tồn tại". Alert lên màn hình. |
| Trùng ký hiệu khoa | Backend trả HTTP 400: "Ký hiệu khoa này đã tồn tại". Alert lên màn hình. |


## 4.5 Chức năng cập nhật thông tin khoa

### 4.5.1 Mô tả luồng chính

Admin nhấn nút **Sửa (icon bút màu cam)** trên dòng của khoa cần cập nhật ở danh sách.

Dòng thông tin chuyển sang chế độ chỉnh sửa (inline-edit) với 2 ô input: Ký hiệu khoa và Tên khoa, kèm 2 nút **Lưu** và **Hủy**.

Admin thay đổi nội dung và nhấn **Lưu**.

Hệ thống gửi request PUT lên backend. Nếu thành công, giao diện thoát chế độ sửa và làm mới dữ liệu.

### 4.5.2 Input

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Ký hiệu khoa mới | Có | Không được trùng với ký hiệu của khoa khác. |
| Tên khoa mới | Có | Không được trùng với tên của khoa khác. |


### 4.5.3 Output(khi thành công)

Backend trả HTTP 200: *"Cập nhật khoa thành công"*. Frontend làm mới danh sách khoa và cập nhật lại thông tin chi tiết (nếu khoa đó đang được chọn hiển thị ở cột phải).

### 4.5.4 Quy tắc nghiệp vụ

Hệ thống kiểm tra trùng lặp tên và ký hiệu mới (bỏ qua chính khoa đang được chỉnh sửa).

Nếu người dùng nhấn **Hủy**, các thay đổi chưa lưu sẽ bị xóa, ô thông tin quay về trạng thái chỉ đọc ban đầu.

### 4.5.5 Xử lý lỗi

Xử lý lỗi tương tự như chức năng Thêm Khoa (lỗi rỗng, lỗi trùng lặp).

## 4.6 Chức năng xóa khoa

### 4.6.1 Mô tả luồng chính

Admin nhấn nút **Xóa (icon thùng rác màu đỏ)** trên dòng của khoa cần xóa.

Trình duyệt hiển thị hộp thoại xác nhận: *"Bạn có chắc muốn xóa khoa này?"*

Nếu Admin chọn OK, hệ thống gửi request DELETE lên backend.

Backend kiểm tra các ràng buộc dữ liệu. Nếu đủ điều kiện, bản ghi khoa bị xóa khỏi database.

Frontend tải lại danh sách. Nếu khoa đang xem chi tiết bị xóa, cột chi tiết bên phải cũng bị làm trống.

### 4.6.2 Input

Mã định danh khoa (id truyền qua URL parameter).

### 4.6.3 Output(khi thành công)

Backend trả HTTP 200: *"Xóa khoa thành công"*.

### 4.6.4 Quy tắc nghiệp vụ

Hệ thống bảo vệ dữ liệu bằng cách **NGĂN CHẶN** xóa khoa nếu khoa đó đang có **Lớp hành chính**, **Giảng viên** hoặc **Sinh viên** gắn kèm.

Chỉ có thể xóa các khoa hoàn toàn trống (chưa có dữ liệu liên quan).

### 4.6.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Vi phạm ràng buộc dữ liệu | Backend trả HTTP 400: "Không thể xóa khoa đang có lớp hành chính hoặc giảng viên/sinh viên." Hiển thị bằng alert cho Admin. |
| Không tìm thấy khoa | Backend trả HTTP 404: "Không tìm thấy khoa". |


## 4.7. Thông tin API

| API | Endpoint | Body / Tham số |
| --- | --- | --- |
| Lấy danh sách Khoa | GET /api/khoa | AllowAnonymous |
| Lấy chi tiết 1 Khoa | GET /api/khoa/{id} | Trả về kèm mảng Lớp hành chính, GV, SV |
| Thêm Khoa mới | POST /api/khoa | { "tenKhoa": "str", "kyHieuKhoa": "str" } |
| Cập nhật Khoa | PUT /api/khoa/{id} | { "tenKhoa": "str", "kyHieuKhoa": "str" } |
| Xóa Khoa | DELETE /api/khoa/{id} | Yêu cầu token Admin |


# 5. QUẢN LÝ LỚP SINH VIÊN

## 5.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Lớp Sinh Viên (Hành Chính) |
| Thuộc module | Quản Trị Hệ Thống (Admin) |
| Người sử dụng | Admin |


## Mô tả tổng quan

Chức năng này quản lý danh mục Lớp hành chính của sinh viên (ví dụ: D23_TH01). Thao tác được thực hiện ngay trong tab **"Lớp Hành Chính"** ở màn hình Chi tiết Khoa (cột bên phải). Khi Admin chọn một khoa, danh sách các lớp thuộc khoa đó sẽ hiện ra. Admin có thể thêm lớp mới vào khoa, chỉnh sửa tên lớp hoặc xóa lớp.

## Người dùng & vai trò

Tương tự module quản lý khoa, chỉ **Admin** mới có quyền thêm, sửa, xóa lớp hành chính.

## 5.4 Chức năng thêm lớp

### 5.4.1 Mô tả luồng chính

Trong tab "Lớp Hành Chính" của Khoa đang chọn, Admin nhập thông tin vào thanh công cụ gồm: *Mã lớp (VD: D23_TH01)* và *Tên lớp đầy đủ*.

Admin nhấn nút **"+ Thêm lớp mới"**.

Hệ thống tự động gán lớp này vào khoa hiện tại (truyền maKhoa tương ứng) và gọi API tạo mới.

Nếu thành công, bảng danh sách lớp hành chính bên dưới được làm mới để hiển thị lớp vừa thêm.

### 5.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã lớp (MaLopSinhVien) | Chuỗi ký tự | Có | Đồng thời đóng vai trò là Khóa chính. Phải duy nhất toàn hệ thống. |
| Tên lớp (TenLopSinhVien) | Chuỗi ký tự | Có | Phải là duy nhất toàn hệ thống. |
| Mã khoa (MaKhoa) | Số nguyên | Có | Hệ thống tự động lấy ID của Khoa đang được chọn hiển thị. |


### 5.4.3 Output(khi thành công)

Trình duyệt xóa trắng ô input, tự động tải lại chi tiết khoa và danh sách lớp. Backend trả HTTP 200 kèm maLop.

### 5.4.4 Quy tắc nghiệp vụ

Mã lớp và Tên lớp không được để trống.

Mã lớp và Tên lớp **không được trùng** với bất kỳ lớp nào đã tồn tại trong hệ thống (kiểm tra không phân biệt hoa thường).

Lớp mới tạo luôn có trạng thái DangHoatDong = true theo mặc định.

### 5.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Để trống thông tin | Hiển thị cảnh báo: "Vui lòng nhập mã và tên lớp". |
| Trùng lặp Mã hoặc Tên lớp | Backend trả HTTP 400: "Mã lớp hoặc tên lớp đã tồn tại". |


## 5.5 Chức năng cập nhật thông tin lớp

### 5.5.1 Mô tả luồng chính

Trong bảng danh sách lớp, Admin nhấn icon **Sửa (màu cam)** ở dòng tương ứng.

Bảng chuyển sang chế độ inline-edit. **Mã lớp (Khóa chính) được giữ nguyên (chỉ đọc)**, ô Tên lớp biến thành input.

Admin chỉnh sửa tên lớp và nhấn icon **Dấu check (Lưu)** màu xanh.

Hệ thống gửi request PUT lên backend. Sau đó bảng thoát chế độ sửa và hiển thị dữ liệu mới.

### 5.5.2 Input

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Tên lớp mới | Có | Cập nhật lại tên lớp. |
| Mã lớp (ID) | Có | Lấy từ dòng đang chọn, truyền qua URL path, không thể sửa. |


### 5.5.3 Output(khi thành công)

Trình duyệt xóa trắng ô input, tự động tải lại cập nhật tên lớp mới

### 5.5.4 Quy tắc nghiệp vụ

Không được phép đổi Mã Lớp vì đây là khóa chính liên kết dữ liệu sinh viên.

Tên lớp mới không được rỗng.

### 5.5.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Để trống thông tin | Hiển thị cảnh báo: "Vui lòng  tên lớp". |
| Trùng lặp Tên lớp | Backend trả HTTP 400: " Tên lớp đã tồn tại i". |


## 5.6 Chức năng xóa lớp

### 5.6.1 Mô tả luồng chính

Admin nhấn nút **Xóa (Thùng rác màu đỏ)** trên một dòng trong bảng danh sách lớp.

Xác nhận hành động trên hộp thoại popup.

Backend kiểm tra xem lớp này có đang chứa sinh viên nào không. Nếu hợp lệ thì xóa bản ghi.

Frontend tải lại danh sách lớp.

### 5.6.2 Output(khi thành công)

Trình duyệt tự động tải lại cập nhật danh sách lớp sinh viên sau khi xóa

### 5.6.3 Quy tắc nghiệp vụ

**Ràng buộc toàn vẹn dữ liệu:** Backend quét bảng NguoiDung. Nếu có bất kỳ Sinh viên nào đang được gắn với lớp này, giao dịch xóa sẽ bị chặn.

Admin phải sang module Quản lý người dùng, chuyển toàn bộ sinh viên khỏi lớp này rồi mới có thể thực hiện xóa lớp thành công.

### 5.6.4 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Xóa lớp khi  lớp còn sinh viên thuộc lớp đó | Thông báo lỗi trả về: "Không thể xóa lớp đang có sinh viên. Vui lòng chuyển sinh viên sang lớp khác trước." (HTTP 400). |


## 5.7 Thông tin API

| API | Endpoint | Body / Tham số |
| --- | --- | --- |
| Lấy danh sách Lớp active | GET /api/lopsinhvien | Chỉ lấy lớp có DangHoatDong = true |
| Thêm Lớp mới | POST /api/lopsinhvien | { "maLopSinhVien": "str", "tenLopSinhVien": "str", "maKhoa": int } |
| Cập nhật Tên Lớp | PUT /api/lopsinhvien/{id} | { "tenLopSinhVien": "str", "maKhoa": int } |
| Xóa Lớp | DELETE /api/lopsinhvien/{id} | Yêu cầu token Admin |


# 6. CẤU HÌNH HỆ THỐNG

## 6.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Cấu Hình Hệ Thống |
| Thuộc module | Quản Trị Hệ Thống (Admin) |
| Người sử dụng | Admin |


## Mô tả tổng quan

Module Cấu Hình Hệ Thống cho phép Admin thiết lập các tham số kỹ thuật dùng chung cho toàn bộ website, đặc biệt là giới hạn dung lượng và định dạng tệp tin được phép tải lên hệ thống. Giao diện trực quan cho phép điều chỉnh dung lượng bằng thanh trượt (slider) và quản lý đuôi mở rộng file bằng các tag (thẻ). Các cấu hình này được lưu vào bảng CauHinhHeThong dưới dạng cặp Key-Value.

## Người dùng & vai trò

Chỉ duy nhất người dùng có vai trò **Admin** (MaVaiTro = 1) mới có quyền truy cập và chỉnh sửa các tham số trong module này.

## 6.4. Mô tả luồng chính

Admin truy cập trang Cấu hình hệ thống. Hệ thống gọi API lấy danh sách cấu hình hiện tại và hiển thị lên giao diện.

Admin tương tác với các thanh trượt để thay đổi dung lượng tối đa (MB) cho 3 ngữ cảnh: Tài liệu đề tài, Bài nộp nhiệm vụ, và File đính kèm tin nhắn.

Admin thêm hoặc xóa các định dạng tệp tin (.pdf, .docx, .zip,...) cho từng ngữ cảnh.

Nút **"Lưu thay đổi"** sáng lên (được kích hoạt) khi có sự thay đổi dữ liệu so với ban đầu.

Admin nhấn "Lưu thay đổi". Hệ thống đóng gói toàn bộ dữ liệu thành một object JSON và gửi request POST lên backend.

Backend cập nhật dữ liệu, trả về thành công. Giao diện hiển thị thông báo toast góc dưới màn hình.

## Input

| Khóa cấu hình (Key) | Kiểu dữ liệu (Value) | Ghi chú |
| --- | --- | --- |
| FILE_MAX_SIZE_DETAI | Số nguyên (1 - 100) | Dung lượng tối đa (MB) cho tài liệu đề tài. |
| FILE_EXT_DETAI | Chuỗi (cách nhau bởi dấu phẩy) | Định dạng cho phép (VD: .pdf,.docx,.zip) |
| FILE_MAX_SIZE_TASK | Số nguyên (1 - 100) | Dung lượng tối đa (MB) cho bài nộp Task. |
| FILE_EXT_TASK | Chuỗi (cách nhau bởi dấu phẩy) | Định dạng cho phép nộp bài. |
| FILE_MAX_SIZE_MSG | Số nguyên (1 - 100) | Dung lượng tối đa (MB) cho file đính kèm tin nhắn. |
| FILE_EXT_MSG | Chuỗi (cách nhau bởi dấu phẩy) | Định dạng cho phép trong tin nhắn. |


## Output(khi thành công)

Backend trả HTTP 200. Nút "Lưu thay đổi" chuyển về trạng thái vô hiệu hóa (disabled) cho đến khi có thay đổi mới. Hệ thống hiển thị toast thông báo: *"Đã cập nhật cấu hình hệ thống thành công!"* xuất hiện ở góc phải dưới.

## Quy tắc nghiệp vụ

**Blacklist bảo mật:** Giao diện tự động chặn việc thêm các đuôi mở rộng có nguy cơ thực thi mã độc như: .exe, .bat, .sh, .js, .ps1, .cmd.

Tự động chuẩn hóa (Normalize): Hệ thống tự động thêm dấu chấm (.) vào trước đuôi mở rộng nếu Admin gõ thiếu, chuyển chữ hoa thành chữ thường.

Nút lưu chỉ được kích hoạt (Enabled) khi trạng thái thay đổi cấu hình được đánh dấu là `isDirty`.

Hệ thống cung cấp các nút "Quick Tags" (Văn bản, Nén, Hình ảnh) để thêm nhanh cụm định dạng mà không cần gõ thủ công.

## Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Thêm đuôi file nằm trong blacklist | Hiển thị alert cảnh báo bảo mật: "Đuôi file [tên_đuôi] không được phép (Nguy cơ bảo mật)!". Từ chối thao tác. |
| Lỗi kết nối / Server trả lỗi | Alert thông báo: "Có lỗi xảy ra khi lưu cấu hình." hoặc "Lỗi kết nối máy chủ." |


## Thông tin API

| API | Endpoint | Chi tiết |
| --- | --- | --- |
| Lấy cấu hình | GET /api/admin/cauhinh | Trả về mảng Object chứa Key-Value cấu hình. |
| Cập nhật cấu hình | POST /api/admin/cauhinh | Body gửi lên chuỗi JSON dạng Dictionary chứa danh sách các cài đặt. |


# 7.QUẢN LÝ HỌC KỲ

## 7.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Năm Học - Học Kỳ |
| Thuộc module | Quản Trị Hệ Thống (Admin) |
| Người sử dụng | Admin |


## 7.2 Mô tả tổng quan

Chức năng này quản lý các mốc thời gian (Học kỳ / Năm học) của hệ thống. Dữ liệu học kỳ dùng để gắn vào các Lớp Học phần, giúp hệ thống phân loại, truy xuất và lưu trữ dữ liệu theo từng kỳ đào tạo riêng biệt. Tại đây, Admin có thể khai báo học kỳ mới, chỉnh sửa thời gian và chỉ định đâu là "Học kỳ hiện tại".

## 7.3 Người dùng & vai trò

Chỉ Admin mới có quyền thao tác Thêm, Sửa và Đặt học kỳ hiện tại. Chức năng Xóa đã được vô hiệu hóa để bảo vệ tính toàn vẹn dữ liệu lịch sử của hệ thống.

## 7.4 Chức năng thêm học kỳ

### 7.4.1 Mô tả luồng chính

Tại khung "Quản lý Năm học - Học kỳ", Admin điền **Tên học kỳ**, chọn **Ngày bắt đầu** và **Ngày kết thúc** trên thanh công cụ thêm mới.

Nhấn nút **"+ Thêm Học Kỳ"**.

Hệ thống gửi request POST lên backend. Backend thực hiện hàng loạt kiểm tra xác thực (Validate) về định dạng tên và tính logic của thời gian.

Nếu hợp lệ, lưu vào cơ sở dữ liệu. Bảng danh sách học kỳ được tải lại, hiển thị dòng dữ liệu mới. Học kỳ mới thêm mặc định sẽ ở trạng thái "Đã đóng" (laHienTai = false).

### 7.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Tên học kỳ (TenHocKy) | Chuỗi ký tự | Có | Phải đúng format Regex quy định. Không được trùng. |
| Ngày bắt đầu (NgayBatDau) | Ngày (DateOnly) | Có | Phải nhỏ hơn ngày kết thúc. |
| Ngày kết thúc (NgayKetThuc) | Ngày (DateOnly) | Có | Phải lớn hơn ngày bắt đầu. |


### 7.4.3 Output(khi thành công)

Backend trả HTTP 200. Các ô nhập liệu được làm trống. Bảng danh sách làm mới với bản ghi mới hiển thị huy hiệu "Đã đóng".

### 7.4.4 Quy tắc nghiệp vụ

**Chuẩn hóa định dạng tên:** Tên học kỳ phải khớp tuyệt đối với Regex ^Học kỳ [1-3] \d{4}-\d{4}$. Ví dụ: *Học kỳ 1 2025-2026*.

Tên học kỳ là duy nhất, không phân biệt hoa thường.

**Ràng buộc thời gian cục bộ:** Ngày bắt đầu bắt buộc phải nhỏ hơn Ngày kết thúc.

**Ràng buộc thời gian hệ thống:** Ngày bắt đầu của học kỳ chuẩn bị tạo **phải lớn hơn** Ngày kết thúc của học kỳ gần nhất trong hệ thống (để chống chồng chéo thời gian).

Sử dụng Transaction Database (BeginTransactionAsync) để đảm bảo an toàn dữ liệu trong quá trình lưu.

### 7.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị |
| --- | --- |
| Để trống thông tin | "Tên học kỳ không được để trống" |
| Sai định dạng tên | "Tên học kỳ phải đúng định dạng: Học kỳ {1,2,3} {Năm}-{Năm} (VD: Học kỳ 1 2025-2026)" |
| Lỗi mốc thời gian cục bộ | "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" |
| Chồng chéo thời gian với HK trước | "Ngày bắt đầu phải lớn hơn ngày kết thúc của học kỳ gần nhất..." |


## 7.5 Chức năng cập nhật thông tin học kỳ

### 7.5.1 Mô tả luồng chính

Admin nhấn nút **Sửa** (màu vàng) trên một dòng trong bảng danh sách học kỳ.

Dòng được chọn chuyển sang dạng input inline cho phép nhập lại Tên, Ngày bắt đầu và Ngày kết thúc.

Admin sửa đổi dữ liệu và nhấn nút **Lưu** (màu xanh).

Hệ thống gửi request PUT, lưu cập nhật và hiển thị lại dòng dưới dạng văn bản tĩnh.

### 7.5.2 Input

Giống Input chức năng thêm học kỳ

### 7.5.3 Output(khi thành công)

Giống Output chức năng thêm học kỳ

### 7.5.4 Quy tắc nghiệp vụ

Áp dụng kiểm tra Regex cho Tên học kỳ giống như khi thêm mới.

Kiểm tra trùng lặp Tên học kỳ với các học kỳ *khác* (bỏ qua bản ghi đang sửa).

Vẫn áp dụng kiểm tra Ngày bắt đầu phải nhỏ hơn Ngày kết thúc.

*Ngoại lệ:* Để tránh dead-lock khi update lùi ngày, chức năng update bỏ qua validation chống chồng chéo với học kỳ quá khứ.

### 7.5.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị |
| --- | --- |
| Để trống thông tin | "Tên học kỳ không được để trống" |
| Sai định dạng tên | "Tên học kỳ phải đúng định dạng: Học kỳ {1,2,3} {Năm}-{Năm} (VD: Học kỳ 1 2025-2026)" |
| Lỗi mốc thời gian cục bộ | "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" |
| Chồng chéo thời gian với HK trước | "Ngày bắt đầu phải lớn hơn ngày kết thúc của học kỳ gần nhất..." |


## 7.6 Chức năng đặt học kỳ là học kỳ hiện tại

### 7.6.1 Mô tả luồng chính

Trong danh sách, những học kỳ đang có trạng thái "Đã đóng" sẽ có một nút **"Đặt hiện tại"**.

Admin nhấn vào nút "Đặt hiện tại" của học kỳ mong muốn.

Frontend gửi API PUT tới endpoint /{id}/set-current.

Backend sử dụng Transaction quét qua toàn bộ bảng HocKy, gỡ cờ LaHienTai = false ở tất cả các dòng, sau đó set LaHienTai = true cho học kỳ được chỉ định, rồi Commit.

Bảng giao diện cập nhật ngay lập tức: Học kỳ được chọn sáng màu xanh lá, hiện icon ngôi sao vàng và đổi huy hiệu thành "Hiện tại". Học kỳ cũ đổi về trạng thái "Đã đóng".

### 7.6.2 Quy tắc nghiệp vụ

**Tính độc quyền:** Tại bất kỳ thời điểm nào, toàn hệ thống **chỉ có tối đa một** học kỳ được đánh dấu là "Học kỳ hiện tại".

Nút "Đặt hiện tại" tự động bị ẩn đối với dòng đang là học kỳ hiện tại.

Hành động này tác động trực tiếp đến toàn hệ thống (như việc giảng viên tạo lớp học mới sẽ tự động lấy ID của học kỳ hiện tại).

## 7.7 Thông tin API

| API | Endpoint | Tham số / Body |
| --- | --- | --- |
| Lấy danh sách | GET /api/hocky | AllowAnonymous |
| Thêm Học kỳ mới | POST /api/hocky | { "tenHocKy": "str", "ngayBatDau": "YYYY-MM-DD", "ngayKetThuc": "YYYY-MM-DD" } |
| Cập nhật Học kỳ | PUT /api/hocky/{id} | Body giống như POST |
| Đặt làm Hiện tại | PUT /api/hocky/{id}/set-current | Rỗng (Không có body) |


**GIẢNG VIÊN**

# 8.Quản lý lớp môn học

## 8.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Lớp Môn Học |
| Thuộc module | Quản lý lớp môn học của Giảng Viên |
| Người sử dụng | Giảng viên |


## 8.2 Mô tả tổng quan

Chức năng Quản lý Lớp môn học cho phép Giảng viên tạo và quản lý các lớp học phần mà mình được phân công phụ trách. Thông qua giao diện dashboard, Giảng viên có thể xem thống kê tổng quan (tổng số lớp, sinh viên, nhóm), tìm kiếm lớp học, lọc theo học kỳ. Giảng viên có quyền thêm mới lớp, sửa thông tin lớp, xem chi tiết danh sách sinh viên tham gia, xóa sinh viên khỏi lớp và xóa toàn bộ lớp học (nếu chưa có dữ liệu phát sinh).

## 8.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Giảng viên | Chỉ được xem, tạo, sửa, xóa các lớp học do chính mình phụ trách. Không can thiệp được vào lớp của giảng viên khác. |
| Sinh viên | Chỉ có quyền xem thông tin và tham gia vào lớp bằng "Mã lớp học", không có quyền quản trị. |


## 8.4 Chức năng tạo lớp mới

### 8.4.1 Mô tả luồng chính

Giảng viên nhấn nút **"+ Tạo lớp mới"** trên màn hình Quản lý lớp học.

Một popup (modal) xuất hiện yêu cầu nhập thông tin: *Tên môn học*, chọn *Học kỳ*, *Ngày bắt đầu*, *Ngày kết thúc*. Mã lớp học sẽ bị mờ đi vì hệ thống tự sinh.

Giảng viên điền thông tin và nhấn nút **"Tạo lớp học"**.

Hệ thống gửi request POST lên backend. Backend xác thực dữ liệu, kiểm tra tính hợp lệ của thời gian và tự động tạo ra một **Mã tham gia lớp (Class Code)** ngẫu nhiên và duy nhất.

Nếu thành công, modal đóng lại, danh sách lớp học tải lại và hiển thị thông báo chứa Mã lớp vừa tạo để giảng viên gửi cho sinh viên.

### 8.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Tên môn học (TenLop) | Chuỗi ký tự | Có | Không được trống. |
| Học kỳ (MaHocKy) | Số nguyên | Có | Lấy từ dropdown danh sách học kỳ có trong hệ thống. |
| Ngày bắt đầu | Date | Có | Nằm trong khoảng thời gian của Học kỳ đã chọn. |
| Ngày kết thúc | Date | Có | Nằm trong khoảng thời gian của Học kỳ đã chọn và phải lớn hơn Ngày bắt đầu. |


### 8.4.3 Output(khi thành công)

Backend trả HTTP 200: *"Tạo lớp thành công"* kèm thông tin `maLop` và `maLopHoc` (Mã join lớp). Màn hình xuất hiện thông báo Alert và làm mới danh sách bảng.

### 8.4.4 Quy tắc nghiệp vụ

Chỉ có **Giảng viên** (Role = 2) mới được tạo lớp học.

**Chống trùng lặp:** Một giảng viên **không được** tạo 2 lớp học có trùng *Tên môn học* trong cùng 1 *Học kỳ*. (Nếu có 2 ca, phải đặt tên phân biệt VD: Lập trình Web - Ca 1).

**Ràng buộc thời gian:** Ngày bắt đầu và kết thúc của lớp học **không được** nằm ngoài khoảng thời gian bắt đầu và kết thúc của Học kỳ chứa nó.

**Sinh mã tự động:** Backend tự động tạo ra một chuỗi ngẫu nhiên 6 ký tự gồm chữ hoa và số làm `MaLopHoc` (Class code).

### 8.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Trùng tên lớp học | "Bạn đã tạo một lớp học tên '...' trong học kỳ này rồi. Vui lòng đặt tên khác..." |
| Lỗi logic ngày tháng | "Ngày kết thúc phải sau ngày bắt đầu" |
| Lỗi ngày tháng ngoài Học kỳ | "Ngày bắt đầu/kết thúc lớp học không được trước/sau ngày bắt đầu/kết thúc học kỳ..." |


## 8.5 Chức năng cập nhật thông tin lớp

### 8.5.1 Mô tả luồng chính

Giảng viên nhấn icon **Chỉnh sửa (bút cam)** trên dòng lớp học cần sửa.

Modal chỉnh sửa hiện lên với thông tin hiện tại. Ô `Mã lớp học` không cho phép chỉnh sửa.

Giảng viên cập nhật Tên môn học, Học kỳ, Thời gian và nhấn **Lưu thay đổi**.

Hệ thống gửi request PUT, nếu hợp lệ sẽ ghi đè vào database và tải lại giao diện.

### 8.5.2 Input

Tương tự chức năng tạo mới. Yêu cầu truyền `maLop` qua tham số URL.

### 8.5.3 Output(khi thành công)

Backend trả HTTP 200: *"Cập nhật lớp học thành công"*. Frontend đóng modal và làm mới bảng dữ liệu.

### 8.5.4 Quy tắc nghiệp vụ

**Mã lớp học (Code tham gia)** là cố định, tuyệt đối không được thay đổi vì sinh viên đang dùng mã này.

Giảng viên chỉ được sửa lớp do **chính mình tạo**. Hệ thống sẽ chặn nếu có hành vi chọc API sửa lớp người khác.

Các quy tắc về chống trùng tên lớp và ràng buộc thời gian với học kỳ áp dụng y hệt như chức năng Tạo lớp (Bỏ qua chính lớp đang sửa khi check trùng lặp).

### 8.5.5 Xử lý lỗi

Xử lý lỗi ngày tháng, rỗng, trùng tên giống hệt chức năng 8.4.5. Trả về mã HTTP 400 kèm thông báo tương ứng.

## 8.6 Chức năng Xóa lớp

### 8.6.1 Mô tả luồng chính

Giảng viên nhấn icon **Xóa (thùng rác đỏ)** ở cuối dòng lớp học tương ứng.

Trình duyệt hiện cảnh báo: *"Bạn có chắc muốn xóa lớp học này?"*.

Giảng viên chọn OK. Hệ thống gửi request DELETE lên Backend.

Backend kiểm tra xem lớp đã có sinh viên join vào hay có đề tài/nhóm nào chưa. Nếu chưa có, bản ghi được xóa. Ngược lại, báo lỗi không cho xóa.

### 8.6.2 Input

Mã định danh ID của lớp (`maLop`) truyền qua URL param.

### 8.6.3 Output(khi thành công)

Hiển thị alert *"Xóa lớp học thành công!"* và dòng dữ liệu đó biến mất khỏi màn hình

### 8.6.4 Quy tắc nghiệp vụ

**Ràng buộc vĩnh viễn:** KHÔNG THỂ XÓA lớp học nếu lớp đó đã có Sinh viên tham gia, hoặc đã tạo Nhóm, hoặc đã tạo Đề tài. Điều này để chống mất dữ liệu học tập.

Chỉ cho phép xóa các lớp học **hoàn toàn trống** (thường là xóa ngay sau khi vừa tạo nhầm).

### 8.6.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Lớp đã phát sinh dữ liệu | Backend trả HTTP 400: "Không thể xóa lớp đã có sinh viên, nhóm hoặc đề tài" |


## 8.7 Chức năng xóa sinh viên ra khỏi lớp

### 8.7.1 Mô tả luồng chính

Giảng viên nhấn icon **Xem chi tiết (hình con mắt)** của một lớp học.

Modal chi tiết lớp học hiện ra, bên dưới là danh sách sinh viên đang tham gia lớp.

Giảng viên nhấn nút **"Xóa"** (màu đỏ) ở cột thao tác trên dòng của sinh viên muốn loại bỏ.

Hệ thống hiện xác nhận *"Bạn có chắc muốn xóa sinh viên [Tên] khỏi lớp này?"*

Sau khi đồng ý, hệ thống gọi API DELETE để gỡ sinh viên. Danh sách tải lại ngay lập tức hiển thị sự biến mất của sinh viên đó.

### 8.7.2 Input

| Trường | Ghi chú |
| --- | --- |
| Mã Lớp (maLop) | URL parameter |
| Mã Sinh viên (maSinhVien) | URL parameter (`maNguoiDung` của SV) |


### 8.7.3 Output(khi thành công)

Backend trả HTTP 200: *"Xóa sinh viên khỏi lớp thành công"*. Sinh viên bị mất quyền truy cập vào lớp học này.

### 8.7.4 Quy tắc nghiệp vụ

Chỉ giảng viên phụ trách lớp mới có quyền kick/xóa sinh viên khỏi lớp.

**Cập nhật dây chuyền (Cascade logic):** Nếu sinh viên bị kick đang thuộc về một **Nhóm** nào đó trong lớp này, hệ thống sẽ tự động gỡ sinh viên đó ra khỏi nhóm.

Nếu sinh viên bị kick đang là **Nhóm trưởng**, hệ thống sẽ tự động hạ quyền và thiết lập nhóm đó trở về trạng thái không có nhóm trưởng (`MaNhomTruong = null`).

### 8.7.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Sai thẩm quyền | "Chỉ giảng viên phụ trách mới được xóa sinh viên khỏi lớp" |
| Sinh viên không tồn tại trong lớp | "Sinh viên không có trong lớp học này" |


## 8.8 Thông tin API

| API | Endpoint | Body / Tham số |
| --- | --- | --- |
| Lấy tất cả lớp học (Admin) | GET /api/lophoc | Trả về toàn bộ lớp học trong hệ thống. |
| Lấy danh sách lớp của tôi | GET /api/lophoc/cua-toi | Dựa vào Token (GV: lớp do mình dạy, SV: lớp đã tham gia). |
| Chi tiết lớp học | GET /api/lophoc/{id} | Trả về danh sách SV, danh sách Nhóm, Đề tài và thông tin GV. |
| Lấy SV chưa có nhóm | GET /api/lophoc/{maLop}/sinhvien-chua-co-nhom | Trả về danh sách SV đã tham gia lớp nhưng chưa vào nhóm nào. |
| Lấy DS Giảng viên | GET /api/lophoc/giangvien | Trả về danh sách giảng viên dùng cho dropdown lọc. |
| Lấy DS Học kỳ | GET /api/lophoc/hocky | Trả về danh sách học kỳ dùng cho dropdown lọc. |
| Tạo lớp mới | POST /api/lophoc | { "tenLop": "str", "maHocKy": int, "ngayBatDau": "date", "ngayKetThuc": "date" } |
| SV tham gia lớp | POST /api/lophoc/tham-gia | { "maLopHoc": "CLASS_CODE" }. Token JWT xác định SV. |
| Cập nhật thông tin lớp | PUT /api/lophoc/{id} | Body giống như POST |
| Chốt / Mở chốt nhóm | PUT /api/lophoc/{maLop}/chot-nhom | { "trangThaiChot": bool } |
| Xóa lớp học | DELETE /api/lophoc/{id} | Rỗng |
| Xóa SV khỏi lớp | DELETE /api/lophoc/{maLop}/sinhvien/{maSV} | Rỗng |


# 9.Quản lý nhóm học tập

## 9.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Nhóm Học Tập |
| Thuộc module | Giảng Viên |
| Người sử dụng | Giảng viên |


## Mô tả tổng quan

Module Quản lý nhóm học tập cung cấp công cụ để Giảng viên tổ chức sinh viên thành các nhóm nhỏ trong từng Lớp học phần. Giảng viên có thể linh hoạt quản lý với các tính năng: tạo nhóm mới, phân nhóm ngẫu nhiên tự động, điều phối sinh viên thủ công, chỉ định nhóm trưởng và "Chốt" danh sách nhóm để khóa các thao tác thay đổi nhân sự từ phía sinh viên. Mọi thông tin được hiển thị trực quan thông qua các Card nhóm

## Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Giảng viên | Toàn quyền: Tạo, Xóa, Sửa, Phân bổ thành viên, Chốt danh sách đối với các lớp do mình phụ trách. |
| Sinh viên | (Trong giao diện riêng): Được quyền tự tham gia/rời nhóm khi Giảng viên chưa "Chốt" danh sách. |


## 9.4 Chức năng tạo nhóm học tập

### 9.4.1 Mô tả luồng chính

Tại tab "Quản lý nhóm học tập", Giảng viên nhấn nút **"+ Tạo nhóm mới"**.

Modal form xuất hiện yêu cầu điền: *Tên nhóm*, *Số thành viên tối đa*, và chọn *Lớp học* chứa nhóm đó.

Giảng viên nhấn **"Tạo nhóm"**.

Hệ thống gửi request POST lên backend. Backend kiểm tra tính hợp lệ của dữ liệu, đảm bảo không bị trùng tên nhóm trong cùng một lớp.

Giao diện đóng popup, tải lại danh sách nhóm và hiển thị Card của nhóm vừa tạo (trạng thái chưa có thành viên).

### 9.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Tên nhóm (TenNhom) | Chuỗi ký tự | Có | Không được trùng với tên nhóm đã có trong cùng Lớp học đó. |
| Số TV tối đa (SoThanhVienToiDa) | Số nguyên | Có | Giới hạn từ 2 đến 10 thành viên. |
| Thuộc lớp (MaLop) | Số nguyên | Có | Dropdown danh sách lớp do GV phụ trách. |


### 9.4.3 Output(khi thành công)

Backend trả HTTP 200: *"Tạo nhóm thành công"* kèm maNhom. Frontend hiển thị alert thành công.

### 9.4.4 Quy tắc nghiệp vụ

Giảng viên chỉ được tạo nhóm cho lớp do chính mình phụ trách.

Hệ thống chặn tạo trùng Tên nhóm trong phạm vi 1 Lớp học (VD: Không thể có 2 "Nhóm 1" trong cùng lớp Web, nhưng có thể có "Nhóm 1" ở lớp Web và "Nhóm 1" ở lớp C++).

Nhóm mới được tạo ra chưa có nhóm trưởng (MaNhomTruong = null).

### 9.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Trùng tên nhóm | "Tên nhóm đã tồn tại trong lớp này" |
| Số lượng không hợp lệ | "Số thành viên tối đa phải từ 2 đến 10!" |


## 9.5 Chức năng phân nhóm ngẫu nhiên

### 9.5.1 Mô tả luồng chính

Giảng viên nhấn nút **"Phân nhóm ngẫu nhiên"** trên thanh công cụ.

Modal mở ra yêu cầu Giảng viên chọn Lớp học.

Giảng viên nhấn nút **"Phân nhóm ngẫu nhiên"**.

Backend truy xuất toàn bộ Sinh viên trong lớp *chưa có nhóm*, xáo trộn danh sách (randomize), sau đó lần lượt lấp đầy vào các Nhóm hiện đang còn trống chỗ trong lớp đó.

Khi hoàn tất, hiển thị kết quả phân bổ.

### 9.5.2 Quy tắc nghiệp vụ

**Điều kiện tiên quyết:** Lớp học phải có sẵn sinh viên và Giảng viên phải tự tạo ra các Nhóm rỗng (hoặc nhóm còn thiếu chỗ) trước. Hệ thống không tự sinh ra nhóm mới.

Hệ thống ưu tiên bảo toàn dữ liệu: Bỏ qua những sinh viên đã có nhóm. Chỉ phân nhóm cho sinh viên chưa có nhóm.

Thuật toán duyệt qua từng nhóm, nếu nhóm chưa đạt SoThanhVienToiDa thì nhét sinh viên vào đến khi đầy thì qua nhóm tiếp theo

### 9.5.3 Xử lý lỗi

Nếu chưa tạo nhóm nào: *"Chưa có nhóm rỗng nào được tạo. Vui lòng tạo nhóm trước."*

Nếu tất cả SV đã có nhóm: *"Tất cả sinh viên trong lớp đã có nhóm"*.

## 9.6 Chức năng phân nhóm thủ công (thêm sinh viên vào nhóm thủ công)

### 9.6.1 Mô tả luồng chính

Trên Card của một nhóm cụ thể, Giảng viên nhấn nút **"+" (Thêm sinh viên)**.

Modal xuất hiện. Hệ thống gọi API lấy danh sách toàn bộ Sinh viên thuộc lớp đó **nhưng chưa tham gia bất kỳ nhóm nào**.

Giảng viên chọn một sinh viên từ Dropdown và nhấn "Thêm vào nhóm".

Backend cập nhật bảng ThanhVienNhom. Danh sách hiển thị trên Card nhóm cập nhật ngay lập tức.

### 9.6.2 Quy tắc nghiệp vụ

Giảng viên **KHÔNG THỂ** thao tác nút "+" trên giao diện nếu lớp học đang ở trạng thái **"Đã chốt nhóm"** (Nút bị làm mờ, click vào sẽ báo lỗi).

Một sinh viên chỉ được phép tồn tại trong **tối đa 1 nhóm** của 1 lớp học. (Không thể vừa ở Nhóm 1 vừa ở Nhóm 2).

Không thể thêm sinh viên nếu nhóm đã đạt giới hạn SoThanhVienToiDa.

### 9.6.3 Xử lý lỗi

Nếu thêm sinh viên vào nhóm đã đủ thành viên : “Nhóm đã đủ thành viên”

## 9.7 Chức năng xóa nhóm

### 9.7.1 Mô tả luồng chính

Giảng viên nhấn nút **"Xóa nhóm" (Màu đỏ)** ở dưới cùng của Card nhóm.

Popup xác nhận của trình duyệt hiện ra.

Đồng ý -> Backend thực thi xóa bản ghi nhóm khỏi cơ sở dữ liệu.

Card nhóm biến mất khỏi màn hình quản lý.

### 9.7.2 Quy tắc nghiệp vụ

Giảng viên không thể xóa nhóm khi nhóm đã có sinh viên trong nhóm

Giảng viên chỉ có thể xóa nhóm khi nhóm rỗng

### 9.7.5 Xử lý lỗi

Nếu xóa nhóm còn sinh viên : “không thể xóa nhóm khi còn sinh viên trong nhóm”

## 9.8 Chức năng xóa sinh viên ra khỏi nhóm

### 9.8.1 Mô tả luồng chính

Trong danh sách thành viên của Card nhóm, Giảng viên nhấn icon **"User Minus**** -****" (Màu đỏ)** bên cạnh tên sinh viên.

Xác nhận hành động xóa.

Backend gỡ liên kết sinh viên khỏi nhóm.

### 9.8.2 Quy tắc nghiệp vụ

Giao diện (Nút xóa) bị vô hiệu hóa khi Lớp học đang ở trạng thái **"Đã chốt danh sách"**.

**Ràng buộc logic cực kỳ quan trọng:** Giảng viên **KHÔNG THỂ** xóa một sinh viên nếu sinh viên đó đang được giữ chức vụ **Trưởng nhóm**. Backend sẽ chặn với mã lỗi HTTP 400.

Cách giải quyết: Phải chỉ định sinh viên khác làm trưởng nhóm (hoặc gỡ chức trưởng nhóm xuống "Chưa có") rồi mới được xóa sinh viên đó.

### 9.8.5 Xử lý lỗi

Nếu giảng viên xóa sinh viên đang là nhóm trưởng :” Sinh viên này đang là trưởng nhóm, không thể xóa được. Vui lòng chỉ định nhóm trưởng khác hoặc gỡ chức trưởng nhóm trước khi xóa.”

## 9.9 Chức năng chốt danh sách nhóm

### 9.9.1 Mô tả luồng chính

Giảng viên nhấn nút **"Chốt ds nhóm"** (Nút màu xanh navy) trên thẻ của bất kỳ nhóm nào thuộc Lớp học đó.

Hệ thống gửi request PUT đảo ngược trạng thái `ChoPhepDangKyNhom` của **TOÀN BỘ LỚP HỌC ĐÓ** về false.

Giao diện thay đổi:

Các nút Thêm SV (+), Xóa SV (-) disable không thao tác được

Nút Chỉ định nhóm trưởng  thao tác được

Để thay đổi lại, GV nhấn nút **"Mở chốt nhóm"** (Nút xanh lá).

### 9.9.2 Quy tắc nghiệp vụ

Thao tác "Chốt" là thao tác ở cấp độ **Lớp học**, không phải cấp độ từng Nhóm đơn lẻ. Khi chốt, toàn bộ nhóm trong lớp đó đều bị phong tỏa nhân sự.

Khi đã chốt:

Giảng viên không thể thêm, xóa thành viên từ giao diện UI.

Sinh viên không thể tự tham gia hay tự rời khỏi nhóm.

Giảng viên có thể chỉ định nhóm trưởng  hoặc gỡ bỏ chức nhóm trưởng

## 9.10 Chức năng chỉ định nhóm trưởng

### 9.10.1 Mô tả luồng chính

Giảng viên nhấn nút **"Chỉ định trưởng" (Màu vàng)** trên Card nhóm.

Modal hiển thị danh sách các thành viên hiện tại của nhóm đó.

Giảng viên chọn tên một sinh viên từ Dropdown và nhấn lưu.

Badge "Trưởng nhóm" sẽ xuất hiện cạnh tên sinh viên đó trên Card.

### 9.10.2 Quy tắc nghiệp vụ

Chức năng này sẽ được thao tác  trên UI nếu nhóm đã **"Chốt nhóm"**.

Chỉ có thể chọn sinh viên đang là thành viên của nhóm.

Giảng viên có thể chọn "-- Chọn thành viên --" (tương đương null) để gỡ bỏ chức danh trưởng nhóm của nhóm đó.

## 9.11 Thông tin API

| Chức năng | Method | Endpoint | Body / Ghi chú |
| --- | --- | --- | --- |
| Lấy DS Nhóm theo lớp | GET | /api/nhom?maLop={id} | Trả về ds nhóm kèm thành viên và thông tin trưởng nhóm |
| Lấy DS Nhóm của tôi | GET | /api/nhom/cua-toi | Trả về các nhóm SV đang tham gia (cần Token) |
| Chi tiết nhóm | GET | /api/nhom/{maNhom} | Trả về thông tin nhóm + danh sách thành viên |
| Tạo Nhóm | POST | /api/nhom | { "tenNhom", "maLop", "soThanhVienToiDa" } |
| Thêm Thành Viên | POST | /api/nhom/{id}/themthanhvien | { "maSinhVien": int } |
| Thêm Đề tài cho nhóm | POST | /api/nhom/{maNhom}/detai | { "tenDeTai", "moTa", "sanPhamKyVong", "ngayBatDau", "ngayKetThuc" } |
| Phân nhóm ngẫu nhiên | POST | /api/nhom/phan-nhom-ngau-nhien | { "maLop": int } |
| Chỉ định Trưởng | PUT | /api/nhom/{id}/nhomtruong | { "maSinhVien": int&#124;null } |
| Chốt Nhóm | PUT | /api/lophoc/{maLop}/chot-nhom | { "trangThaiChot": bool } |
| SV rời nhóm | DELETE | /api/nhom/{maNhom}/roinhom | Rỗng. Lấy mã SV từ Token JWT. |
| Xóa Thành Viên | DELETE | /api/nhom/{id}/xoathanhvien/{svId} | Sẽ lỗi 400 nếu svId đang là trưởng nhóm |
| Xóa Nhóm | DELETE | /api/nhom/{id} | Rỗng. Chỉ xóa nhóm rỗng. |


# 10.Quản lý đề tài

## 10.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Đề Tài |
| Thuộc module | Giảng Viên |
| Người sử dụng | Giảng viên |


## 10.2 Mô tả tổng quan

Module Quản lý Đề tài cung cấp không gian để Giảng viên khởi tạo và lưu trữ danh sách các đề tài/bài tập lớn cho từng môn học. Điểm nổi bật của module là khả năng đính kèm tài liệu hướng dẫn và cung cấp cơ chế phân phối đề tài linh hoạt: Giảng viên có thể tự **Chỉ định trực tiếp** đề tài cho một nhóm cụ thể hoặc thiết lập trạng thái **Đăng ký tự do** để các nhóm trưởng tự do "tranh" đề tài.

## 10.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Giảng viên | Có toàn quyền: Thêm, sửa, xóa đề tài, tải lên tài liệu đính kèm, quyết định phương thức giao đề tài (Chỉ định hoặc Tự do). |
| Sinh viên / Nhóm trưởng | Chỉ được xem danh sách đề tài. Nếu đề tài ở trạng thái "Đăng ký tự do", Nhóm trưởng mới có quyền bấm đăng ký nhận đề tài cho nhóm mình. |


## 10.4 Chức năng tạo đề tài

### 10.4.1 Mô tả luồng chính

Tại giao diện Quản lý đề tài, Giảng viên nhấn nút **"+ Tạo đề tài mới"**.

Hệ thống hiển thị popup (modal) chứa form nhập liệu: Tên đề tài, Mô tả, Sản phẩm kỳ vọng, Lớp học, Thời gian thực hiện, và khu vực tải file đính kèm.

Giảng viên điền đầy đủ thông tin, kéo thả hoặc chọn file tài liệu hướng dẫn (nếu có).

Nhấn nút **"Tạo đề tài"**. Trình duyệt tự động validate dung lượng/định dạng file và các ràng buộc ngày tháng.

Nếu hợp lệ, dữ liệu được đóng gói vào `FormData` gửi lên Backend. Backend lưu thông tin và tệp đính kèm, phương thức giao mặc định sẽ là *"Đăng ký tự do"*.

### 10.4.2 Input

| Trường | Bắt buộc | Ghi chú & Ràng buộc |
| --- | --- | --- |
| Tên đề tài | Có | Tối đa 100 ký tự. |
| Mô tả yêu cầu | Có | Tối đa 255 ký tự. |
| Sản phẩm kỳ vọng | Có | Tối đa 100 ký tự (VD: Website + Báo cáo). |
| Ngày Bắt đầu & Kết thúc | Có | Phải nằm trong khoảng thời gian của Lớp học (và Học kỳ). |
| File đính kèm | Không | Chỉ nhận định dạng: `.txt, .docx, .pdf`. Dung lượng tối đa: 5MB. |


### 10.4.3 Output(khi thành công)

Backend trả HTTP 200: *"Tạo **đề tài ** thành công"*. Frontend hiển thị alert thành công khi giảng viên chọn lớp môn học cụ thể .

### 10.4.4 Quy tắc nghiệp vụ

**Ràng buộc thời gian (Strict Date Validation):** Hệ thống thực hiện kiểm tra chéo 3 lớp thời gian:

Ngày bắt đầu đề tài **phải trước** Ngày kết thúc đề tài.

Khoảng thời gian thực hiện đề tài **không được nằm ngoài** khoảng thời gian bắt đầu/kết thúc của **Lớp học**.

(Bắc cầu) Thời gian đề tài cũng không được vượt qua giới hạn của **Học kỳ** hiện tại.

**Giới hạn File Client-side:** Frontend chặn ngay lập tức (không cho upload) nếu người dùng chọn file > 5MB hoặc sai định dạng cho phép.

### 10.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị |
| --- | --- |
| Sai thời gian so với Lớp | "Ngày bắt đầu đề tài không được trước ngày bắt đầu lớp (...)" |
| File không hợp lệ | "Định dạng không được phép. Chỉ chấp nhận: .txt, .docx, .pdf" hoặc "File vượt quá 5MB." |


## 10.5 Chức năng cập nhật thông tin đề tài

### 10.5.1 Mô tả luồng chính

Giảng viên nhấn icon **Chỉnh sửa (bút cam)** trên Card đề tài.

Modal form mở ra, tải sẵn các thông tin cũ. Kèm theo link xem lại/tải xuống file đính kèm hiện tại (nếu có).

Giảng viên có thể sửa nội dung văn bản hoặc chọn một file mới để **thay thế** (ghi đè) file cũ.

Nhấn **"Lưu thay đổi"**. Dữ liệu được đẩy lên backend bằng method PUT kèm `FormData`.

### 10.5.2 Quy tắc nghiệp vụ

Áp dụng lại toàn bộ bộ Validation về độ dài ký tự, giới hạn thời gian (so với lớp) và định dạng file giống như lúc tạo mới.

Nếu Giảng viên không chọn file mới, Backend vẫn giữ nguyên file cũ không thay đổi.

### 10.5.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị |
| --- | --- |
| Sai thời gian so với Lớp | "Ngày bắt đầu đề tài không được trước ngày bắt đầu lớp (...)" |
| File không hợp lệ | "Định dạng không được phép. Chỉ chấp nhận: .txt, .docx, .pdf" hoặc "File vượt quá 5MB." |


## 10.6 Chức năng Xóa đề tài

### 10.6.1 Mô tả luồng chính

Giảng viên nhấn icon **Xóa (thùng rác đỏ)**. Trình duyệt hiện cảnh báo xác nhận.

Sau khi xác nhận, gửi request DELETE lên Backend. Nếu đủ điều kiện, bản ghi bị xóa, card đề tài biến mất.

### 10.6.2 Quy tắc nghiệp vụ

**Bảo vệ dữ liệu (Cascade Constraint):** Hệ thống **NGĂN CHẶN** việc xóa một đề tài nếu đề tài đó **Đã có nhóm đăng ký hoặc được chỉ định**.

### 10.6.3 Xử lý lỗi

Trường hợp cố tình xóa, Backend sẽ trả mã lỗi 400 kèm dòng thông báo: *"Không thể xóa đề tài đã có nhóm đăng ký"*. (GV muốn xóa phải gỡ đề tài khỏi nhóm trước).

## 10.7 Chức năng giao đề tài (chỉ định / đăng ký tự do)

### 10.7.1 Mô tả luồng chính

Giảng viên nhấn nút **"Giao đề tài" (Icon chia sẻ)** trên Card đề tài.

Modal xuất hiện cung cấp 2 tùy chọn radio button: **Chỉ định trực tiếp** và **Đăng ký tự do**.

**Tùy chọn A (Đăng ký tự do):** GV chọn và bấm Lưu. Đề tài sẽ chuyển trạng thái, mở cửa cho các nhóm trưởng của các nhóm đăng ký đề tài.

**Tùy chọn B (Chỉ định trực tiếp):** Giao diện xuất hiện thêm một Dropdown danh sách các Nhóm trong lớp. GV chọn một nhóm cụ thể rồi bấm Lưu. Đề tài lập tức bị "khóa" lại cho nhóm đó.

### 10.7.4 Quy tắc nghiệp vụ

**Cơ chế "Đăng ký tự do":**

Nếu GV chuyển một đề tài từ đang có nhóm sang "Đăng ký tự do", Backend sẽ **tự động gỡ bỏ** tất cả các nhóm đang liên kết với đề tài này (set MaDeTai = null cho các nhóm đó) để đưa đề tài về trạng thái rỗng.

Chỉ có nhóm trưởng mới có thể đăng ký đề tài , theo quy tắc ai đăng ký sớm thì đề tài thuộc về nhóm đó .Sau khi đăng ký , thì nhóm không thể thay đổi đề tài .

**Cơ chế "Chỉ định trực tiếp":**

Giảng viên có thể chọn "-- Chọn nhóm để chỉ định / Gỡ nhóm --" (Gửi lên `maNhom = 0` hoặc null) để tước đề tài khỏi nhóm hiện tại mà không chuyển sang chế độ tự do.

Nếu nhóm được chỉ định **đã có một đề tài khác**, hệ thống sẽ báo lỗi: *"Nhóm X đã có đề tài khác"*. GV không thể ép 1 nhóm làm 2 đề tài.

Nếu đề tài này đang thuộc về Nhóm A, nhưng GV lại chỉ định nó cho Nhóm B, Backend sẽ **tự động tước đề tài** khỏi Nhóm A và chuyển quyền sở hữu sang Nhóm B.

### 10.7.5 Xử lý lỗi

Khi giảng viên chỉ định cho 1 nhóm đã có đề tài trước đó : “*Nhóm X đã có đề tài khác*”

## 10.8 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Lấy tất cả đề tài | GET | /api/detai | AllowAnonymous. Trả về toàn bộ đề tài. |
| Tìm kiếm đề tài | GET | /api/detai/{id} | Tìm theo mã hoặc tên đề tài (không phân biệt hoa thường). |
| Lấy DS đề tài theo Lớp | GET | /api/detai/lop/{maLop} | Trả về cả thông tin nhóm đang nhận đề tài đó (nếu có). |
| Tạo đề tài mới | POST | /api/detai | Sử dụng FormData (hỗ trợ multipart/form-data để đẩy file đính kèm). |
| Cập nhật giao đề tài | POST | /api/detai/cap-nhat-giao | { "maDeTai": int, "maNhom": int&#124;null, "phuongThucGiao": str } |
| Sinh viên đăng ký | POST | /api/detai/dang-ky | { "maDeTai": int, "maLop": int }. Kiểm tra phải là Trưởng nhóm. |
| Cập nhật đề tài | PUT | /api/detai/{id} | Body JSON: { "tenDeTai", "moTa", "sanPhamKyVong", "ngayBatDau", "ngayKetThuc" } |
| Xóa đề tài | DELETE | /api/detai/{id} | Chặn nếu đề tài đang có nhóm (400 Bad Request). |


**SINH VIÊN**

# 11.Lớp học

## 11.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Quản Lý Lớp Học (Sinh viên) |
| Thuộc module | Sinh Viên |
| Người sử dụng | Sinh viên |


## 11.2 Mô tả tổng quan

Module Lớp học ở góc độ Sinh viên hiển thị danh sách các lớp học phần (môn học) mà sinh viên đang tham gia. Giao diện dạng lưới (grid) chứa các Thẻ lớp học (Class Card) trực quan. Chức năng quan trọng nhất của module này là cho phép sinh viên **tự động ghi danh** vào một lớp học mới thông qua **Mã tham gia lớp (Class Code)** do Giảng viên cung cấp. Ngoài ra, module cũng hiển thị các lời mời tham gia nhóm (nếu có).

## 11.3  Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Sinh viên (Role = 3) | Có quyền xem danh sách lớp học của mình, sử dụng Class Code để join vào lớp học mới, và xem chi tiết thông tin lớp (Giảng viên, thành viên, đề tài). |
| Giảng viên (Role = 2) | Là người cung cấp mã Class Code (được tự động sinh khi GV tạo lớp) cho sinh viên thông qua các kênh liên lạc. |


## 11.4 chức năng tham gia lớp môn học bằng class code

### 11.4.1 Mô tả luồng chính

Tại giao diện "Lớp học của tôi", Sinh viên nhấn vào biểu tượng/nút **"Tham gia lớp"** hoặc biểu tượng **Dấu cộng (+)**.

Hệ thống hiển thị một Modal (Hộp thoại) yêu cầu nhập **Mã lớp (Class Code)**.

Sinh viên nhập chuỗi mã được giảng viên cung cấp và nhấn nút **"Tham gia"**.

Hệ thống Frontend gọi API classService.joinClass(code) gửi request POST lên Backend.

Backend kiểm tra xem mã lớp có tồn tại, lớp còn hoạt động và sinh viên đã ở trong lớp chưa. Nếu tất cả hợp lệ, Backend ghi nhận sinh viên vào bảng liên kết giữa Người dùng và Lớp học.

Frontend đóng Modal, hiển thị Alert thông báo thành công và tự động tải lại danh sách hiển thị Thẻ lớp học mới vừa tham gia.

### 11.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã lớp học (MaLopHoc) | Chuỗi ký tự (String) | Có | Thường là chuỗi ngẫu nhiên 6-8 ký tự do Backend sinh ra. Không phân biệt khoảng trắng thừa do Frontend có tính năng tự động .trim() trước khi gửi. |


### 11.4.3 Output(khi thành công)

Backend trả HTTP 200 xác nhận join lớp thành công. Frontend hiển thị Alert: *"Đã tham gia lớp: [Mã lớp] thành công!"*. Giao diện danh sách lớp học được làm mới (refresh) và xuất hiện Class Card của lớp đó.

### 11.4.4 Quy tắc nghiệp vụ

**Ràng buộc xác thực:** Mã lớp phải khớp chính xác tuyệt đối với trường MaLopHoc lưu trong cơ sở dữ liệu.

**Chống trùng lặp (Idempotent):** Nếu sinh viên **đã tham gia** lớp học này từ trước, hệ thống sẽ ngăn chặn việc join lại để tránh dư thừa dữ liệu.

Sinh viên được định danh tự động thông qua Token JWT (lấy MaNguoiDung từ Claim), không cần tự truyền ID của mình.

### 11.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị / Xử lý |
| --- | --- |
| Bỏ trống trường nhập liệu | Frontend hiển thị text đỏ: "Vui lòng nhập mã lớp." Ngăn gửi API. |
| Sai mã / Mã không tồn tại | Backend trả lỗi. Frontend hiển thị: "Mã lớp không tồn tại hoặc đã đầy." |
| Đã tham gia từ trước | Backend trả lỗi HTTP 400. Frontend hiển thị thông báo tương ứng từ Server: "Bạn đã là thành viên của lớp này". |


## 11.5 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Tham gia lớp học | POST | /api/lophoc/tham-gia | { "maLopHoc": "MÃ_CODE" }. Token JWT dùng để xác định Sinh viên. |
| Lấy DS Lớp của tôi | GET | /api/lophoc/cua-toi | Cần Token. Lọc các lớp mà sinh viên đang tham gia. |
| Lấy Chi tiết Lớp học | GET | /api/lophoc/{maLop} | Lấy thông tin chung, nhóm, đề tài và giảng viên. |


# 12. Nhóm học tập

## 12.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Nhóm Học Tập (Sinh viên) |
| Thuộc module | Sinh Viên |
| Người sử dụng | Sinh viên |


## 12.2 Mô tả tổng quan

Module Nhóm học tập dành cho Sinh viên cung cấp giao diện để sinh viên theo dõi các nhóm mình đang tham gia trong các lớp học phần. Tại đây, sinh viên có thể xem danh sách các nhóm đang tuyển thành viên và thực hiện **Tham gia (đăng ký) nhóm tự do** hoặc **Rời nhóm** đang tham gia, **Yêu cầu chuyển nhóm** khi muốn sang nhóm khác. Mọi thao tác này đều phụ thuộc vào trạng thái "Chốt danh sách" do Giảng viên thiết lập.

## 12.3  Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Sinh viên | Có quyền tự do tham gia vào các nhóm còn trống chỗ và tự rời khỏi nhóm của mình, với điều kiện Giảng viên chưa khóa/chốt danh sách nhóm của lớp đó. Có quyền yêu cầu chuyển nhóm gửi giảng viên và đợi duyệt yêu cầu |
| Giảng viên | Là người điều khiển tổng: nếu Giảng viên "Chốt nhóm", toàn bộ quyền Đăng ký/Rời nhóm của Sinh viên sẽ bị vô hiệu hóa.<br>Là người duyệt yêu cầu chuyển nhóm của sinh viên , giảng viên có quyền phê duyệt hoặc từ chối yêu cầu |


## 12.4 chức năng tham gia đăng ký nhóm tự do

### 12.4.1 Mô tả luồng chính

Tại giao diện quản lý nhóm của sinh viên, hệ thống hiển thị nút **"Tham gia nhóm"** đối với các lớp mà sinh viên chưa có nhóm.

Sinh viên nhấn vào nút "Tham gia nhóm", một Modal xuất hiện hiển thị danh sách các nhóm hiện có trong lớp đó (bao gồm thông tin Tên nhóm, Số lượng thành viên hiện tại / Số lượng tối đa).

Sinh viên chọn một nhóm còn trống chỗ và nhấn nút **"Tham gia"**.

Hệ thống gửi request POST lên Backend. Backend kiểm tra điều kiện (tính hợp lệ của nhóm, tình trạng chốt nhóm của lớp, sĩ số...).

Nếu thành công, modal đóng, giao diện tải lại và thẻ Nhóm vừa tham gia xuất hiện trên màn hình "Nhóm của tôi".

### 12.4.2 Input

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Mã Nhóm (MaNhom) | Có | ID của nhóm muốn tham gia (Truyền qua URL parameter). |
| Mã Sinh Viên | Có | Trích xuất tự động từ Token JWT (Claim maNguoiDung), sinh viên không cần tự nhập. |


### 12.4.3 Output(khi thành công)

Backend trả HTTP 200: *"Tham gia nhóm thành công"*. Frontend hiển thị thông báo alert xanh và cập nhật UI, hiển thị thẻ nhóm với danh sách thành viên mới.

### 12.4.4 Quy tắc nghiệp vụ

**Kiểm tra trạng thái Lớp:** Backend phải kiểm tra cờ ChoPhepDangKyNhom của Lớp học. Nếu false (Giảng viên đã chốt), hành động tham gia bị từ chối.

**Kiểm tra giới hạn thành viên:** Tổng số thành viên hiện tại của nhóm **không được phép lớn hơn hoặc bằng** SoThanhVienToiDa.

**Kiểm tra trùng lặp:** Một sinh viên chỉ được phép tham gia tối đa **1 nhóm** trong phạm vi 1 Lớp học. Nếu phát hiện sinh viên đã thuộc nhóm khác trong cùng lớp, hệ thống sẽ chặn.

### 12.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị / Xử lý |
| --- | --- |
| Lớp đã bị chốt nhóm | "Giảng viên đã chốt danh sách nhóm, không thể tham gia lúc này." (HTTP 400) |
| Nhóm đã đầy | "Nhóm đã đủ số lượng thành viên tối đa." (HTTP 400) |
| Sinh viên đã có nhóm | "Bạn đã tham gia một nhóm khác trong lớp này rồi." (HTTP 400) |


## 12.5 chức năng rời nhóm

### 12.5.1 Mô tả luồng chính

Tại thẻ Nhóm của tôi, Sinh viên nhấn nút **"Rời nhóm"** (Nút viền đỏ / icon Logout).

Trình duyệt hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn rời khỏi nhóm này không?"*

Sinh viên chọn "Có". Giao diện gửi request DELETE lên Backend để gỡ liên kết sinh viên khỏi nhóm.

Nếu hợp lệ, Backend xóa sinh viên khỏi bảng thành viên nhóm. Frontend tải lại trang, nhóm vừa rời sẽ biến mất khỏi danh sách "Nhóm của tôi".

### 12.5.2 Input

| Trường | Ghi chú |
| --- | --- |
| Mã Nhóm (MaNhom) | ID của nhóm muốn rời (Truyền qua URL parameter). |
| Mã Sinh viên (svId) | Lấy từ Token của người dùng đang đăng nhập. |


### 12.5.3 Output(khi thành công)

Backend trả HTTP 200: *"Đã rời khỏi nhóm thành công"*. Sinh viên trở về trạng thái "bơ vơ" trong lớp học đó.

### 12.5.4 Quy tắc nghiệp vụ

**Ràng buộc Lớp học:** Tương tự khi tham gia, nếu Lớp học đã thiết lập ChoPhepDangKyNhom = false (Giảng viên đã chốt), sinh viên **KHÔNG ĐƯỢC PHÉP** rời nhóm. Nút bấm trên UI sẽ bị ẩn hoặc vô hiệu hóa.

### 12.5.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị / Xử lý |
| --- | --- |
| Lớp đã bị chốt nhóm | "Giảng viên đã chốt danh sách nhóm, không thể rời nhóm lúc này." (HTTP 400) |


## 12.6 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Sinh viên tham gia nhóm | POST | /api/nhom/{id}/themthanhvien | { "maSinhVien": int }<br>ID Sinh viên sẽ được lấy tự động hoặc truyền ngầm từ client sau khi parse JWT. |
| Sinh viên rời nhóm | DELETE | /api/nhom/{id}/xoathanhvien/{svId} | URL chứa ID Nhóm và ID Sinh viên cần rời. Backend sẽ validate token. |


# 13. Nhiệm vụ & tiến độ

## 13.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Nhiệm vụ & Tiến độ (Nộp task) |
| Thuộc module | Sinh Viên |
| Người sử dụng | Sinh viên (Thành viên nhóm) |


## 13.2 Mô tả tổng quan

Module Nhiệm vụ & Tiến độ là nơi sinh viên theo dõi các công việc (Task) được Nhóm trưởng giao phó. Giao diện hiển thị danh sách task dưới dạng lưới hoặc bảng kanban. Tính năng cốt lõi của module là **Nộp task**, cho phép sinh viên báo cáo tiến độ phần trăm hoàn thành, đính kèm ghi chú, link kết quả công việc để Nhóm trưởng nghiệm thu (Duyệt/Yêu cầu làm lại).

## 13.3  Người dùng & vai trò

Sinh viên (Thành viên): Được quyền cập nhật tiến độ, nộp bài, thay đổi trạng thái của những task mà mình được gán (assignee). Không có quyền chỉnh sửa nội dung yêu cầu gốc của task.

## 13.4 chức năng nộp task

### 13.4.1 Mô tả luồng chính

Tại giao diện quản lý Task, sinh viên chọn một task đang thực hiện và nhấn nút **"Nộp bài / Cập nhật tiến độ"**.

Modal form xuất hiện , sinh viên nhập **Ghi chú **** **và nộp file bài làm

Sinh viên nhấn nút **"Xác nhận nộp"**.

Hệ thống gửi request PUT kèm `NopTaskDto` lên Backend. Backend tự động thêm tiền tố "Sinh viên nộp task. Tiến độ:" vào ghi chú để lưu vào lịch sử.

Trạng thái của task chuyển thành *"Chờ duyệt"* (Pending Approval). Nhóm trưởng sẽ nhận được thông báo để vào kiểm tra.

### 13.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Ghi chú | Chuỗi ký tự | không |  |
| Link bài làm | file | Không | Các file thuộc định dạng file : .docx, .pdf, .zip,.jpg,<br>.png , giới hạn dung lượng < 5MB |


### 13.4.3 Output(khi thành công)

Backend trả HTTP 200 xác nhận cập nhật thành công. UI làm mới task: thanh tiến độ cập nhật màu, nhãn trạng thái chuyển thành "Chờ duyệt", thẻ task đổi sang màu cảnh báo (màu cam) đối với view của Nhóm trưởng.

### 13.4.4 Quy tắc nghiệp vụ

Chỉ **người được giao nhiệm vụ (Assignee)** mới có quyền gọi API nộp task đó. Backend chặn người ngoài sửa tiến độ của nhau.

Task đang ở trạng thái *"Đã hoàn thành"* (được nhóm trưởng duyệt) thì không được phép nộp lại (khóa nút nộp).

### 13.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị / Xử lý |
| --- | --- |
| Người nộp không phải Assignee | "Bạn không có quyền cập nhật tiến độ cho nhiệm vụ này." (HTTP 403 / 400) |


## 13.5 Thông tin API

| API | Endpoint | Payload / Ghi chú |
| --- | --- | --- |
| Nộp Task | PUT /api/nhiemvu/{id}/nop | { "GiChu": string, "File": file } |


# 14.Điều phối nhóm

## 14.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Điều Phối Nhóm |
| Thuộc module | Sinh Viên |
| Người sử dụng | Nhóm trưởng |


## 14.2 Mô tả tổng quan

Module Điều Phối Nhóm cấp cho sinh viên giữ vai trò "Nhóm trưởng" các quyền hạn quản trị nội bộ nhóm. Nhóm trưởng là đại diện hợp pháp duy nhất của nhóm có quyền Đăng ký đề tài (nếu ở chế độ tự do), khởi tạo các Task công việc, phân công cho các thành viên và trực tiếp kiểm duyệt kết quả (Duyệt / Từ chối / Yêu cầu làm lại) đối với các task do thành viên nộp.

## 14.3  Người dùng & vai trò

Chỉ duy nhất sinh viên có ID khớp với trường MaNhomTruong của nhóm mới thấy được các nút thao tác Tạo Task, Duyệt Task, và Đăng ký đề tài. Các thành viên khác chỉ có thể xem (Read-only).

## 14.4 chức năng đăng kí đề tài

### 14.4.1 Mô tả luồng chính

Tại giao diện quản lý nhóm, nếu nhóm chưa có đề tài, Nhóm trưởng nhấn nút **"Đăng ký đề tài"**.

Modal hiện ra danh sách các đề tài của lớp đang ở trạng thái *"Đăng ký tự do"* và *Chưa có nhóm nào nhận*.

Nhóm trưởng chọn một đề tài và nhấn **Xác nhận đăng ký**.

Hệ thống gửi request POST đăng ký. Nếu hợp lệ, đề tài được gán vĩnh viễn (hoặc đến khi GV đổi) cho nhóm này. Danh sách cập nhật lại ngay lập tức.

### 14.4.2 Input

Gửi mã lớp và mã đề tài: { "maDeTai": int, "maLop": int }

### 14.4.3 Output(khi thành công)

Hiện thông báo “Đăng ký đề tài thành công”

### 14.4.4 Quy tắc nghiệp vụ

**Ràng buộc thẩm quyền:** Chỉ Nhóm trưởng mới được đăng ký (API Backend check nhom.MaNhomTruong == maNguoiDung). Nếu không phải nhóm trưởng -> Báo lỗi.

**Ràng buộc tình trạng đề tài:** Đề tài phải có phương thức giao là *"Đăng ký tự do"*. Nếu là "Chỉ định trực tiếp", sinh viên không tự đăng ký được.

**Chống đăng ký đúp:**

Một nhóm chỉ được nhận **tối đa 1 đề tài**. (Lỗi: *"Nhóm bạn đã có đề tài rồi"*).

Một đề tài tự do chỉ được nhận bởi **duy nhất 1 nhóm** (Ai nhanh tay thì được. Lỗi: *"Đề tài này đã có nhóm đăng ký"*).

Nhóm đã đăng ký đề tài thì không thể hủy đăng ký đề tài

### 14.4.5 Xử lý lỗi

| Tình huống lỗi | Thông báo hiển thị từ Backend |
| --- | --- |
| Không phải nhóm trưởng | "Chỉ nhóm trưởng mới có quyền đăng ký" (HTTP 400) |
| Đề tài đã bị tranh mất | "Đề tài này đã có nhóm đăng ký" (HTTP 400) |
| Nhóm đã có đề tài | "Nhóm bạn đã có đề tài rồi" (HTTP 400) |


## 14.5 chức năng tạo task

### 14.5.1 Mô tả luồng chính

Nhóm trưởng nhấn nút **"+ Giao nhiệm vụ mới"** trên bảng Kanban hoặc danh sách Task.

Modal tạo task xuất hiện. Nhóm trưởng điền Tên nhiệm vụ, Mô tả, Thời hạn (Từ ngày - Đến ngày), Mức độ ưu tiên, và Checkbox chọn thành viên phụ trách (có thể chọn nhiều người).

Nhấn **Tạo nhiệm vụ**. Hệ thống gọi API POST /api/nhiemvu.

Dữ liệu được lưu, task mới xuất hiện ở cột "Cần làm" (To-do).

### 14.5.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc |
| --- | --- | --- |
| Tên nhiệm vụ | Chuỗi ký tự | Có |
| Mô tả | Chuỗi ký tự | Không |
| Ngày bắt đầu & Hạn chót | Date/Time | Có |
| Người thực hiện (MaNguoiDungs) | Mảng số nguyên (Array of IDs) | Có |
| Đính kèm file | file | không |


### 14.5.3 Output(khi thành công)

Hiện thông báo “tạo nhiệm vụ mới thành công”

### 14.5.4 Quy tắc nghiệp vụ

Chỉ **Nhóm trưởng** mới được phép tạo Task.

**Ràng buộc thời gian:** Thời gian của Task **không được vượt quá** thời hạn cho phép của Đề tài (nếu có đề tài) và Lớp học.

Người thực hiện phải là sinh viên đang là thành viên hợp lệ của nhóm đó.

File gửi dưới định dạng file docx , pdf , txt và dung lượng <5 MB

## 14.7 chức năng quản lý tiến độ

### 14.7.1 Mô tả luồng chính

Khi một thành viên "Nộp bài", Task chuyển sang thẻ "Chờ duyệt". Nhóm trưởng nhấn vào task đó để xem chi tiết (TaskDetailModal).

Nhóm trưởng xem link/file báo cáo và đánh giá chất lượng.

Có 2 hành động có thể thực hiện:

**Duyệt (Approve):** Nhấn nút "Đồng ý", API gửi request PUT duyệt. Task chuyển sang cột "Hoàn thành" (100%), đóng băng tiến độ.

**Yêu cầu làm lại (Redo/Reject):** Nhấn nút "Yêu cầu làm lại", nhập nội dung feedback (VD: "Làm sai format rồi"). API gửi request PUT từ chối. Task quay về trạng thái "Đang thực hiện" (Doing) kèm lịch sử nhắc nhở.

### 14.7.2 Quy tắc nghiệp vụ

Chỉ Nhóm trưởng mới thấy và thao tác được các nút "Duyệt" và "Làm lại" trên UI. Các thành viên khác bị ẩn.

Mọi thao tác Duyệt/Làm lại đều được lưu vào bảng LichSuNhiemVu (Track record) để giảng viên có thể xem lại quá trình hoạt động của nhóm.

## 14.8 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Đăng ký đề tài | POST | /api/detai/dang-ky | { "maDeTai": int, "maLop": int } |
| Tạo Task | POST | /api/nhiemvu | { "maNhom", "tenNhiemVu", "moTa", "ngayBatDau", "hanHoanThanh", "mucDoUuTien", "maNguoiDungs": [int] } |
| Upload tệp đính kèm task | POST | /api/nhiemvu/{id}/tep-dinh-kem | FormData: files (multi-file). Cho phép .pdf,.doc,.docx,.zip,.jpg,.png,.txt. Max 20MB. |
| Cập nhật Task | PUT | /api/nhiemvu/{id} | Body giống Tạo Task + { "phanTramHoanThanh", "trangThai", "ghiChuCapNhat" } |
| Duyệt Task | PUT | /api/nhiemvu/{id}/duyet | { "ghiChu": str }. Chuyển trạng thái sang Hoàn thành (100%). |
| Yêu cầu làm lại | PUT | /api/nhiemvu/{id}/lam-lai | { "lyDo": str, "moiHanHoanThanh": date? }. Task quay về Đang thực hiện. |
| Xóa Task | DELETE | /api/nhiemvu/{id} | Rỗng. Xóa nhiệm vụ khỏi hệ thống. |


# 15. Giám sát & Đánh giá (Giảng viên)

## 15.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Giám Sát & Đánh Giá |
| Thuộc module | Giảng Viên |
| Người sử dụng | Giảng viên |


## 15.2 Mô tả tổng quan

Module Giám sát & Đánh giá cung cấp cho Giảng viên công cụ theo dõi toàn diện hoạt động của các nhóm sinh viên trong từng lớp học phần. Giao diện được chia thành 3 tab chính: **Tiến độ nhóm** (theo dõi % hoàn thành nhiệm vụ của từng nhóm và cá nhân), **Giám sát thảo luận** (xem lịch sử tin nhắn thảo luận trong các nhóm) và **Đánh giá & Chấm điểm** (chấm điểm nhóm và cá nhân cho từng sinh viên).

## 15.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Giảng viên | Có quyền xem tiến độ, xem thảo luận và chấm điểm cho các lớp do mình phụ trách. |
| Sinh viên | Không có quyền truy cập module này. |


## 15.4 Chức năng theo dõi tiến độ nhóm

### 15.4.1 Mô tả luồng chính

Giảng viên chọn lớp học phần từ dropdown lọc. Hệ thống hiển thị danh sách các nhóm trong lớp kèm biểu đồ tiến độ tổng thể (ProgressBar). Mỗi nhóm có thể mở rộng (Accordion) để xem chi tiết: danh sách các nhiệm vụ, trạng thái (Hoàn thành, Đang làm, Trễ hạn), phần trăm hoàn thành, và thông tin người thực hiện.

### 15.4.2 Quy tắc nghiệp vụ

Giảng viên chỉ xem được tiến độ của các lớp do mình phụ trách. Tiến độ tổng thể của nhóm được tính bằng trung bình cộng % hoàn thành của tất cả nhiệm vụ trong nhóm. Nhiệm vụ quá deadline nhưng chưa hoàn thành sẽ được đánh dấu "Trễ hạn" tự động.

## 15.5 Chức năng giám sát thảo luận

### 15.5.1 Mô tả luồng chính

Giao diện dạng Split-view: bên trái là danh sách nhóm, bên phải là khung hiển thị lịch sử tin nhắn (Chat history). Giảng viên chọn nhóm để xem nội dung thảo luận. Tin nhắn hiển thị gồm: Avatar (chữ cái đầu), tên người gửi, nội dung, thời gian gửi và file đính kèm (nếu có).

### 15.5.2 Quy tắc nghiệp vụ

Giảng viên chỉ được xem (read-only), không gửi tin nhắn vào nhóm của sinh viên. Dữ liệu tin nhắn được lấy từ API TinNhan theo mã nhóm.

## 15.6 Chức năng chấm điểm

### 15.6.1 Mô tả luồng chính

Tại tab "Đánh giá & Chấm điểm", Giảng viên chọn lớp học và xem bảng tổng hợp gồm: tên sinh viên, tên nhóm, số task hoàn thành, tiến độ cá nhân, và mức đóng góp (Tích cực/Trung bình/Thấp). Giảng viên nhấn nút "Chấm điểm" để mở Modal cho phép nhập: **Điểm nhóm** (0-10), **Điểm cá nhân** (0-10) và **Nhận xét** cho từng sinh viên. Sau khi nhấn "Lưu", hệ thống gửi request lên backend lưu vào bảng DiemSo.

### 15.6.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã sinh viên (MaSinhVien) | Số nguyên | Có | ID sinh viên được chấm |
| Mã nhóm (MaNhom) | Số nguyên | Có | Nhóm của sinh viên |
| Mã lớp (MaLop) | Số nguyên | Có | Lớp học phần |
| Điểm nhóm (DiemNhom) | Số thực (0-10) | Không | Điểm chung cho cả nhóm |
| Điểm cá nhân (DiemCaNhan) | Số thực (0-10) | Không | Điểm riêng từng sinh viên |
| Nhận xét (NhanXet) | Chuỗi ký tự | Không | Nhận xét của giảng viên |
| Mã giảng viên (MaGiangVien) | Số nguyên | Có | Người chấm điểm (lấy từ Token) |


### 15.6.3 Output (khi thành công)

Backend trả HTTP 201: "Thêm điểm số thành công" kèm maDiem. Frontend hiển thị thông báo và cập nhật bảng điểm.

### 15.6.4 Quy tắc nghiệp vụ

Giảng viên chỉ chấm điểm cho sinh viên thuộc lớp do mình phụ trách. Điểm có thể sửa lại nhiều lần (PUT). Ngày chấm được hệ thống tự động ghi nhận.

### 15.6.5 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Sinh viên không tồn tại | Backend trả HTTP 400: "Sinh viên không tồn tại" |
| Nhóm không tồn tại | Backend trả HTTP 400: "Nhóm không tồn tại" |
| Lớp học không tồn tại | Backend trả HTTP 400: "Lớp học không tồn tại" |
| Giảng viên không tồn tại | Backend trả HTTP 400: "Giảng viên không tồn tại" |


## 15.7 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Lấy tất cả điểm số | GET | /api/diemso | Trả về toàn bộ bản ghi điểm |
| Tìm kiếm điểm số | GET | /api/diemso/{id} | Tìm theo mã điểm hoặc tên sinh viên |
| Chi tiết điểm số | GET | /api/diemso/chi-tiet/{id} | Trả về kèm tên SV, tên nhóm, tên lớp, tên GV |
| Lấy điểm theo lớp | GET | /api/diemso/by-lop/{maLop} | Trả về danh sách điểm kèm tên SV và tên nhóm |
| Thêm điểm số | POST | /api/diemso | { "maSinhVien", "maNhom", "maLop", "diemNhom", "diemCaNhan", "nhanXet", "maGiangVien" } |
| Cập nhật điểm số | PUT | /api/diemso/{id} | Body giống POST. Tự động cập nhật ngày chấm. |
| Xóa điểm số | DELETE | /api/diemso/{id} | Rỗng |


# 16. Không gian thảo luận (Sinh viên)

## 16.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Không Gian Thảo Luận (Chat) |
| Thuộc module | Sinh Viên |
| Người sử dụng | Sinh viên |


## 16.2 Mô tả tổng quan

Module Không gian thảo luận cung cấp giao diện nhắn tin theo nhóm, cho phép sinh viên trao đổi công việc, chia sẻ tài liệu và phối hợp nhóm. Giao diện được thiết kế dạng Split-view: Sidebar bên trái hiển thị danh sách các phòng chat (mỗi nhóm là một phòng), khung Chat chính bên phải hiển thị lịch sử tin nhắn và ô nhập văn bản.

## 16.3 Người dùng & vai trò

| Vai trò | Quyền hạn |
| --- | --- |
| Sinh viên | Gửi, xem tin nhắn trong các nhóm mình tham gia. Xóa tin nhắn do mình gửi. |
| Giảng viên | Chỉ xem (read-only) qua module Giám sát thảo luận. |


## 16.4 Chức năng gửi tin nhắn

### 16.4.1 Mô tả luồng chính

Sinh viên chọn phòng chat (nhóm) ở sidebar bên trái. Khung chat hiển thị toàn bộ tin nhắn của nhóm đó theo thứ tự thời gian. Sinh viên nhập nội dung vào ô văn bản phía dưới và nhấn nút Gửi. Hệ thống gửi request POST lên backend. Tin nhắn mới xuất hiện ngay trong khung chat.

### 16.4.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Mã nhóm (MaNhom) | Số nguyên | Có | Nhóm đang chat |
| Mã người gửi (MaNguoiGui) | Số nguyên | Có | Lấy từ thông tin đăng nhập |
| Nội dung (NoiDung) | Chuỗi ký tự | Có | Nội dung tin nhắn |
| Mã tin nhắn cha (MaTinNhanCha) | Số nguyên | Không | Dùng cho chức năng Reply |


### 16.4.3 Output (khi thành công)

Backend trả HTTP 200: "Gửi tin nhắn thành công" kèm maTinNhan. Frontend thêm tin nhắn mới vào khung chat.

### 16.4.4 Quy tắc nghiệp vụ

Tin nhắn của "Tôi" hiển thị bên phải (màu xanh), tin nhắn của người khác hiển thị bên trái (màu xám/trắng). Hệ thống hỗ trợ Reply (trả lời tin nhắn) thông qua trường MaTinNhanCha. Sidebar hiển thị tin nhắn mới nhất và số lượng phản hồi.

## 16.5 Chức năng xóa tin nhắn

### 16.5.1 Mô tả luồng chính

Sinh viên nhấn nút xóa trên tin nhắn do mình gửi. Xác nhận xóa. Hệ thống gọi API DELETE. Tin nhắn biến mất khỏi khung chat.

## 16.6 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Lấy tin nhắn theo nhóm | GET | /api/tinnhan?maNhom={id} | Trả về danh sách tin nhắn kèm tên người gửi, số phản hồi, số tệp đính kèm |
| Gửi tin nhắn mới | POST | /api/tinnhan | { "maNhom": int, "maNguoiGui": int, "noiDung": "str", "maTinNhanCha": int? } |
| Xóa tin nhắn | DELETE | /api/tinnhan/{id} | Rỗng |


# 17. Thống kê Dashboard

## 17.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Thống Kê Dashboard |
| Thuộc module | Tất cả vai trò |
| Người sử dụng | Admin · Giảng viên · Sinh viên |


## 17.2 Mô tả tổng quan

Mỗi vai trò có Dashboard riêng hiển thị thống kê tổng quan phù hợp với quyền hạn. Dashboard là trang đầu tiên người dùng nhìn thấy sau khi đăng nhập, cung cấp cái nhìn nhanh về tình trạng hệ thống, lớp học, nhóm và nhiệm vụ.

## 17.3 Dashboard Admin

### 17.3.1 Mô tả

Hiển thị 8 thẻ thống kê: Tổng người dùng, Giảng viên, Sinh viên, Khoa, Lớp hành chính, Lớp môn học, Nhóm, Công việc. Bên dưới hiển thị cây phân cấp Khoa → Giảng viên → Lớp → Nhóm và 3 lớp học mới nhất.

### 17.3.2 Quy tắc nghiệp vụ

Dữ liệu được tổng hợp từ toàn bộ hệ thống (không lọc theo học kỳ). Hiển thị học kỳ hiện tại ở header.

## 17.4 Dashboard Giảng viên

### 17.4.1 Mô tả

Hiển thị 4 thẻ thống kê: Lớp đang dạy, Tổng nhóm quản lý, Nhiệm vụ trễ hạn, Yêu cầu chuyển nhóm chờ duyệt. Bên dưới hiển thị tổng quan lớp học dạng Accordion (kèm danh sách nhóm, tiến độ, cảnh báo nhóm chưa có trưởng) và danh sách yêu cầu chuyển nhóm + hoạt động gần đây.

### 17.4.2 Quy tắc nghiệp vụ

Chỉ hiển thị dữ liệu của các lớp do giảng viên đang đăng nhập phụ trách. "Lớp đang dạy" chỉ đếm lớp có ngày hiện tại nằm trong khoảng NgayBatDau - NgayKetThuc.

## 17.5 Dashboard Sinh viên

### 17.5.1 Mô tả

Hiển thị 4 thẻ thống kê: Lớp đang học, Nhóm tham gia, Nhiệm vụ đang làm, Nhiệm vụ trễ hạn. Bên dưới có 4 khối thông tin: My Tasks (nhiệm vụ cá nhân kèm ProgressBar), Group Progress (tiến độ tổng thể nhóm), Deadlines (mốc thời gian sắp tới), Activity Feed (nhật ký hoạt động nhóm).

### 17.5.2 Quy tắc nghiệp vụ

Chỉ hiển thị dữ liệu liên quan đến sinh viên đang đăng nhập. Nhiệm vụ "Đang làm" gồm tất cả task chưa hoàn thành mà SV là assignee. Nhiệm vụ "Trễ hạn" là task chưa hoàn thành + đã qua deadline.

## 17.6 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Thống kê Admin | GET | /api/admin/thongke | Trả về: totalUsers, totalTeachers, totalStudents, totalClasses, totalGroups, totalDepartments, v.v. |
| Cây phân cấp Admin | GET | /api/admin/khoa-giangvien-lophoc-nhom | Trả về cây Khoa → GV → Lớp → Nhóm lồng nhau |
| Thống kê Giảng viên | GET | /api/thongke/giang-vien | Cần Token. Trả về stats, classes (kèm nhóm + tiến độ), transferRequests, activity |
| Thống kê Sinh viên | GET | /api/thongke/sinh-vien | Cần Token. Trả về stats, myTasks, groupProgress, groupInfo, deadlines, groupActivity |


# 18. Cập nhật & Xóa nhiệm vụ (Nhóm trưởng)

## 18.1 Thông tin chung

| Tên chức năng | Thông tin |
| --- | --- |
| Tên chức năng | Cập Nhật & Xóa Nhiệm Vụ |
| Thuộc module | Sinh Viên (Nhóm trưởng) |
| Người sử dụng | Nhóm trưởng |


## 18.2 Chức năng cập nhật nhiệm vụ

### 18.2.1 Mô tả luồng chính

Nhóm trưởng nhấn vào một Task trên bảng Kanban để mở Modal chi tiết. Tại đây, nhóm trưởng có thể chỉnh sửa: Tên nhiệm vụ, Mô tả, Hạn hoàn thành (gia hạn), Người thực hiện (đổi người), và Mức độ ưu tiên. Nhấn "Lưu thay đổi", hệ thống gửi request PUT lên backend.

### 18.2.2 Input

| Trường | Kiểu dữ liệu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| Tên nhiệm vụ | Chuỗi ký tự | Có | Không được trống |
| Mô tả | Chuỗi ký tự | Không | Mô tả chi tiết |
| Ngày bắt đầu | DateTime | Không | Phải trước hạn hoàn thành |
| Hạn hoàn thành | DateTime | Không | Hạn mới phải lớn hơn hạn cũ nếu gia hạn |
| Mức độ ưu tiên | Chuỗi (Cao/TB/Thấp) | Không | Chọn từ dropdown |
| Người thực hiện | Mảng int | Không | Tối đa 1 thành viên |
| Ghi chú cập nhật | Chuỗi ký tự | Không | Lưu vào lịch sử |


### 18.2.3 Quy tắc nghiệp vụ

Mỗi nhiệm vụ chỉ được giao cho **tối đa 1 thành viên**. Khi gán thêm người vào task "Chưa bắt đầu", trạng thái tự động chuyển sang "Đang thực hiện". Khi gỡ người khỏi task "Đang thực hiện", trạng thái tự động quay về "Chưa bắt đầu". Nếu nhóm trưởng đổi người thực hiện, lịch sử ghi "Nhóm trưởng đổi thành viên làm thay task". Mọi thay đổi đều được ghi vào bảng LichSuNhiemVu.

## 18.3 Chức năng xóa nhiệm vụ

### 18.3.1 Mô tả luồng chính

Nhóm trưởng nhấn nút Xóa trên Task. Xác nhận hành động. Hệ thống gọi API DELETE. Task biến mất khỏi bảng Kanban.

### 18.3.2 Xử lý lỗi

| Tình huống lỗi | Thông báo / Xử lý |
| --- | --- |
| Task không tồn tại | Backend trả HTTP 404: "Không tìm thấy nhiệm vụ" |


## 18.4 Chức năng xem nhiệm vụ của tất cả nhóm

### 18.4.1 Mô tả

Sinh viên truy cập trang "Nhiệm vụ & Tiến độ". Hệ thống gọi API lấy tất cả task trong các nhóm mà sinh viên tham gia, hiển thị dưới dạng danh sách hoặc Kanban với bộ lọc theo nhóm, trạng thái và mức độ ưu tiên.

## 18.5 Thông tin API

| Chức năng | Method | Endpoint | Payload / Ghi chú |
| --- | --- | --- | --- |
| Lấy DS task theo nhóm | GET | /api/nhiemvu?maNhom={id} | Trả về task kèm assignee, lịch sử, tệp đính kèm |
| Lấy task tất cả nhóm của tôi | GET | /api/nhiemvu/nhom-cua-toi | Cần Token. Lấy task tất cả nhóm SV tham gia |
| Chi tiết task | GET | /api/nhiemvu/{id} | Trả về đầy đủ thông tin task |
| Tạo task | POST | /api/nhiemvu | { "maNhom", "tenNhiemVu", "moTa", "ngayBatDau", "hanHoanThanh", "mucDoUuTien", "maNguoiDungs": [int] } |
| Upload tệp đính kèm | POST | /api/nhiemvu/{id}/tep-dinh-kem | FormData: files. Cho phép .pdf,.doc,.docx,.zip,.jpg,.png,.txt. Max 20MB |
| Cập nhật task | PUT | /api/nhiemvu/{id} | Body giống Tạo + { "phanTramHoanThanh", "trangThai", "ghiChuCapNhat" } |
| SV nộp task | PUT | /api/nhiemvu/{id}/nop | { "phanTramHoanThanh": int, "ghiChu": str } |
| Duyệt task | PUT | /api/nhiemvu/{id}/duyet | { "ghiChu": str } |
| Yêu cầu làm lại | PUT | /api/nhiemvu/{id}/lam-lai | { "lyDo": str, "moiHanHoanThanh": date? } |
| Xóa task | DELETE | /api/nhiemvu/{id} | Rỗng |


