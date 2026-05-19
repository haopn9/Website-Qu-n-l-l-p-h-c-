using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BCrypt.Net;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NguoiDungController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public NguoiDungController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH NGƯỜI DÙNG
    // GET: api/nguoidung
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachNguoiDung()
    {
        // Bước 1: Lấy tất cả người dùng kèm vai trò
        List<NguoiDung> tatCaNguoiDung = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .ToListAsync();

        // Bước 2: Tạo danh sách kết quả
        List<object> ketQua = new List<object>();
        foreach (NguoiDung u in tatCaNguoiDung)
        {
            ketQua.Add(new
            {
                maNguoiDung = u.MaNguoiDung,
                maSo = u.MaSo,
                tenDangNhap = u.TenDangNhap,
                hoTen = u.HoTen,
                email = u.Email,
                gioiTinh = u.GioiTinh,
                ngaySinh = u.NgaySinh,
                lopSinhVien = u.LopSinhVien,
                maVaiTro = u.MaVaiTro,
                tenVaiTro = u.MaVaiTroNavigation != null ? u.MaVaiTroNavigation.TenVaiTro : "",
                dangHoatDong = u.DangHoatDong
            });
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // THÊM NGƯỜI DÙNG MỚI
    // POST: api/nguoidung
    // =============================================
    [HttpPost]
    public async Task<IActionResult> ThemNguoiDung([FromBody] ThemNguoiDungDto dto)
    {
        // Bước 1: Kiểm tra trùng mã số
        bool trungMaSo = await _db.NguoiDungs.AnyAsync(u => u.MaSo == dto.MaSo);
        if (trungMaSo)
        {
            return BadRequest(new { thongBao = "Mã số này đã tồn tại trong hệ thống" });
        }

        // Bước 2: Kiểm tra trùng tên đăng nhập
        bool trungTenDangNhap = await _db.NguoiDungs.AnyAsync(u => u.TenDangNhap == dto.TenDangNhap);
        if (trungTenDangNhap)
        {
            return BadRequest(new { thongBao = "Tên đăng nhập này đã được sử dụng" });
        }

        // Bước 3: Kiểm tra trùng email
        bool trungEmail = await _db.NguoiDungs.AnyAsync(u => u.Email == dto.Email);
        if (trungEmail)
        {
            return BadRequest(new { thongBao = "Email này đã được sử dụng" });
        }

        // Bước 4: Tạo object người dùng mới
        NguoiDung nguoiDungMoi = new NguoiDung();
        nguoiDungMoi.MaSo = dto.MaSo;
        nguoiDungMoi.TenDangNhap = dto.TenDangNhap;
        nguoiDungMoi.MatKhauHash = dto.MatKhau;   // thực tế cần hash BCrypt
        nguoiDungMoi.HoTen = dto.HoTen;
        nguoiDungMoi.Email = dto.Email;
        nguoiDungMoi.GioiTinh = dto.GioiTinh;
        nguoiDungMoi.NgaySinh = dto.NgaySinh;
        nguoiDungMoi.MaKhoa = dto.MaKhoa > 0 ? dto.MaKhoa : null;
        nguoiDungMoi.MaVaiTro = dto.MaVaiTro;
        nguoiDungMoi.LopSinhVien = dto.LopSinhVien;
        nguoiDungMoi.DangHoatDong = true;

        // Bước 5: Thêm vào database
        _db.NguoiDungs.Add(nguoiDungMoi);

        // Bước 6: Lưu lại
        await _db.SaveChangesAsync();

        // Bước 7: Trả về kết quả
        return Ok(new { thongBao = "Thêm người dùng thành công", maNguoiDung = nguoiDungMoi.MaNguoiDung });
    }

    // =============================================
    // CẬP NHẬT THÔNG TIN NGƯỜI DÙNG
    // PUT: api/nguoidung/5
    // =============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatNguoiDung(int id, [FromBody] CapNhatNguoiDungDto dto)
    {
        // Bước 1: Tìm người dùng
        NguoiDung? nguoiDung = await _db.NguoiDungs.FindAsync(id);

        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Bước 2: Kiểm tra trùng email (bỏ qua chính mình)
        bool trungEmail = await _db.NguoiDungs.AnyAsync(u => u.Email == dto.Email && u.MaNguoiDung != id);
        if (trungEmail)
        {
            return BadRequest(new { thongBao = "Email này đã được sử dụng bởi tài khoản khác" });
        }

        // Bước 3: Cập nhật thông tin
        nguoiDung.HoTen = dto.HoTen;
        nguoiDung.Email = dto.Email;
        nguoiDung.GioiTinh = dto.GioiTinh;
        nguoiDung.NgaySinh = dto.NgaySinh;
        nguoiDung.MaKhoa = dto.MaKhoa > 0 ? dto.MaKhoa : null;
        nguoiDung.LopSinhVien = dto.LopSinhVien;
        nguoiDung.MaVaiTro = dto.MaVaiTro;

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cập nhật thông tin thành công" });
    }

    // =============================================
    // KHÓA / MỞ KHÓA TÀI KHOẢN (Xóa mềm)
    // PUT: api/nguoidung/5/trangthai
    // =============================================
    [HttpPut("{id}/trangthai")]
    public async Task<IActionResult> DoiTrangThai(int id)
    {
        // Bước 1: Tìm người dùng
        NguoiDung? nguoiDung = await _db.NguoiDungs.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Bước 3: Đổi trạng thái (true → false, false → true)
        nguoiDung.DangHoatDong = !nguoiDung.DangHoatDong;

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cập nhật trạng thái thành công", trangThai = nguoiDung.DangHoatDong });
    }

    // =============================================
    // XÓA NGƯỜI DÙNG
    // DELETE: api/nguoidung/5
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaNguoiDung(int id)
    {
        // Bước 1: Tìm người dùng
        NguoiDung? nguoiDung = await _db.NguoiDungs.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Bước 3: Xóa mềm - chỉ khóa tài khoản thay vì xóa hẳn
        nguoiDung.DangHoatDong = false;

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xóa người dùng thành công" });
    }

    // =============================================
    // LẤY THÔNG TIN CÁ NHÂN (Profile)
    // GET: api/nguoidung/me
    // =============================================
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> LayThongTinCaNhan()
    {
        // Lấy MaNguoiDung từ JWT token
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Token không hợp lệ" });
        }

        // Tìm người dùng kèm thông tin liên quan
        var nguoiDung = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .Include(u => u.MaKhoaNavigation)
            .FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDung);

        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy thông tin người dùng" });
        }

        // Tra cứu tên lớp hành chính từ bảng LopSinhVien
        string? tenLopSinhVien = null;
        if (!string.IsNullOrEmpty(nguoiDung.LopSinhVien))
        {
            var lopSV = await _db.LopSinhViens
                .FirstOrDefaultAsync(l => l.MaLopSinhVien == nguoiDung.LopSinhVien);
            tenLopSinhVien = lopSV?.TenLopSinhVien;
        }

        // Trả về thông tin profile
        return Ok(new
        {
            maNguoiDung = nguoiDung.MaNguoiDung,
            maSo = nguoiDung.MaSo,
            tenDangNhap = nguoiDung.TenDangNhap,
            hoTen = nguoiDung.HoTen,
            ngaySinh = nguoiDung.NgaySinh,
            gioiTinh = nguoiDung.GioiTinh,
            soDienThoai = nguoiDung.SoDienThoai,
            email = nguoiDung.Email,
            diaChi = nguoiDung.DiaChi,
            anhDaiDien = nguoiDung.AnhDaiDien,
            maKhoa = nguoiDung.MaKhoa,
            tenKhoa = nguoiDung.MaKhoaNavigation?.TenKhoa,
            lopSinhVien = nguoiDung.LopSinhVien,
            tenLopSinhVien = tenLopSinhVien,
            maVaiTro = nguoiDung.MaVaiTro,
            tenVaiTro = nguoiDung.MaVaiTroNavigation?.TenVaiTro,
            dangHoatDong = nguoiDung.DangHoatDong,
            ngayTao = nguoiDung.NgayTao
        });
    }

    // =============================================
    // CẬP NHẬT THÔNG TIN CÁ NHÂN
    // PUT: api/nguoidung/me
    // =============================================
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> CapNhatThongTinCaNhan([FromBody] CapNhatProfileDto dto)
    {
        // Lấy MaNguoiDung từ JWT token
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Token không hợp lệ" });
        }

        // Tìm người dùng
        var nguoiDung = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Cập nhật thông tin (chỉ cho phép cập nhật một số trường)
        nguoiDung.SoDienThoai = dto.SoDienThoai?.Trim() ?? nguoiDung.SoDienThoai;
        nguoiDung.Email = dto.Email?.Trim() ?? nguoiDung.Email;
        nguoiDung.DiaChi = dto.DiaChi?.Trim() ?? nguoiDung.DiaChi;

        // Lưu thay đổi
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cập nhật thông tin cá nhân thành công" });
    }

    // =============================================
    // ĐỔI MẬT KHẨU
    // PUT: api/nguoidung/doi-mat-khau
    // =============================================
    [HttpPut("doi-mat-khau")]
    [Authorize]
    public async Task<IActionResult> DoiMatKhau([FromBody] DoiMatKhauDto dto)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(dto.MatKhauCu) || string.IsNullOrWhiteSpace(dto.MatKhauMoi))
        {
            return BadRequest(new { thongBao = "Mật khẩu cũ và mật khẩu mới không được để trống" });
        }

        if (dto.MatKhauMoi.Length < 6)
        {
            return BadRequest(new { thongBao = "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        // Lấy MaNguoiDung từ JWT token
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Token không hợp lệ" });
        }

        // Tìm người dùng
        var nguoiDung = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Kiểm tra mật khẩu cũ
        if (!BCrypt.Net.BCrypt.Verify(dto.MatKhauCu, nguoiDung.MatKhauHash))
        {
            return BadRequest(new { thongBao = "Mật khẩu cũ không đúng" });
        }

        // Hash mật khẩu mới và cập nhật
        nguoiDung.MatKhauHash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhauMoi);

        // Lưu thay đổi
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Đổi mật khẩu thành công" });
    }

}

// =============================================
// DTOs
// =============================================
public class ThemNguoiDungDto
{
    public string MaSo { get; set; } = "";
    public string TenDangNhap { get; set; } = "";
    public string MatKhau { get; set; } = "";
    public string HoTen { get; set; } = "";
    public string Email { get; set; } = "";
    public bool? GioiTinh { get; set; }
    public DateOnly? NgaySinh { get; set; }
    public int MaKhoa { get; set; }
    public int MaVaiTro { get; set; }
    public string? LopSinhVien { get; set; }
}

public class CapNhatNguoiDungDto
{
    public string HoTen { get; set; } = "";
    public string Email { get; set; } = "";
    public bool? GioiTinh { get; set; }
    public DateOnly? NgaySinh { get; set; }
    public int MaKhoa { get; set; }
    public int MaVaiTro { get; set; }
    public string? LopSinhVien { get; set; }

}

public class CapNhatProfileDto
{
    public string? SoDienThoai { get; set; }
    public string? Email { get; set; }
    public string? DiaChi { get; set; }
}

public class DoiMatKhauDto
{
    public string MatKhauCu { get; set; } = "";
    public string MatKhauMoi { get; set; } = "";
}