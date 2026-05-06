using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeTaiController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IFileValidationService _fileService;

    public DeTaiController(QuanLyLopHocDbContext db, IWebHostEnvironment env, IFileValidationService fileService)
    {
        _db = db;
        _env = env;
        _fileService = fileService;
    }

    // =============================================
    // LẤY DANH SÁCH ĐỀ TÀI CỦA MỘT LỚP
    // GET: api/detai/lop/1
    // =============================================
    [HttpGet("lop/{maLop}")]
    public async Task<IActionResult> GetDanhSachDeTai(int maLop)
    {
        try
        {
            var danhSachDeTai = await _db.DeTais
                .Where(dt => dt.MaLop == maLop)
                .Include(dt => dt.Nhoms)
                .OrderByDescending(dt => dt.NgayTao)
                .ToListAsync();

            var ketQua = danhSachDeTai.Select(dt => new
            {
                maDeTai = dt.MaDeTai,
                tenDeTai = dt.TenDeTai,
                moTa = dt.MoTa,
                sanPhamKyVong = dt.SanPhamKyVong,
                maLop = dt.MaLop,
                ngayBatDau = dt.NgayBatDau?.ToString("yyyy-MM-dd"),
                ngayKetThuc = dt.NgayKetThuc?.ToString("yyyy-MM-dd"),
                phuongThucGiao = dt.PhuongThucGiao ?? "Đăng ký tự do",
                ngayTao = dt.NgayTao?.ToString("yyyy-MM-dd HH:mm"),
                daCoNhom = dt.Nhoms.Any(),
                tenNhom = dt.Nhoms.FirstOrDefault()?.TenNhom ?? "",
                maNhom = dt.Nhoms.FirstOrDefault()?.MaNhom
            }).ToList();

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi lấy danh sách đề tài: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> TaoDeTai([FromForm] DeTaiCreateDto dto)
    {
        try
        {
            var claimMaVaiTro = User.FindFirstValue("maVaiTro");
            if (claimMaVaiTro != "2") return BadRequest(new { thongBao = "Chỉ giảng viên mới có quyền tạo đề tài" });

            if (string.IsNullOrWhiteSpace(dto.TenDeTai)) return BadRequest(new { thongBao = "Tên đề tài không được để trống" });
            
            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(dto.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền tạo đề tài cho lớp này" });

            var deTaiMoi = new DeTai
            {
                TenDeTai = dto.TenDeTai.Trim(),
                MoTa = dto.MoTa?.Trim(),
                SanPhamKyVong = dto.SanPhamKyVong?.Trim(),
                MaLop = dto.MaLop,
                NgayBatDau = dto.NgayBatDau,
                NgayKetThuc = dto.NgayKetThuc,
                PhuongThucGiao = string.IsNullOrEmpty(dto.PhuongThucGiao) ? "Đăng ký tự do" : dto.PhuongThucGiao,
                NgayTao = DateTime.Now
            };

            _db.DeTais.Add(deTaiMoi);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Tạo đề tài thành công", maDeTai = deTaiMoi.MaDeTai });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi tạo đề tài: " + ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatDeTai(int id, [FromBody] DeTaiUpdateDto dto)
    {
        try
        {
            var deTai = await _db.DeTais.FindAsync(id);
            if (deTai == null) return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền chỉnh sửa đề tài này" });

            deTai.TenDeTai = dto.TenDeTai.Trim();
            deTai.MoTa = dto.MoTa?.Trim();
            deTai.SanPhamKyVong = dto.SanPhamKyVong?.Trim();
            deTai.NgayBatDau = dto.NgayBatDau;
            deTai.NgayKetThuc = dto.NgayKetThuc;

            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Cập nhật đề tài thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật đề tài: " + ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaDeTai(int id)
    {
        try
        {
            var deTai = await _db.DeTais.Include(dt => dt.Nhoms).FirstOrDefaultAsync(dt => dt.MaDeTai == id);
            if (deTai == null) return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền xóa đề tài này" });

            if (deTai.Nhoms.Any()) return BadRequest(new { thongBao = "Không thể xóa đề tài đã có nhóm đăng ký" });

            _db.DeTais.Remove(deTai);
            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Xóa đề tài thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi xóa đề tài: " + ex.Message });
        }
    }

    // =============================================
    // CẬP NHẬT PHƯƠNG THỨC GIAO & NHÓM CHỈ ĐỊNH
    // POST: api/detai/cap-nhat-giao
    // =============================================
    [HttpPost("cap-nhat-giao")]
    public async Task<IActionResult> CapNhatGiaoDeTai([FromBody] GiaoDeTaiDto dto)
    {
        try
        {
            var deTai = await _db.DeTais.Include(dt => dt.Nhoms).FirstOrDefaultAsync(dt => dt.MaDeTai == dto.MaDeTai);
            if (deTai == null) return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền quản lý đề tài này" });

            // Trường hợp 1: Chuyển sang "Đăng ký tự do"
            if (dto.PhuongThucGiao == "Đăng ký tự do")
            {
                // Gỡ tất cả nhóm đang liên kết với đề tài này
                var nhoms = await _db.Nhoms.Where(n => n.MaDeTai == deTai.MaDeTai).ToListAsync();
                foreach (var n in nhoms) n.MaDeTai = null;
                
                deTai.PhuongThucGiao = "Đăng ký tự do";
                await _db.SaveChangesAsync();
                return Ok(new { thongBao = "Đã chuyển phương thức sang Đăng ký tự do" });
            }

            // Trường hợp 2: Chỉ định trực tiếp
            if (dto.PhuongThucGiao == "Chỉ định trực tiếp")
            {
                if (dto.MaNhom == 0 || dto.MaNhom == null)
                {
                    // Gỡ chỉ định (vẫn giữ phương thức Chỉ định trực tiếp nhưng chưa gán nhóm)
                    var nhoms = await _db.Nhoms.Where(n => n.MaDeTai == deTai.MaDeTai).ToListAsync();
                    foreach (var n in nhoms) n.MaDeTai = null;
                    
                    deTai.PhuongThucGiao = "Chỉ định trực tiếp";
                    await _db.SaveChangesAsync();
                    return Ok(new { thongBao = "Đã gỡ nhóm khỏi đề tài" });
                }

                // Kiểm tra nhóm
                var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
                if (nhom == null || nhom.MaLop != deTai.MaLop) return BadRequest(new { thongBao = "Nhóm không hợp lệ" });

                // Nếu nhóm đã có đề tài khác
                if (nhom.MaDeTai != null && nhom.MaDeTai != deTai.MaDeTai)
                    return BadRequest(new { thongBao = $"Nhóm '{nhom.TenNhom}' đã có đề tài khác" });

                // Đề tài đã có nhóm khác nhận chưa?
                var nhomKhac = await _db.Nhoms.FirstOrDefaultAsync(n => n.MaDeTai == deTai.MaDeTai && n.MaNhom != dto.MaNhom);
                if (nhomKhac != null) nhomKhac.MaDeTai = null; // Gỡ nhóm cũ

                nhom.MaDeTai = deTai.MaDeTai;
                deTai.PhuongThucGiao = "Chỉ định trực tiếp";
                
                await _db.SaveChangesAsync();
                return Ok(new { thongBao = $"Đã chỉ định đề tài cho nhóm {nhom.TenNhom}" });
            }

            return BadRequest(new { thongBao = "Phương thức giao không hợp lệ" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật giao đề tài: " + ex.Message });
        }
    }

    [HttpPost("dang-ky")]
    public async Task<IActionResult> DangKyDeTai([FromBody] DangKyDeTaiDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");

            var nhom = await _db.Nhoms.FirstOrDefaultAsync(n => n.MaLop == dto.MaLop && n.MaNhomTruong == maNguoiDung);
            if (nhom == null) return BadRequest(new { thongBao = "Chỉ nhóm trưởng mới có quyền đăng ký" });

            var deTai = await _db.DeTais.FindAsync(dto.MaDeTai);
            if (deTai == null || deTai.MaLop != dto.MaLop) return NotFound(new { thongBao = "Đề tài không hợp lệ" });
            if (deTai.PhuongThucGiao != "Đăng ký tự do") return BadRequest(new { thongBao = "Đề tài này chỉ dành cho chỉ định trực tiếp" });

            var daCoNhom = await _db.Nhoms.AnyAsync(n => n.MaDeTai == dto.MaDeTai);
            if (daCoNhom) return BadRequest(new { thongBao = "Đề tài này đã có nhóm đăng ký" });

            if (nhom.MaDeTai != null) return BadRequest(new { thongBao = "Nhóm bạn đã có đề tài rồi" });

            nhom.MaDeTai = dto.MaDeTai;
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Đăng ký đề tài thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi: " + ex.Message });
        }
    }
}

public class GiaoDeTaiDto
{
    public int MaDeTai { get; set; }
    public int? MaNhom { get; set; }
    public string? PhuongThucGiao { get; set; }
}

public class DangKyDeTaiDto
{
    public int MaDeTai { get; set; }
    public int MaLop { get; set; }
}

public class DeTaiUpdateDto
{
    public string TenDeTai { get; set; } = null!;
    public string? MoTa { get; set; }
    public string? SanPhamKyVong { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
}

public class DeTaiCreateDto
{
    public string TenDeTai { get; set; } = null!;
    public string? MoTa { get; set; }
    public string? SanPhamKyVong { get; set; }
    public int MaLop { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
    public string? PhuongThucGiao { get; set; }
}
