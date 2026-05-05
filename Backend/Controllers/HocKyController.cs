using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "1")] // Chỉ Admin được quản lý Học kỳ
public class HocKyController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public HocKyController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // 1. LẤY DANH SÁCH TẤT CẢ HỌC KỲ
    // =============================================
    [HttpGet]
    [AllowAnonymous] // Cho phép lấy danh sách để lọc
    public async Task<IActionResult> DanhSachHocKy()
    {
        try
        {
            var hocKys = await _db.HocKies
                .OrderByDescending(h => h.LaHienTai) // Học kỳ hiện tại lên đầu
                .ThenByDescending(h => h.NgayBatDau)
                .Select(h => new
                {
                    maHocKy = h.MaHocKy,
                    tenHocKy = h.TenHocKy,
                    ngayBatDau = h.NgayBatDau,
                    ngayKetThuc = h.NgayKetThuc,
                    laHienTai = h.LaHienTai
                })
                .ToListAsync();

            return Ok(hocKys);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi lấy danh sách học kỳ: " + ex.Message });
        }
    }

    public class HocKyDto
    {
        public string TenHocKy { get; set; } = null!;
        public DateOnly? NgayBatDau { get; set; }
        public DateOnly? NgayKetThuc { get; set; }
        public bool? LaHienTai { get; set; }
    }

    // =============================================
    // 2. THÊM HỌC KỲ MỚI
    // =============================================
    [HttpPost]
    public async Task<IActionResult> ThemHocKy([FromBody] HocKyDto dto)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (string.IsNullOrWhiteSpace(dto.TenHocKy))
            {
                return BadRequest(new { thongBao = "Tên học kỳ không được để trống" });
            }

            // Validate format: Học kỳ {1,2,3} 20xx-20xx
            var regex = new System.Text.RegularExpressions.Regex(@"^Học kỳ [1-3] \d{4}-\d{4}$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (!regex.IsMatch(dto.TenHocKy.Trim()))
            {
                return BadRequest(new { thongBao = "Tên học kỳ phải đúng định dạng: Học kỳ {1,2,3} {Năm}-{Năm} (VD: Học kỳ 1 2025-2026)" });
            }

            // Không trùng tên học kỳ
            if (await _db.HocKies.AnyAsync(h => h.TenHocKy.ToLower() == dto.TenHocKy.Trim().ToLower()))
            {
                return BadRequest(new { thongBao = "Tên học kỳ này đã tồn tại" });
            }

            // Ngày bắt đầu < ngày kết thúc
            if (dto.NgayBatDau.HasValue && dto.NgayKetThuc.HasValue && dto.NgayBatDau.Value >= dto.NgayKetThuc.Value)
            {
                return BadRequest(new { thongBao = "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
            }

            // Ngày bắt đầu học kỳ mới > ngày kết thúc học kỳ cũ nhất (nếu có)
            if (dto.NgayBatDau.HasValue)
            {
                var hocKyCuNhat = await _db.HocKies
                    .Where(h => h.NgayKetThuc != null)
                    .OrderByDescending(h => h.NgayKetThuc)
                    .FirstOrDefaultAsync();

                if (hocKyCuNhat != null && hocKyCuNhat.NgayKetThuc.HasValue && dto.NgayBatDau.Value <= hocKyCuNhat.NgayKetThuc.Value)
                {
                    return BadRequest(new { thongBao = $"Ngày bắt đầu phải lớn hơn ngày kết thúc của học kỳ gần nhất ({hocKyCuNhat.NgayKetThuc.Value:dd/MM/yyyy})" });
                }
            }

            // Nếu set làm hiện tại, phải gỡ các học kỳ khác
            if (dto.LaHienTai == true)
            {
                var cacHocKyKhac = await _db.HocKies.Where(h => h.LaHienTai == true).ToListAsync();
                foreach (var h in cacHocKyKhac)
                {
                    h.LaHienTai = false;
                }
            }

            var hocKy = new HocKy
            {
                TenHocKy = dto.TenHocKy.Trim(),
                NgayBatDau = dto.NgayBatDau,
                NgayKetThuc = dto.NgayKetThuc,
                LaHienTai = dto.LaHienTai ?? false
            };

            _db.HocKies.Add(hocKy);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { thongBao = "Thêm học kỳ thành công", maHocKy = hocKy.MaHocKy });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { thongBao = "Lỗi khi thêm học kỳ: " + ex.Message });
        }
    }

    // =============================================
    // 3. CẬP NHẬT HỌC KỲ
    // =============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatHocKy(int id, [FromBody] HocKyDto dto)
    {
        try
        {
            var hocKy = await _db.HocKies.FindAsync(id);
            if (hocKy == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy học kỳ" });
            }

            if (string.IsNullOrWhiteSpace(dto.TenHocKy))
            {
                return BadRequest(new { thongBao = "Tên học kỳ không được để trống" });
            }

            var regex = new System.Text.RegularExpressions.Regex(@"^Học kỳ [1-3] \d{4}-\d{4}$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (!regex.IsMatch(dto.TenHocKy.Trim()))
            {
                return BadRequest(new { thongBao = "Tên học kỳ phải đúng định dạng: Học kỳ {1,2,3} {Năm}-{Năm} (VD: Học kỳ 1 2025-2026)" });
            }

            if (hocKy.TenHocKy.ToLower() != dto.TenHocKy.Trim().ToLower() && 
                await _db.HocKies.AnyAsync(h => h.TenHocKy.ToLower() == dto.TenHocKy.Trim().ToLower()))
            {
                return BadRequest(new { thongBao = "Tên học kỳ này đã tồn tại" });
            }

            if (dto.NgayBatDau.HasValue && dto.NgayKetThuc.HasValue && dto.NgayBatDau.Value >= dto.NgayKetThuc.Value)
            {
                return BadRequest(new { thongBao = "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
            }

            // Note: Update doesn't strictly check against previous semesters to avoid circular update lockouts,
            // but we ensure the basic start < end.

            hocKy.TenHocKy = dto.TenHocKy.Trim();
            hocKy.NgayBatDau = dto.NgayBatDau;
            hocKy.NgayKetThuc = dto.NgayKetThuc;

            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Cập nhật học kỳ thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật học kỳ: " + ex.Message });
        }
    }

    // =============================================
    // 4. SET HỌC KỲ HIỆN TẠI
    // =============================================
    [HttpPut("{id}/set-current")]
    public async Task<IActionResult> SetHocKyHienTai(int id)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var hocKy = await _db.HocKies.FindAsync(id);
            if (hocKy == null)
            {
                return NotFound(new { thongBao = "Không tìm thấy học kỳ" });
            }

            // Gỡ tất cả các học kỳ hiện tại
            var cacHocKyKhac = await _db.HocKies.Where(h => h.LaHienTai == true).ToListAsync();
            foreach (var h in cacHocKyKhac)
            {
                h.LaHienTai = false;
            }

            // Đặt học kỳ mới làm hiện tại
            hocKy.LaHienTai = true;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { thongBao = $"Đã đặt '{hocKy.TenHocKy}' làm học kỳ hiện tại." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { thongBao = "Lỗi khi đổi học kỳ hiện tại: " + ex.Message });
        }
    }

    // ĐÃ XÓA HÀM XÓA HỌC KỲ THEO YÊU CẦU CỦA USER
}
