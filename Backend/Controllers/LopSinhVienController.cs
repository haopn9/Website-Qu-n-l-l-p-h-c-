using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LopSinhVienController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public LopSinhVienController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH LỚP HÀNH CHÍNH SINH VIÊN
    // GET: api/lopsinhvien
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachLopSinhVien()
    {
        // Chỉ lấy lớp đang hoạt động để đưa vào dropdown thêm/cập nhật người dùng.
        var danhSachLop = await _db.LopSinhViens
            .Include(l => l.MaKhoaNavigation)
            .Where(l => l.DangHoatDong == true)
            .OrderBy(l => l.MaLopSinhVien)
            .Select(l => new
            {
                maLopSinhVien = l.MaLopSinhVien,
                tenLopSinhVien = l.TenLopSinhVien,
                maKhoa = l.MaKhoa,
                tenKhoa = l.MaKhoaNavigation != null ? l.MaKhoaNavigation.TenKhoa : "",
                dangHoatDong = l.DangHoatDong
            })
            .ToListAsync();

        return Ok(danhSachLop);
    }

    public class LopSinhVienDto
    {
        public string MaLopSinhVien { get; set; } = null!;
        public string TenLopSinhVien { get; set; } = null!;
        public int? MaKhoa { get; set; }
        public bool? DangHoatDong { get; set; }
    }

    // =============================================
    // THÊM LỚP HÀNH CHÍNH
    // =============================================
    [HttpPost]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> ThemLopSinhVien([FromBody] LopSinhVienDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.MaLopSinhVien) || string.IsNullOrWhiteSpace(dto.TenLopSinhVien))
            {
                return BadRequest(new { thongBao = "Mã lớp và tên lớp không được để trống" });
            }

            var tonTai = await _db.LopSinhViens.AnyAsync(l => l.MaLopSinhVien.ToLower() == dto.MaLopSinhVien.ToLower() || l.TenLopSinhVien.ToLower() == dto.TenLopSinhVien.ToLower());
            if (tonTai)
            {
                return BadRequest(new { thongBao = "Mã lớp hoặc tên lớp đã tồn tại" });
            }

            var lopHanhChinh = new LopSinhVien
            {
                MaLopSinhVien = dto.MaLopSinhVien.Trim(),
                TenLopSinhVien = dto.TenLopSinhVien.Trim(),
                MaKhoa = dto.MaKhoa,
                DangHoatDong = dto.DangHoatDong ?? true
            };

            _db.LopSinhViens.Add(lopHanhChinh);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Thêm lớp hành chính thành công", maLop = lopHanhChinh.MaLopSinhVien });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi thêm lớp hành chính: " + ex.Message });
        }
    }

    // =============================================
    // CẬP NHẬT LỚP HÀNH CHÍNH
    // =============================================
    [HttpPut("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> CapNhatLopSinhVien(string id, [FromBody] LopSinhVienDto dto)
    {
        try
        {
            var lopHanhChinh = await _db.LopSinhViens.FindAsync(id);
            if (lopHanhChinh == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy lớp hành chính" });
            }

            if (string.IsNullOrWhiteSpace(dto.TenLopSinhVien))
            {
                return BadRequest(new { thongBao = "Tên lớp không được để trống" });
            }

            // Kiểm tra trùng tên nếu đổi tên
            if (lopHanhChinh.TenLopSinhVien.ToLower() != dto.TenLopSinhVien.ToLower())
            {
                var tonTai = await _db.LopSinhViens.AnyAsync(l => l.TenLopSinhVien.ToLower() == dto.TenLopSinhVien.ToLower());
                if (tonTai)
                {
                    return BadRequest(new { thongBao = "Tên lớp đã tồn tại" });
                }
            }

            lopHanhChinh.TenLopSinhVien = dto.TenLopSinhVien.Trim();
            lopHanhChinh.MaKhoa = dto.MaKhoa;
            if (dto.DangHoatDong.HasValue)
            {
                lopHanhChinh.DangHoatDong = dto.DangHoatDong.Value;
            }

            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Cập nhật lớp hành chính thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật lớp: " + ex.Message });
        }
    }

    // =============================================
    // XÓA LỚP HÀNH CHÍNH
    // =============================================
    [HttpDelete("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> XoaLopSinhVien(string id)
    {
        try
        {
            var lopHanhChinh = await _db.LopSinhViens.FindAsync(id);
            if (lopHanhChinh == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy lớp hành chính" });
            }

            // TODO: Bổ sung kiểm tra xem lớp này có đang chứa sinh viên không (ví dụ kiểm tra bảng NguoiDung có LopSinhVien == id)
            var coSinhVien = await _db.NguoiDungs.AnyAsync(u => u.LopSinhVien == id || u.LopSinhVien == lopHanhChinh.TenLopSinhVien);
            if (coSinhVien)
            {
                return BadRequest(new { thongBao = "Không thể xóa lớp đang có sinh viên. Vui lòng chuyển sinh viên sang lớp khác trước." });
            }

            _db.LopSinhViens.Remove(lopHanhChinh);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Xóa lớp hành chính thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi xóa lớp: " + ex.Message });
        }
    }
}
