using Backend.Models;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NhiemVuController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public NhiemVuController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH TASK CỦA NHÓM
    // GET: api/nhiemvu?maNhom=1
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachTask(int maNhom)
    {
        try
        {
            var danhSachTask = await _db.NhiemVus
                .Where(t => t.MaNhom == maNhom)
                .Include(t => t.MaDeTaiNavigation)
                .Include(t => t.MaNguoiDungs)
                .ToListAsync();

            var ketQua = danhSachTask.Select(t => new
            {
                maNhiemVu = t.MaNhiemVu,
                tenNhiemVu = t.TenNhiemVu,
                moTa = t.MoTa,
                ngayBatDau = t.NgayBatDau?.ToString("yyyy-MM-dd"),
                hanHoanThanh = t.HanHoanThanh?.ToString("yyyy-MM-dd"),
                mucDoUuTien = t.MucDoUuTien,
                trangThai = t.TrangThai,
                phanTramHoanThanh = t.PhanTramHoanThanh,
                maDeTai = t.MaDeTai,
                soThanhVienThamGia = t.MaNguoiDungs.Count
            }).ToList();

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách task: " + ex.Message });
        }
    }

    // =============================================
    // CHI TIẾT TASK
    // GET: api/nhiemvu/{id}
    // =============================================
    [HttpGet("{id}")]
    public async Task<IActionResult> ChiTietTask(int id)
    {
        try
        {
            var task = await _db.NhiemVus
                .Include(t => t.MaDeTaiNavigation)
                .Include(t => t.MaNhomNavigation)
                .Include(t => t.MaNguoiDungs)
                .Include(t => t.LichSuNhiemVus)
                .FirstOrDefaultAsync(t => t.MaNhiemVu == id);

            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy task" });
            }

            var ketQua = new
            {
                maNhiemVu = task.MaNhiemVu,
                tenNhiemVu = task.TenNhiemVu,
                moTa = task.MoTa,
                ngayBatDau = task.NgayBatDau?.ToString("yyyy-MM-dd"),
                hanHoanThanh = task.HanHoanThanh?.ToString("yyyy-MM-dd"),
                mucDoUuTien = task.MucDoUuTien,
                trangThai = task.TrangThai,
                phanTramHoanThanh = task.PhanTramHoanThanh,
                maDeTai = task.MaDeTai,
                maNhom = task.MaNhom,
                thanhVienThamGia = task.MaNguoiDungs.Select(sv => new
                {
                    maNguoiDung = sv.MaNguoiDung,
                    hoTen = sv.HoTen,
                    email = sv.Email
                }),
                lichSuCapNhat = task.LichSuNhiemVus.Select(ls => new
                {
                    maLichSu = ls.MaLichSu,
                    maNguoiCapNhat = ls.MaNguoiCapNhat,
                    tenNguoiCapNhat = ls.MaNguoiCapNhatNavigation.HoTen,
                    ngayCapNhat = ls.NgayCapNhat?.ToString("yyyy-MM-dd HH:mm"),
                    trangThaiMoi = ls.TrangThaiMoi,
                    phanTramMoi = ls.PhanTramMoi,
                    ghiChu = ls.GhiChu
                })
            };

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết task: " + ex.Message });
        }
    }

    // =============================================
    // TẠO TASK MỚI (Giảng viên/Admin)
    // POST: api/nhiemvu
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoTask([FromBody] NhiemVuCreateUpdateDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            if (dto.MaNhom <= 0 || string.IsNullOrWhiteSpace(dto.TenNhiemVu))
            {
                return BadRequest(new { message = "MaNhom và TenNhiemVu là bắt buộc" });
            }

            var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
            if (nhom == null)
            {
                return BadRequest(new { message = "Nhóm không tồn tại" });
            }

            if (dto.MaDeTai.HasValue)
            {
                var deTai = await _db.DeTais.FindAsync(dto.MaDeTai.Value);
                if (deTai == null)
                {
                    return BadRequest(new { message = "Đề tài tham chiếu không tồn tại" });
                }
            }

            var nhiemVu = new NhiemVu
            {
                MaNhom = dto.MaNhom,
                MaDeTai = dto.MaDeTai,
                TenNhiemVu = dto.TenNhiemVu.Trim(),
                MoTa = dto.MoTa?.Trim(),
                NgayBatDau = dto.NgayBatDau,
                HanHoanThanh = dto.HanHoanThanh,
                MucDoUuTien = dto.MucDoUuTien?.Trim(),
                TrangThai = "Chưa bắt đầu",
                PhanTramHoanThanh = 0,
                NgayTao = DateTime.Now
            };

            _db.NhiemVus.Add(nhiemVu);
            await _db.SaveChangesAsync();

            // Ghi lịch sử
            var lichSu = new LichSuNhiemVu
            {
                MaNhiemVu = nhiemVu.MaNhiemVu,
                MaNguoiCapNhat = maNguoiDung,
                NgayCapNhat = DateTime.Now,
                TrangThaiMoi = "Chưa bắt đầu",
                PhanTramMoi = 0,
                GhiChu = "Tạo task mới"
            };

            _db.LichSuNhiemVus.Add(lichSu);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(ChiTietTask), new { id = nhiemVu.MaNhiemVu }, new
            {
                message = "Tạo task thành công",
                maNhiemVu = nhiemVu.MaNhiemVu
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo task: " + ex.Message });
        }
    }

    // =============================================
    // SINH VIÊN NỘP TASK (Cập nhật tiến độ)
    // PUT: api/nhiemvu/{id}/nop
    // =============================================
    [HttpPut("{id}/nop")]
    public async Task<IActionResult> NopTask(int id, [FromBody] NopTaskDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var task = await _db.NhiemVus.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy task" });
            }

            // Kiểm tra sinh viên thuộc nhóm này
            var isMember = await _db.NhiemVus
                .Where(t => t.MaNhiemVu == id)
                .SelectMany(t => t.MaNguoiDungs)
                .AnyAsync(sv => sv.MaNguoiDung == maNguoiDung);

            if (!isMember)
            {
                return Forbid("Bạn không phải thành viên của task này");
            }

            if (dto.PhanTramHoanThanh < 0 || dto.PhanTramHoanThanh > 100)
            {
                return BadRequest(new { message = "Phần trăm hoàn thành phải từ 0 đến 100" });
            }

            var trangThaiCu = task.TrangThai;
            var phanTramCu = task.PhanTramHoanThanh;

            // Cập nhật: tiến độ + chuyển sang "Chờ duyệt"
            task.PhanTramHoanThanh = dto.PhanTramHoanThanh;
            task.TrangThai = "Chờ duyệt";

            await _db.SaveChangesAsync();

            // Ghi lịch sử
            var lichSu = new LichSuNhiemVu
            {
                MaNhiemVu = id,
                MaNguoiCapNhat = maNguoiDung,
                NgayCapNhat = DateTime.Now,
                TrangThaiMoi = "Chờ duyệt",
                PhanTramMoi = dto.PhanTramHoanThanh,
                GhiChu = $"Sinh viên nộp task. Tiến độ: {phanTramCu}% → {dto.PhanTramHoanThanh}%. {dto.GhiChu}"
            };

            _db.LichSuNhiemVus.Add(lichSu);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Nộp task thành công",
                trangThaiCu,
                trangThaiMoi = "Chờ duyệt",
                phanTramHoanThanh = dto.PhanTramHoanThanh
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi nộp task: " + ex.Message });
        }
    }

    // =============================================
    // NHÓM TRƯỞNG DUYỆT TASK (Phê duyệt)
    // PUT: api/nhiemvu/{id}/duyet
    // =============================================
    [HttpPut("{id}/duyet")]
    public async Task<IActionResult> DuyetTask(int id, [FromBody] DuyetTaskDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var task = await _db.NhiemVus.Include(t => t.MaNhomNavigation).FirstOrDefaultAsync(t => t.MaNhiemVu == id);
            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy task" });
            }

            // Kiểm tra người dùng là nhóm trưởng
            if (task.MaNhomNavigation.MaNhomTruong != maNguoiDung)
            {
                return Forbid("Chỉ nhóm trưởng mới được duyệt task");
            }

            // Kiểm tra task đang ở trạng thái "Chờ duyệt"
            if (task.TrangThai != "Chờ duyệt")
            {
                return BadRequest(new { message = $"Task không thể duyệt vì trạng thái hiện tại là '{task.TrangThai}'" });
            }

            var trangThaiCu = task.TrangThai;
            task.TrangThai = "Hoàn thành";
            task.PhanTramHoanThanh = 100;

            await _db.SaveChangesAsync();

            // Ghi lịch sử
            var lichSu = new LichSuNhiemVu
            {
                MaNhiemVu = id,
                MaNguoiCapNhat = maNguoiDung,
                NgayCapNhat = DateTime.Now,
                TrangThaiMoi = "Hoàn thành",
                PhanTramMoi = 100,
                GhiChu = $"Nhóm trưởng duyệt task. {dto.GhiChu}"
            };

            _db.LichSuNhiemVus.Add(lichSu);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Duyệt task thành công",
                trangThaiCu,
                trangThaiMoi = "Hoàn thành"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi duyệt task: " + ex.Message });
        }
    }

    // =============================================
    // NHÓM TRƯỞNG GỬI LÀM LẠI
    // PUT: api/nhiemvu/{id}/lam-lai
    // =============================================
    [HttpPut("{id}/lam-lai")]
    public async Task<IActionResult> LamLaiTask(int id, [FromBody] LamLaiTaskDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var task = await _db.NhiemVus.Include(t => t.MaNhomNavigation).FirstOrDefaultAsync(t => t.MaNhiemVu == id);
            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy task" });
            }

            // Kiểm tra người dùng là nhóm trưởng
            if (task.MaNhomNavigation.MaNhomTruong != maNguoiDung)
            {
                return Forbid("Chỉ nhóm trưởng mới được gửi làm lại task");
            }

            // Kiểm tra task đang ở trạng thái "Chờ duyệt"
            if (task.TrangThai != "Chờ duyệt")
            {
                return BadRequest(new { message = $"Task không thể gửi làm lại vì trạng thái hiện tại là '{task.TrangThai}'" });
            }

            var trangThaiCu = task.TrangThai;
            task.TrangThai = "Làm lại";
            task.PhanTramHoanThanh = 0;

            await _db.SaveChangesAsync();

            // Ghi lịch sử
            var lichSu = new LichSuNhiemVu
            {
                MaNhiemVu = id,
                MaNguoiCapNhat = maNguoiDung,
                NgayCapNhat = DateTime.Now,
                TrangThaiMoi = "Làm lại",
                PhanTramMoi = 0,
                GhiChu = $"Nhóm trưởng yêu cầu làm lại. Lý do: {dto.LyDo}"
            };

            _db.LichSuNhiemVus.Add(lichSu);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Gửi yêu cầu làm lại thành công",
                trangThaiCu,
                trangThaiMoi = "Làm lại"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi gửi làm lại: " + ex.Message });
        }
    }

    // =============================================
    // CẬP NHẬT THÔNG TIN TASK
    // PUT: api/nhiemvu/{id}
    // =============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatTask(int id, [FromBody] NhiemVuCreateUpdateDto dto)
    {
        try
        {
            var nhiemVu = await _db.NhiemVus.FindAsync(id);
            if (nhiemVu == null)
            {
                return NotFound(new { message = "Nhiệm vụ không tồn tại" });
            }

            if (dto.MaNhom <= 0 || string.IsNullOrWhiteSpace(dto.TenNhiemVu))
            {
                return BadRequest(new { message = "MaNhom và TenNhiemVu là bắt buộc" });
            }

            var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
            if (nhom == null)
            {
                return BadRequest(new { message = "Nhóm không tồn tại" });
            }

            if (dto.MaDeTai.HasValue)
            {
                var deTai = await _db.DeTais.FindAsync(dto.MaDeTai.Value);
                if (deTai == null)
                {
                    return BadRequest(new { message = "Đề tài tham chiếu không tồn tại" });
                }
            }

            nhiemVu.MaNhom = dto.MaNhom;
            nhiemVu.MaDeTai = dto.MaDeTai;
            nhiemVu.TenNhiemVu = dto.TenNhiemVu.Trim();
            nhiemVu.MoTa = dto.MoTa?.Trim() ?? nhiemVu.MoTa;
            nhiemVu.NgayBatDau = dto.NgayBatDau ?? nhiemVu.NgayBatDau;
            nhiemVu.HanHoanThanh = dto.HanHoanThanh ?? nhiemVu.HanHoanThanh;
            nhiemVu.MucDoUuTien = dto.MucDoUuTien?.Trim() ?? nhiemVu.MucDoUuTien;
            nhiemVu.TrangThai = dto.TrangThai?.Trim() ?? nhiemVu.TrangThai;
            nhiemVu.PhanTramHoanThanh = dto.PhanTramHoanThanh ?? nhiemVu.PhanTramHoanThanh;

            _db.NhiemVus.Update(nhiemVu);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật nhiệm vụ thành công", data = nhiemVu });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật nhiệm vụ: " + ex.Message });
        }
    }

    // =============================================
    // XÓA TASK
    // DELETE: api/nhiemvu/{id}
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaTask(int id)
    {
        try
        {
            var nhiemVu = await _db.NhiemVus.FindAsync(id);
            if (nhiemVu == null)
            {
                return NotFound(new { message = "Nhiệm vụ không tồn tại" });
            }

            // Xóa lịch sử liên quan
            var lichSuList = await _db.LichSuNhiemVus.Where(ls => ls.MaNhiemVu == id).ToListAsync();
            _db.LichSuNhiemVus.RemoveRange(lichSuList);

            _db.NhiemVus.Remove(nhiemVu);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa nhiệm vụ thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xóa nhiệm vụ: " + ex.Message });
        }
    }
}

// =============================================
// DTOs
// =============================================

public class NopTaskDto
{
    public int PhanTramHoanThanh { get; set; }
    public string? GhiChu { get; set; }
}

public class DuyetTaskDto
{
    public string? GhiChu { get; set; }
}

public class LamLaiTaskDto
{
    public string LyDo { get; set; } = "";
}
