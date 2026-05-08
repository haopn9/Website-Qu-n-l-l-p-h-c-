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
                .Include(dt => dt.TepDinhKems)
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
                assignedGroup = dt.Nhoms.Any(),
                tenNhom = dt.Nhoms.FirstOrDefault()?.TenNhom ?? "",
                maNhom = dt.Nhoms.FirstOrDefault()?.MaNhom,
                tepDinhKem = dt.TepDinhKems
                    .Select(t => new { t.MaTep, t.TenTep, duongDan = t.DuongDanTep })
                    .FirstOrDefault()
            }).ToList();

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi lấy danh sách đề tài: " + ex.Message });
        }
    }

    // =============================================
    // TẠO ĐỀ TÀI MỚI
    // POST: api/detai
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoDeTai([FromForm] DeTaiCreateDto dto)
    {
        try
        {
            var claimMaVaiTro = User.FindFirstValue("maVaiTro");
            if (claimMaVaiTro != "2")
                return BadRequest(new { thongBao = "Chỉ giảng viên mới có quyền tạo đề tài" });

            if (string.IsNullOrWhiteSpace(dto.TenDeTai))
                return BadRequest(new { thongBao = "Tên đề tài không được để trống" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");

            // Lấy lớp kèm thông tin học kỳ để kiểm tra ràng buộc ngày
            var lopHoc = await _db.LopHocs
                .Include(l => l.MaHocKyNavigation)
                .FirstOrDefaultAsync(l => l.MaLop == dto.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền tạo đề tài cho lớp này" });

            // Kiểm tra ràng buộc ngày
            var dateError = ValidateDates(dto.NgayBatDau, dto.NgayKetThuc, lopHoc);
            if (dateError != null) return BadRequest(new { thongBao = dateError });

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

            // Xử lý file đính kèm
            if (dto.File != null && dto.File.Length > 0)
            {
                var tep = await LuuTepDinhKem(dto.File, maNguoiDung);
                if (tep == null) return BadRequest(new { thongBao = "File không hợp lệ hoặc không thể lưu." });
                deTaiMoi.TepDinhKems.Add(tep);
            }

            _db.DeTais.Add(deTaiMoi);
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Tạo đề tài thành công", maDeTai = deTaiMoi.MaDeTai });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi tạo đề tài: " + ex.Message });
        }
    }

    // =============================================
    // CẬP NHẬT ĐỀ TÀI
    // PUT: api/detai/{id}
    // =============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> CapNhatDeTai(int id, [FromForm] DeTaiUpdateDto dto)
    {
        try
        {
            var deTai = await _db.DeTais
                .Include(dt => dt.TepDinhKems)
                .FirstOrDefaultAsync(dt => dt.MaDeTai == id);

            if (deTai == null)
                return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");

            // Lấy lớp kèm thông tin học kỳ
            var lopHoc = await _db.LopHocs
                .Include(l => l.MaHocKyNavigation)
                .FirstOrDefaultAsync(l => l.MaLop == deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền chỉnh sửa đề tài này" });

            // Kiểm tra ràng buộc ngày
            var dateError = ValidateDates(dto.NgayBatDau, dto.NgayKetThuc, lopHoc);
            if (dateError != null) return BadRequest(new { thongBao = dateError });

            deTai.TenDeTai = dto.TenDeTai.Trim();
            deTai.MoTa = dto.MoTa?.Trim();
            deTai.SanPhamKyVong = dto.SanPhamKyVong?.Trim();
            deTai.NgayBatDau = dto.NgayBatDau;
            deTai.NgayKetThuc = dto.NgayKetThuc;

            // Xử lý file đính kèm mới (nếu có)
            if (dto.File != null && dto.File.Length > 0)
            {
                var tep = await LuuTepDinhKem(dto.File, maNguoiDung);
                if (tep == null) return BadRequest(new { thongBao = "File không hợp lệ hoặc không thể lưu." });

                // Xóa file cũ, thay bằng file mới
                var tepCu = await _db.TepDinhKems
                    .Where(t => t.MaDeTai == deTai.MaDeTai)
                    .ToListAsync();
                _db.TepDinhKems.RemoveRange(tepCu);

                deTai.TepDinhKems.Add(tep);
            }

            await _db.SaveChangesAsync();
            return Ok(new { thongBao = "Cập nhật đề tài thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi khi cập nhật đề tài: " + ex.Message });
        }
    }

    // =============================================
    // XÓA ĐỀ TÀI
    // DELETE: api/detai/{id}
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaDeTai(int id)
    {
        try
        {
            var deTai = await _db.DeTais
                .Include(dt => dt.Nhoms)
                .FirstOrDefaultAsync(dt => dt.MaDeTai == id);

            if (deTai == null) return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền xóa đề tài này" });

            if (deTai.Nhoms.Any())
                return BadRequest(new { thongBao = "Không thể xóa đề tài đã có nhóm đăng ký" });

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
            var deTai = await _db.DeTais
                .Include(dt => dt.Nhoms)
                .FirstOrDefaultAsync(dt => dt.MaDeTai == dto.MaDeTai);

            if (deTai == null) return NotFound(new { thongBao = "Đề tài không tồn tại" });

            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");
            var lopHoc = await _db.LopHocs.FindAsync(deTai.MaLop);

            if (lopHoc == null || lopHoc.MaGiangVien != maNguoiDung)
                return BadRequest(new { thongBao = "Bạn không có quyền quản lý đề tài này" });

            if (dto.PhuongThucGiao == "Đăng ký tự do")
            {
                var nhoms = await _db.Nhoms.Where(n => n.MaDeTai == deTai.MaDeTai).ToListAsync();
                foreach (var n in nhoms) n.MaDeTai = null;
                deTai.PhuongThucGiao = "Đăng ký tự do";
                await _db.SaveChangesAsync();
                return Ok(new { thongBao = "Đã chuyển phương thức sang Đăng ký tự do" });
            }

            if (dto.PhuongThucGiao == "Chỉ định trực tiếp")
            {
                if (dto.MaNhom == 0 || dto.MaNhom == null)
                {
                    var nhoms = await _db.Nhoms.Where(n => n.MaDeTai == deTai.MaDeTai).ToListAsync();
                    foreach (var n in nhoms) n.MaDeTai = null;
                    deTai.PhuongThucGiao = "Chỉ định trực tiếp";
                    await _db.SaveChangesAsync();
                    return Ok(new { thongBao = "Đã gỡ nhóm khỏi đề tài" });
                }

                var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
                if (nhom == null || nhom.MaLop != deTai.MaLop)
                    return BadRequest(new { thongBao = "Nhóm không hợp lệ" });

                if (nhom.MaDeTai != null && nhom.MaDeTai != deTai.MaDeTai)
                    return BadRequest(new { thongBao = $"Nhóm '{nhom.TenNhom}' đã có đề tài khác" });

                var nhomKhac = await _db.Nhoms.FirstOrDefaultAsync(
                    n => n.MaDeTai == deTai.MaDeTai && n.MaNhom != dto.MaNhom);
                if (nhomKhac != null) nhomKhac.MaDeTai = null;

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

    // =============================================
    // SINH VIÊN ĐĂNG KÝ ĐỀ TÀI
    // POST: api/detai/dang-ky
    // =============================================
    [HttpPost("dang-ky")]
    public async Task<IActionResult> DangKyDeTai([FromBody] DangKyDeTaiDto dto)
    {
        try
        {
            var maNguoiDungClaim = User.FindFirstValue("maNguoiDung");
            int maNguoiDung = int.Parse(maNguoiDungClaim ?? "0");

            var nhom = await _db.Nhoms.FirstOrDefaultAsync(
                n => n.MaLop == dto.MaLop && n.MaNhomTruong == maNguoiDung);
            if (nhom == null)
                return BadRequest(new { thongBao = "Chỉ nhóm trưởng mới có quyền đăng ký" });

            var deTai = await _db.DeTais.FindAsync(dto.MaDeTai);
            if (deTai == null || deTai.MaLop != dto.MaLop)
                return NotFound(new { thongBao = "Đề tài không hợp lệ" });

            if (deTai.PhuongThucGiao != "Đăng ký tự do")
                return BadRequest(new { thongBao = "Đề tài này chỉ dành cho chỉ định trực tiếp" });

            var daCoNhom = await _db.Nhoms.AnyAsync(n => n.MaDeTai == dto.MaDeTai);
            if (daCoNhom) return BadRequest(new { thongBao = "Đề tài này đã có nhóm đăng ký" });

            if (nhom.MaDeTai != null)
                return BadRequest(new { thongBao = "Nhóm bạn đã có đề tài rồi" });

            nhom.MaDeTai = dto.MaDeTai;
            await _db.SaveChangesAsync();

            return Ok(new { thongBao = "Đăng ký đề tài thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = "Lỗi: " + ex.Message });
        }
    }

    // =============================================
    // PRIVATE HELPERS
    // =============================================

    /// <summary>
    /// Kiểm tra ràng buộc ngày đề tài theo thứ tự:
    ///   ngayBatDauDeTai  ≥ ngayBatDauLop  ≥ ngayBatDauHocKy
    ///   ngayKetThucDeTai ≤ ngayKetThucLop ≤ ngayKetThucHocKy
    /// Trả về null nếu hợp lệ, hoặc thông báo lỗi nếu vi phạm.
    /// </summary>
    private static string? ValidateDates(DateTime? ngayBatDau, DateTime? ngayKetThuc, LopHoc lopHoc)
    {
        // 1. Ngày bắt đầu đề tài vs. ngày bắt đầu lớp
        if (ngayBatDau.HasValue && lopHoc.NgayBatDau.HasValue)
        {
            var classStart = lopHoc.NgayBatDau.Value.ToDateTime(TimeOnly.MinValue);
            if (ngayBatDau.Value < classStart)
                return $"Ngày bắt đầu đề tài ({ngayBatDau.Value:dd/MM/yyyy}) " +
                       $"không được trước ngày bắt đầu lớp học ({lopHoc.NgayBatDau:dd/MM/yyyy}).";
        }

        // 2. Ngày kết thúc đề tài vs. ngày kết thúc lớp
        if (ngayKetThuc.HasValue && lopHoc.NgayKetThuc.HasValue)
        {
            var classEnd = lopHoc.NgayKetThuc.Value.ToDateTime(TimeOnly.MinValue);
            if (ngayKetThuc.Value > classEnd)
                return $"Ngày kết thúc đề tài ({ngayKetThuc.Value:dd/MM/yyyy}) " +
                       $"không được sau ngày kết thúc lớp học ({lopHoc.NgayKetThuc:dd/MM/yyyy}).";
        }

        // 3. Ngày bắt đầu đề tài vs. ngày bắt đầu học kỳ
        if (ngayBatDau.HasValue && lopHoc.MaHocKyNavigation?.NgayBatDau != null)
        {
            var hkStart = lopHoc.MaHocKyNavigation.NgayBatDau.Value.ToDateTime(TimeOnly.MinValue);
            if (ngayBatDau.Value < hkStart)
                return $"Ngày bắt đầu đề tài ({ngayBatDau.Value:dd/MM/yyyy}) " +
                       $"không được trước ngày bắt đầu học kỳ " +
                       $"\"{lopHoc.MaHocKyNavigation.TenHocKy}\" ({lopHoc.MaHocKyNavigation.NgayBatDau:dd/MM/yyyy}).";
        }

        // 4. Ngày kết thúc đề tài vs. ngày kết thúc học kỳ
        if (ngayKetThuc.HasValue && lopHoc.MaHocKyNavigation?.NgayKetThuc != null)
        {
            var hkEnd = lopHoc.MaHocKyNavigation.NgayKetThuc.Value.ToDateTime(TimeOnly.MinValue);
            if (ngayKetThuc.Value > hkEnd)
                return $"Ngày kết thúc đề tài ({ngayKetThuc.Value:dd/MM/yyyy}) " +
                       $"không được sau ngày kết thúc học kỳ " +
                       $"\"{lopHoc.MaHocKyNavigation.TenHocKy}\" ({lopHoc.MaHocKyNavigation.NgayKetThuc:dd/MM/yyyy}).";
        }

        return null; // Hợp lệ
    }

    /// <summary>
    /// Validate và lưu file đính kèm vào wwwroot/uploads/topics.
    /// Trả về TepDinhKem entity nếu thành công, null nếu thất bại.
    /// </summary>
    private async Task<TepDinhKem?> LuuTepDinhKem(IFormFile file, int maNguoiDung)
    {
        var validation = _fileService.ValidateFile(file, ".txt,.docx,.pdf", 5 * 1024 * 1024);
        if (!validation.IsValid) return null;

        string folder = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "topics");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

        string fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        string filePath = Path.Combine(folder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return new TepDinhKem
        {
            TenTep = file.FileName,
            DuongDanTep = "/uploads/topics/" + fileName,
            DungLuong = (int)file.Length,
            NgayUpload = DateTime.Now,
            MaNguoiUpload = maNguoiDung
        };
    }
}

// ─── DTOs ────────────────────────────────────────────────────
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

public class DeTaiCreateDto
{
    public string TenDeTai { get; set; } = null!;
    public string? MoTa { get; set; }
    public string? SanPhamKyVong { get; set; }
    public int MaLop { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
    public string? PhuongThucGiao { get; set; }
    public IFormFile? File { get; set; }
}

public class DeTaiUpdateDto
{
    public string TenDeTai { get; set; } = null!;
    public string? MoTa { get; set; }
    public string? SanPhamKyVong { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
    public IFormFile? File { get; set; }
}
