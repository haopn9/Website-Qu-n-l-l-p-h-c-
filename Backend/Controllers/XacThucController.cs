using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class XacThucController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;
    private readonly IConfiguration _config;

    public XacThucController(QuanLyLopHocDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // =============================================
// ĐĂNG NHẬP
// POST: api/xacthuc/dangnhap
// =============================================
[HttpPost("dangnhap")]
public async Task<IActionResult> DangNhap([FromBody] DangNhapDto dto)
{
    // Bước 1: Tìm người dùng theo tên đăng nhập + đang hoạt động 
    NguoiDung? nguoiDung = await _db.NguoiDungs
        .Include(u => u.MaVaiTroNavigation)
        .FirstOrDefaultAsync(u => u.TenDangNhap == dto.TenDangNhap && u.DangHoatDong == true);

    // Bước 2: Kiểm tra có tìm thấy không
    if (nguoiDung == null)
    {
        return Unauthorized(new { thongBao = "Sai tài khoản hoặc mật khẩu" });
    }

    // Bước 3: Kiểm tra mật khẩu 
    if (nguoiDung.MatKhauHash != dto.MatKhau)
    {
        return Unauthorized(new { thongBao = "Sai tài khoản hoặc mật khẩu" });
    }

    // Bước 4: Tạo token
    string secretKey = _config["AppSettings:Token"]!;
    SymmetricSecurityKey key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
    SigningCredentials credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    List<Claim> danhSachClaim = new List<Claim>();
    danhSachClaim.Add(new Claim("maNguoiDung", nguoiDung.MaNguoiDung.ToString()));
    danhSachClaim.Add(new Claim("maVaiTro", nguoiDung.MaVaiTro.ToString()));
    danhSachClaim.Add(new Claim("hoTen", nguoiDung.HoTen));
    // Thêm claim chuẩn để [Authorize(Roles="...")] hoạt động
    danhSachClaim.Add(new Claim(ClaimTypes.Role, nguoiDung.MaVaiTro.ToString()));

    JwtSecurityToken tokenObject = new JwtSecurityToken(
        claims: danhSachClaim,
        expires: DateTime.Now.AddHours(24),
        signingCredentials: credentials
    );

    string tokenString = new JwtSecurityTokenHandler().WriteToken(tokenObject);

    // Bước 5: Lấy tên vai trò
    string tenVaiTro = "";
    if (nguoiDung.MaVaiTroNavigation != null)
    {
        tenVaiTro = nguoiDung.MaVaiTroNavigation.TenVaiTro;
    }

    // Bước 6: Tra cứu tên lớp hành chính từ bảng LopSinhVien
    string? tenLopSinhVien = null;
    if (!string.IsNullOrEmpty(nguoiDung.LopSinhVien))
    {
        var lopSV = await _db.LopSinhViens
            .FirstOrDefaultAsync(l => l.MaLopSinhVien == nguoiDung.LopSinhVien);
        tenLopSinhVien = lopSV?.TenLopSinhVien;
    }

    // Bước 7: Lấy tên khoa
    string? tenKhoa = null;
    if (nguoiDung.MaKhoa != null)
    {
        var khoa = await _db.Khoas.FindAsync(nguoiDung.MaKhoa);
        tenKhoa = khoa?.TenKhoa;
    }

    // Bước 8: Trả về dữ liệu đủ cho layout/sidebar/profile dùng maSo/anhDaiDien
    return Ok(new
    {
        token = tokenString,
        maNguoiDung = nguoiDung.MaNguoiDung,
        maSo = nguoiDung.MaSo,
        tenDangNhap = nguoiDung.TenDangNhap,
        hoTen = nguoiDung.HoTen,
        anhDaiDien = nguoiDung.AnhDaiDien,
        email = nguoiDung.Email,
        ngaySinh = nguoiDung.NgaySinh,
        gioiTinh = nguoiDung.GioiTinh,
        soDienThoai = nguoiDung.SoDienThoai,
        diaChi = nguoiDung.DiaChi,
        maKhoa = nguoiDung.MaKhoa,
        tenKhoa = tenKhoa,
        lopSinhVien = nguoiDung.LopSinhVien,
        tenLopSinhVien = tenLopSinhVien,
        maVaiTro = nguoiDung.MaVaiTro,
        tenVaiTro = tenVaiTro
    });
}
}

// =============================================
// DTO
// =============================================
public class DangNhapDto
{
    public string TenDangNhap { get; set; } = "";
    public string MatKhau { get; set; } = "";
}