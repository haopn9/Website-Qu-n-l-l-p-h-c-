using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "1")] // Chỉ Admin được quản lý Khoa
public class KhoaController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public KhoaController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // 1. LẤY DANH SÁCH TẤT CẢ CÁC KHOA
    // =============================================
    [HttpGet]
    [AllowAnonymous] // Cho phép ai cũng có thể xem danh sách khoa (để load dropdown)
    public async Task<IActionResult> DanhSachKhoa()
    {
        try
        {
            var khoas = await _db.Khoas
                .Select(k => new
                {
                    maKhoa = k.MaKhoa,
                    tenKhoa = k.TenKhoa,
                    kyHieuKhoa = k.KyHieuKhoa,
                    soLuongLop = k.LopSinhViens.Count,
                    soLuongGiangVien = k.NguoiDungs.Count(u => u.MaVaiTro == 2) // Vai trò 2 là Giảng viên
                })
                .ToListAsync();

            return Ok(khoas);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi lấy danh sách khoa: " + ex.Message });
        }
    }

    // =============================================
    // 2. LẤY CHI TIẾT 1 KHOA (Kèm danh sách lớp HC & Giảng viên)
    // =============================================
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> ChiTietKhoa(int id)
    {
        try
        {
            var khoa = await _db.Khoas
                .Include(k => k.LopSinhViens)
                .Include(k => k.NguoiDungs) // Lấy cả giảng viên và sinh viên
                .FirstOrDefaultAsync(k => k.MaKhoa == id);

            if (khoa == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy khoa" });
            }

            var ketQua = new
            {
                maKhoa = khoa.MaKhoa,
                tenKhoa = khoa.TenKhoa,
                kyHieuKhoa = khoa.KyHieuKhoa,
                lopHanhChinhs = khoa.LopSinhViens.Select(l => new
                {
                    maLop = l.MaLopSinhVien,
                    tenLop = l.TenLopSinhVien,
                    trangThai = l.DangHoatDong
                }),
                giangViens = khoa.NguoiDungs.Where(u => u.MaVaiTro == 2).Select(gv => new
                {
                    maGiangVien = gv.MaNguoiDung,
                    maSo = gv.MaSo,
                    hoTen = gv.HoTen,
                    email = gv.Email,
                    gioiTinh = gv.GioiTinh  // true = Nam, false = Nữ, null = Chưa cập nhật
                }),
                sinhViens = khoa.NguoiDungs.Where(u => u.MaVaiTro == 3).Select(sv => new
                {
                    maSinhVien = sv.MaNguoiDung,
                    maSo = sv.MaSo,
                    hoTen = sv.HoTen,
                    lop = sv.LopSinhVien
                })
            };

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi lấy chi tiết khoa: " + ex.Message });
        }
    }

    public class KhoaDto
    {
        public string TenKhoa { get; set; } = null!;
        public string? KyHieuKhoa { get; set; }
    }

    // =============================================
    // 3. THÊM KHOA MỚI
    // =============================================
    [HttpPost]
    public async Task<IActionResult> ThemKhoa([FromBody] KhoaDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.TenKhoa))
            {
                return BadRequest(new { thongBao = "Tên khoa không được để trống" });
            }

            if (string.IsNullOrWhiteSpace(dto.KyHieuKhoa))
            {
                return BadRequest(new { thongBao = "Ký hiệu khoa không được để trống" });
            }

            // Kiểm tra trùng tên khoa hoặc ký hiệu
            var tenTonTai = await _db.Khoas.AnyAsync(k => k.TenKhoa.ToLower() == dto.TenKhoa.ToLower().Trim());
            if (tenTonTai)
            {
                return BadRequest(new { thongBao = "Tên khoa này đã tồn tại" });
            }

            var kyHieuTonTai = await _db.Khoas.AnyAsync(k => k.KyHieuKhoa != null && k.KyHieuKhoa.ToLower() == dto.KyHieuKhoa.ToLower().Trim());
            if (kyHieuTonTai)
            {
                return BadRequest(new { thongBao = "Ký hiệu khoa này đã tồn tại" });
            }

            var khoa = new Khoa
            {
                TenKhoa = dto.TenKhoa.Trim(),
                KyHieuKhoa = dto.KyHieuKhoa.Trim().ToUpper()
            };

            _db.Khoas.Add(khoa);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Thêm khoa thành công", maKhoa = khoa.MaKhoa });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi thêm khoa: " + ex.Message });
        }
    }

    // =============================================
    // 4. CẬP NHẬT KHOA
    // =============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatKhoa(int id, [FromBody] KhoaDto dto)
    {
        try
        {
            var khoa = await _db.Khoas.FindAsync(id);
            if (khoa == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy khoa" });
            }

            if (string.IsNullOrWhiteSpace(dto.TenKhoa))
            {
                return BadRequest(new { thongBao = "Tên khoa không được để trống" });
            }

            if (string.IsNullOrWhiteSpace(dto.KyHieuKhoa))
            {
                return BadRequest(new { thongBao = "Ký hiệu khoa không được để trống" });
            }

            if (khoa.TenKhoa.ToLower() != dto.TenKhoa.Trim().ToLower() && 
                await _db.Khoas.AnyAsync(k => k.TenKhoa.ToLower() == dto.TenKhoa.ToLower().Trim()))
            {
                return BadRequest(new { thongBao = "Tên khoa này đã tồn tại" });
            }

            if (khoa.KyHieuKhoa?.ToLower() != dto.KyHieuKhoa.Trim().ToLower() && 
                await _db.Khoas.AnyAsync(k => k.KyHieuKhoa != null && k.KyHieuKhoa.ToLower() == dto.KyHieuKhoa.ToLower().Trim()))
            {
                return BadRequest(new { thongBao = "Ký hiệu khoa này đã tồn tại" });
            }

            khoa.TenKhoa = dto.TenKhoa.Trim();
            khoa.KyHieuKhoa = dto.KyHieuKhoa.Trim().ToUpper();

            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Cập nhật khoa thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật khoa: " + ex.Message });
        }
    }

    // =============================================
    // 5. XÓA KHOA
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaKhoa(int id)
    {
        try
        {
            var khoa = await _db.Khoas
                .Include(k => k.LopSinhViens)
                .Include(k => k.NguoiDungs)
                .FirstOrDefaultAsync(k => k.MaKhoa == id);

            if (khoa == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy khoa" });
            }

            // Kiểm tra ràng buộc
            if (khoa.LopSinhViens.Any() || khoa.NguoiDungs.Any())
            {
                return BadRequest(new { thongBao = "Không thể xóa khoa đang có lớp hành chính hoặc giảng viên/sinh viên." });
            }

            _db.Khoas.Remove(khoa);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Xóa khoa thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi xóa khoa: " + ex.Message });
        }
    }
}
