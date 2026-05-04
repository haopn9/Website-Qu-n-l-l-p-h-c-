using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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
    // LAY DANH SACH NGUOI DUNG
    // GET: api/nguoidung
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachNguoiDung()
    {
        var ketQua = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .Include(u => u.MaKhoaNavigation)
            .OrderBy(u => u.HoTen)
            .Select(u => new
            {
                maNguoiDung = u.MaNguoiDung,
                maSo = u.MaSo,
                tenDangNhap = u.TenDangNhap,
                hoTen = u.HoTen,
                email = u.Email,
                maKhoa = u.MaKhoa,
                tenKhoa = u.MaKhoaNavigation != null ? u.MaKhoaNavigation.TenKhoa : null,
                maVaiTro = u.MaVaiTro,
                tenVaiTro = u.MaVaiTroNavigation.TenVaiTro,
                lopSinhVien = u.LopSinhVien,
                dangHoatDong = u.DangHoatDong ?? false
            })
            .ToListAsync();

        return Ok(ketQua);
    }

    // =============================================
    // THEM NGUOI DUNG MOI
    // POST: api/nguoidung
    // =============================================
    [HttpPost]
    public async Task<IActionResult> ThemNguoiDung([FromBody] ThemNguoiDungDto dto)
    {
        dto.MaSo = dto.MaSo.Trim();
        dto.TenDangNhap = dto.TenDangNhap.Trim();
        dto.HoTen = dto.HoTen.Trim();
        dto.Email = dto.Email.Trim();
        dto.LopSinhVien = string.IsNullOrWhiteSpace(dto.LopSinhVien) ? null : dto.LopSinhVien.Trim();

        if (string.IsNullOrWhiteSpace(dto.MaSo) ||
            string.IsNullOrWhiteSpace(dto.TenDangNhap) ||
            string.IsNullOrWhiteSpace(dto.MatKhau) ||
            string.IsNullOrWhiteSpace(dto.HoTen) ||
            string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { thongBao = "Vui long nhap day du thong tin bat buoc" });
        }

        if (!Regex.IsMatch(dto.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            return BadRequest(new { thongBao = "Email khong dung dinh dang" });
        }

        if (dto.MaVaiTro == 1)
        {
            dto.MaKhoa = 0;
            dto.LopSinhVien = null;
        }
        else if (dto.MaVaiTro == 2)
        {
            dto.LopSinhVien = null;
            if (dto.MaKhoa <= 0)
            {
                return BadRequest(new { thongBao = "Giang vien phai thuoc mot khoa" });
            }
        }
        else if (dto.MaVaiTro == 3)
        {
            if (dto.MaKhoa <= 0)
            {
                return BadRequest(new { thongBao = "Sinh vien phai thuoc mot khoa" });
            }

            if (string.IsNullOrWhiteSpace(dto.LopSinhVien))
            {
                return BadRequest(new { thongBao = "Sinh vien phai co lop sinh vien" });
            }
        }

        if (await _db.NguoiDungs.AnyAsync(u => u.MaSo == dto.MaSo))
        {
            return BadRequest(new { thongBao = "Ma so da ton tai" });
        }

        if (await _db.NguoiDungs.AnyAsync(u => u.TenDangNhap == dto.TenDangNhap))
        {
            return BadRequest(new { thongBao = "Ten dang nhap da ton tai" });
        }

        if (await _db.NguoiDungs.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest(new { thongBao = "Email da ton tai" });
        }

        var nguoiDungMoi = new NguoiDung
        {
            MaSo = dto.MaSo,
            TenDangNhap = dto.TenDangNhap,
            MatKhauHash = dto.MatKhau,
            HoTen = dto.HoTen,
            Email = dto.Email,
            MaKhoa = dto.MaKhoa > 0 ? dto.MaKhoa : null,
            MaVaiTro = dto.MaVaiTro,
            LopSinhVien = dto.LopSinhVien,
            DangHoatDong = true
        };

        _db.NguoiDungs.Add(nguoiDungMoi);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            thongBao = "Them nguoi dung thanh cong",
            maNguoiDung = nguoiDungMoi.MaNguoiDung
        });
    }

    // =============================================
    // LAY THONG TIN NGUOI DUNG HIEN TAI
    // GET: api/nguoidung/me
    // =============================================
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Khong xac dinh duoc nguoi dung" });
        }

        var nguoiDung = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .Include(u => u.MaKhoaNavigation)
            .FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDung);

        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        return Ok(new
        {
            maNguoiDung = nguoiDung.MaNguoiDung,
            maSo = nguoiDung.MaSo,
            tenDangNhap = nguoiDung.TenDangNhap,
            hoTen = nguoiDung.HoTen,
            email = nguoiDung.Email,
            maKhoa = nguoiDung.MaKhoa,
            tenKhoa = nguoiDung.MaKhoaNavigation != null ? nguoiDung.MaKhoaNavigation.TenKhoa : null,
            maVaiTro = nguoiDung.MaVaiTro,
            tenVaiTro = nguoiDung.MaVaiTroNavigation?.TenVaiTro,
            lopSinhVien = nguoiDung.LopSinhVien,
            dangHoatDong = nguoiDung.DangHoatDong ?? false
        });
    }

    // =============================================
    // CAP NHAT THONG TIN NGUOI DUNG HIEN TAI
    // PUT: api/nguoidung/me
    // =============================================
    [HttpPut("me")]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateNguoiDungDto dto)
    {
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Khong xac dinh duoc nguoi dung" });
        }

        var nguoiDung = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        if (!string.IsNullOrWhiteSpace(dto.HoTen))
        {
            nguoiDung.HoTen = dto.HoTen.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            if (!Regex.IsMatch(dto.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { thongBao = "Email khong dung dinh dang" });
            }
            nguoiDung.Email = dto.Email.Trim();
        }

        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cap nhat thong tin thanh cong" });
    }

    // =============================================
    // DOI MAT KHAU
    // PUT: api/nguoidung/doi-mat-khau
    // =============================================
    [HttpPut("doi-mat-khau")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Khong xac dinh duoc nguoi dung" });
        }

        var nguoiDung = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        if (nguoiDung.MatKhauHash != dto.MatKhauCu)
        {
            return BadRequest(new { thongBao = "Mat khau cu khong dung" });
        }

        if (string.IsNullOrWhiteSpace(dto.MatKhauMoi) || dto.MatKhauMoi.Length < 6)
        {
            return BadRequest(new { thongBao = "Mat khau moi phai co it nhat 6 ky tu" });
        }

        nguoiDung.MatKhauHash = dto.MatKhauMoi;
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Doi mat khau thanh cong" });
    }

    // =============================================
    // KHOA / MO KHOA TAI KHOAN
    // PUT: api/nguoidung/5/trangthai
    // =============================================
    [HttpPut("{id}/trangthai")]
    public async Task<IActionResult> DoiTrangThai(int id)
    {
        var nguoiDung = await _db.NguoiDungs.FindAsync(id);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        nguoiDung.DangHoatDong = !(nguoiDung.DangHoatDong ?? false);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            thongBao = "Cap nhat trang thai thanh cong",
            trangThai = nguoiDung.DangHoatDong
        });
    }

    // =============================================
    // XOA NGUOI DUNG
    // DELETE: api/nguoidung/5
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaNguoiDung(int id)
    {
        var nguoiDung = await _db.NguoiDungs.FindAsync(id);
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        nguoiDung.DangHoatDong = false;
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xoa nguoi dung thanh cong" });
    }
}

public class ThemNguoiDungDto
{
    public string MaSo { get; set; } = "";
    public string TenDangNhap { get; set; } = "";
    public string MatKhau { get; set; } = "";
    public string HoTen { get; set; } = "";
    public string Email { get; set; } = "";
    public int MaKhoa { get; set; }
    public int MaVaiTro { get; set; }
    public string? LopSinhVien { get; set; }
}

public class UpdateNguoiDungDto
{
    public string? HoTen { get; set; }
    public string? Email { get; set; }
}

public class ChangePasswordDto
{
    public string MatKhauCu { get; set; } = "";
    public string MatKhauMoi { get; set; } = "";
}
