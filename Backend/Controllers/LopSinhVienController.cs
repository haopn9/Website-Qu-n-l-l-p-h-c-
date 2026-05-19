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

            if (string.IsNullOrWhiteSpace(dto.MaLopSinhVien) || string.IsNullOrWhiteSpace(dto.TenLopSinhVien))
            {
                return BadRequest(new { thongBao = "Mã lớp và tên lớp không được để trống" });
            }

            if (dto.MaLopSinhVien.Trim().ToLower() != dto.TenLopSinhVien.Trim().ToLower())
            {
                return BadRequest(new { thongBao = "Mã lớp và tên lớp phải giống nhau (ví dụ: mã lớp D19_TH01 thì tên lớp D19_TH01)" });
            }

            // Kiểm tra trùng mã hoặc tên nếu thay đổi
            if (lopHanhChinh.MaLopSinhVien.ToLower() != dto.MaLopSinhVien.ToLower() || lopHanhChinh.TenLopSinhVien.ToLower() != dto.TenLopSinhVien.ToLower())
            {
                var tonTai = await _db.LopSinhViens.AnyAsync(l => l.MaLopSinhVien != id && 
                    (l.MaLopSinhVien.ToLower() == dto.MaLopSinhVien.ToLower() || l.TenLopSinhVien.ToLower() == dto.TenLopSinhVien.ToLower()));
                if (tonTai)
                {
                    return BadRequest(new { thongBao = "Mã lớp hoặc tên lớp đã tồn tại ở lớp khác" });
                }
            }

            // Cập nhật thông tin
            if (lopHanhChinh.MaLopSinhVien != dto.MaLopSinhVien.Trim())
            {
                // Nếu đổi mã lớp (khoá chính), ta cần xóa bản ghi cũ và tạo bản ghi mới để tránh lỗi Entity Framework
                var coSinhVien = await _db.NguoiDungs.AnyAsync(u => u.LopSinhVien == id || u.LopSinhVien == lopHanhChinh.TenLopSinhVien);
                if (coSinhVien)
                {
                    return BadRequest(new { thongBao = "Không thể đổi mã lớp vì lớp đang có sinh viên. Vui lòng chuyển sinh viên sang lớp khác trước." });
                }

                var lopMoi = new LopSinhVien
                {
                    MaLopSinhVien = dto.MaLopSinhVien.Trim(),
                    TenLopSinhVien = dto.TenLopSinhVien.Trim(),
                    MaKhoa = dto.MaKhoa,
                    DangHoatDong = dto.DangHoatDong ?? lopHanhChinh.DangHoatDong
                };

                _db.LopSinhViens.Remove(lopHanhChinh);
                _db.LopSinhViens.Add(lopMoi);
            }
            else
            {
                lopHanhChinh.TenLopSinhVien = dto.TenLopSinhVien.Trim();
                lopHanhChinh.MaKhoa = dto.MaKhoa;
                if (dto.DangHoatDong.HasValue)
                {
                    lopHanhChinh.DangHoatDong = dto.DangHoatDong.Value;
                }
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
