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
        // Bước 1: Lấy tất cả người dùng ra
        List<NguoiDung> tatCaNguoiDung = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .ToListAsync();

        // Bước 2: Tìm người dùng theo tên đăng nhập
        NguoiDung? nguoiDung = null;
        foreach (NguoiDung u in tatCaNguoiDung)
        {
            if (u.TenDangNhap == dto.TenDangNhap && u.DangHoatDong == true)
            {
                nguoiDung = u;
            }
        }

        // Bước 3: Kiểm tra có tìm thấy không
        if (nguoiDung == null)
        {
            return Unauthorized(new { thongBao = "Sai tài khoản hoặc mật khẩu" });
        }

        // Bước 4: Kiểm tra mật khẩu
        if (nguoiDung.MatKhauHash != dto.MatKhau)
        {
            return Unauthorized(new { thongBao = "Sai tài khoản hoặc mật khẩu" });
        }

        // Bước 5: Tạo token
        string secretKey = _config["AppSettings:Token"]!;
        SymmetricSecurityKey key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        SigningCredentials credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        List<Claim> danhSachClaim = new List<Claim>();
        danhSachClaim.Add(new Claim("maNguoiDung", nguoiDung.MaNguoiDung.ToString()));
        danhSachClaim.Add(new Claim("maVaiTro", nguoiDung.MaVaiTro.ToString()));
        danhSachClaim.Add(new Claim("hoTen", nguoiDung.HoTen));

        JwtSecurityToken tokenObject = new JwtSecurityToken(
            claims: danhSachClaim,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: credentials
        );

        string tokenString = new JwtSecurityTokenHandler().WriteToken(tokenObject);

        // Bước 6: Lấy tên vai trò
        string tenVaiTro = "";
        if (nguoiDung.MaVaiTroNavigation != null)
        {
            tenVaiTro = nguoiDung.MaVaiTroNavigation.TenVaiTro;
        }

        // Bước 7: Trả về kết quả
        return Ok(new
        {
            token = tokenString,
            maNguoiDung = nguoiDung.MaNguoiDung,
            hoTen = nguoiDung.HoTen,
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