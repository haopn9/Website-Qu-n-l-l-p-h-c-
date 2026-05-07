using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NhiemVuController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IFileValidationService _fileValidationService;

    public NhiemVuController(
        QuanLyLopHocDbContext db,
        IWebHostEnvironment env,
        IFileValidationService fileValidationService)
    {
        _db = db;
        _env = env;
        _fileValidationService = fileValidationService;
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
            List<NhiemVu> cacTasks = await _db.NhiemVus
                .Include(t => t.MaNguoiDungs)
                .Include(t => t.LichSuNhiemVus)
                .Include(t => t.TepDinhKems)
                .Include(t => t.MaNhomNavigation)
                    .ThenInclude(n => n.MaLopNavigation)
                .Where(t => t.MaNhom == maNhom)
                .OrderBy(t => t.HanHoanThanh ?? DateTime.MaxValue)
                .ToListAsync();

            var ketQua = cacTasks.Select(MapTaskDto).ToList();

            return Ok(ketQua);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách task: " + ex.Message });
        }
    }

    // =============================================
    // LẤY TẤT CẢ TASK TRONG CÁC NHÓM CỦA SINH VIÊN
    // GET: api/nhiemvu/nhom-cua-toi
    // =============================================
    [HttpGet("nhom-cua-toi")]
    public async Task<IActionResult> DanhSachTaskNhomCuaToi()
    {
        try
        {
            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var maNhoms = await _db.Nhoms
                .Where(n => n.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung))
                .Select(n => n.MaNhom)
                .ToListAsync();

            var cacTasks = await _db.NhiemVus
                .Include(t => t.MaNguoiDungs)
                .Include(t => t.LichSuNhiemVus)
                .Include(t => t.TepDinhKems)
                .Include(t => t.MaNhomNavigation)
                    .ThenInclude(n => n.MaLopNavigation)
                .Where(t => maNhoms.Contains(t.MaNhom))
                .OrderBy(t => t.MaNhomNavigation.TenNhom)
                .ThenBy(t => t.HanHoanThanh ?? DateTime.MaxValue)
                .ToListAsync();

            return Ok(cacTasks.Select(MapTaskDto).ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy nhiệm vụ của các nhóm: " + ex.Message });
        }
    }

    // =============================================
    // XEM CHI TIẾT TASK
    // GET: api/nhiemvu/{id}
    // =============================================
    [HttpGet("{id}")]
    public async Task<IActionResult> ChiTietTask(int id)
    {
        try
        {
            var task = await _db.NhiemVus
                .Include(t => t.MaNguoiDungs)
                .Include(t => t.LichSuNhiemVus)
                .Include(t => t.TepDinhKems)
                .FirstOrDefaultAsync(t => t.MaNhiemVu == id);

            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy nhiệm vụ" });
            }

            return Ok(task);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết task: " + ex.Message });
        }
    }

    // =============================================
    // TẠO TASK MỚI
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

            if (dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count > 1)
            {
                return BadRequest(new { message = "Mỗi nhiệm vụ chỉ được giao cho 1 thành viên" });
            }

            var timeValidation = ValidateTaskDates(dto.NgayBatDau, dto.HanHoanThanh, null);
            if (!timeValidation.IsValid)
            {
                return BadRequest(new { message = timeValidation.ErrorMessage });
            }

            var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
            if (nhom == null)
            {
                return BadRequest(new { message = "Nhóm không tồn tại" });
            }

            // Kiểm tra MaDeTai nếu có
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
                TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? (dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count > 0 ? "Đang thực hiện" : "Chưa bắt đầu") : dto.TrangThai.Trim(),
                PhanTramHoanThanh = 0,
                NgayTao = DateTime.Now,
                MaNguoiDungs = new List<NguoiDung>()
            };

            // Giao cho thành viên
            if (dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count > 0)
            {
                var thanhViens = await _db.NguoiDungs
                    .Where(u => dto.MaNguoiDungs.Contains(u.MaNguoiDung))
                    .ToListAsync();
                foreach (var tv in thanhViens)
                {
                    nhiemVu.MaNguoiDungs.Add(tv);
                }
            }

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
                GhiChu = dto.GhiChu?.Trim()
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
    // UPLOAD TỆP ĐÍNH KÈM CHO TASK
    // POST: api/nhiemvu/{id}/tep-dinh-kem
    // =============================================
    [HttpPost("{id}/tep-dinh-kem")]
    public async Task<IActionResult> UploadTepDinhKem(int id, [FromForm] List<IFormFile> files)
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

            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 tệp" });
            }

            const string allowedExtensions = ".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.txt";
            const int maxFileSizeBytes = 20 * 1024 * 1024;
            var uploadRoot = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "tasks", id.ToString());
            Directory.CreateDirectory(uploadRoot);

            var savedFiles = new List<object>();
            foreach (var file in files)
            {
                var validation = _fileValidationService.ValidateFile(file, allowedExtensions, maxFileSizeBytes);
                if (!validation.IsValid)
                {
                    return BadRequest(new { message = validation.ErrorMessage });
                }

                var extension = Path.GetExtension(file.FileName);
                var safeFileName = $"{Guid.NewGuid():N}{extension}";
                var physicalPath = Path.Combine(uploadRoot, safeFileName);
                await using (var stream = new FileStream(physicalPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"/uploads/tasks/{id}/{safeFileName}";
                var tep = new TepDinhKem
                {
                    MaNhiemVu = id,
                    TenTep = Path.GetFileName(file.FileName),
                    DuongDanTep = relativePath,
                    DungLuong = (int)Math.Min(file.Length, int.MaxValue),
                    MaNguoiUpload = maNguoiDung,
                    NgayUpload = DateTime.Now
                };

                _db.TepDinhKems.Add(tep);
                savedFiles.Add(new
                {
                    tenTep = tep.TenTep,
                    duongDanTep = tep.DuongDanTep,
                    dungLuong = tep.DungLuong
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Upload tệp đính kèm thành công", files = savedFiles });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi upload tệp đính kèm: " + ex.Message });
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
            if (dto.MoiHanHoanThanh.HasValue)
            {
                var timeValidation = ValidateTaskDates(task.NgayBatDau, task.HanHoanThanh, dto.MoiHanHoanThanh);
                if (!timeValidation.IsValid)
                {
                    return BadRequest(new { message = timeValidation.ErrorMessage });
                }
                task.HanHoanThanh = dto.MoiHanHoanThanh.Value;
            }

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
            var nhiemVu = await _db.NhiemVus
                .Include(t => t.MaNguoiDungs)
                .FirstOrDefaultAsync(t => t.MaNhiemVu == id);
            if (nhiemVu == null)
            {
                return NotFound(new { message = "Nhiệm vụ không tồn tại" });
            }

            if (dto.MaNhom <= 0 || string.IsNullOrWhiteSpace(dto.TenNhiemVu))
            {
                return BadRequest(new { message = "MaNhom và TenNhiemVu là bắt buộc" });
            }

            if (dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count > 1)
            {
                return BadRequest(new { message = "Mỗi nhiệm vụ chỉ được giao cho 1 thành viên" });
            }

            var timeValidation = ValidateTaskDates(dto.NgayBatDau ?? nhiemVu.NgayBatDau, dto.HanHoanThanh ?? nhiemVu.HanHoanThanh, null);
            if (!timeValidation.IsValid)
            {
                return BadRequest(new { message = timeValidation.ErrorMessage });
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

            var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
            int.TryParse(maNguoiDungClaim, out int maNguoiCapNhat);
            var assigneeCu = nhiemVu.MaNguoiDungs.Select(u => u.MaNguoiDung).OrderBy(id => id).ToList();
            var hanHoanThanhCu = nhiemVu.HanHoanThanh;

            nhiemVu.MaNhom = dto.MaNhom;
            nhiemVu.MaDeTai = dto.MaDeTai;
            nhiemVu.TenNhiemVu = dto.TenNhiemVu.Trim();
            nhiemVu.MoTa = dto.MoTa?.Trim() ?? nhiemVu.MoTa;
            nhiemVu.NgayBatDau = dto.NgayBatDau ?? nhiemVu.NgayBatDau;
            nhiemVu.HanHoanThanh = dto.HanHoanThanh ?? nhiemVu.HanHoanThanh;
            nhiemVu.MucDoUuTien = dto.MucDoUuTien?.Trim() ?? nhiemVu.MucDoUuTien;
            nhiemVu.TrangThai = dto.TrangThai?.Trim() ?? nhiemVu.TrangThai;
            nhiemVu.PhanTramHoanThanh = dto.PhanTramHoanThanh ?? nhiemVu.PhanTramHoanThanh;

            // Nếu đang là "Chưa bắt đầu" mà gán thêm người thì chuyển sang "Đang thực hiện"
            if (nhiemVu.TrangThai == "Chưa bắt đầu" && dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count > 0)
            {
                nhiemVu.TrangThai = "Đang thực hiện";
            }
            else if (dto.MaNguoiDungs != null && dto.MaNguoiDungs.Count == 0 && nhiemVu.TrangThai == "Đang thực hiện")
            {
                nhiemVu.TrangThai = "Chưa bắt đầu";
            }

            // Cập nhật thành viên được giao
            if (dto.MaNguoiDungs != null)
            {
                nhiemVu.MaNguoiDungs.Clear();

                // Thêm phân công mới
                var thanhViens = await _db.NguoiDungs
                    .Where(u => dto.MaNguoiDungs.Contains(u.MaNguoiDung))
                    .ToListAsync();
                foreach (var tv in thanhViens)
                {
                    nhiemVu.MaNguoiDungs.Add(tv);
                }
            }

            _db.NhiemVus.Update(nhiemVu);
            await _db.SaveChangesAsync();

            if (maNguoiCapNhat > 0)
            {
                var assigneeMoi = dto.MaNguoiDungs?.OrderBy(id => id).ToList() ?? assigneeCu;
                var doiNguoiLam = dto.MaNguoiDungs != null && !assigneeCu.SequenceEqual(assigneeMoi) && assigneeCu.Count > 0 && assigneeMoi.Count > 0;
                var giaHan = dto.HanHoanThanh.HasValue && hanHoanThanhCu.HasValue && dto.HanHoanThanh.Value.Date > hanHoanThanhCu.Value.Date;

                _db.LichSuNhiemVus.Add(new LichSuNhiemVu
                {
                    MaNhiemVu = id,
                    MaNguoiCapNhat = maNguoiCapNhat,
                    NgayCapNhat = DateTime.Now,
                    TrangThaiMoi = nhiemVu.TrangThai,
                    PhanTramMoi = nhiemVu.PhanTramHoanThanh,
                    GhiChu = doiNguoiLam
                        ? "Nhóm trưởng đổi thành viên làm thay task"
                        : giaHan
                            ? (string.IsNullOrWhiteSpace(dto.GhiChuCapNhat) ? "Nhóm trưởng gia hạn nhiệm vụ" : dto.GhiChuCapNhat.Trim())
                        : (string.IsNullOrWhiteSpace(dto.GhiChuCapNhat) ? "Nhóm trưởng cập nhật nhiệm vụ" : dto.GhiChuCapNhat.Trim())
                });
                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Cập nhật nhiệm vụ thành công",
                maNhiemVu = nhiemVu.MaNhiemVu,
                trangThai = nhiemVu.TrangThai
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật nhiệm vụ: " + ex.Message });
        }
    }
    // XÓA TASK
    // DELETE: api/nhiemvu/{id}
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaTask(int id)
    {
        try
        {
            var task = await _db.NhiemVus.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = "Không tìm thấy nhiệm vụ" });
            }

            _db.NhiemVus.Remove(task);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa nhiệm vụ thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xóa nhiệm vụ: " + ex.Message });
        }
    }

    private static object MapTaskDto(NhiemVu t)
    {
        var trangThai = (t.TrangThai != "Hoàn thành" && t.TrangThai != "Chờ duyệt" && t.HanHoanThanh.HasValue && t.HanHoanThanh.Value.Date < DateTime.Now.Date)
            ? "Trễ hạn"
            : t.TrangThai;
        var lichSuMoiNhat = t.LichSuNhiemVus
            .OrderByDescending(ls => ls.NgayCapNhat)
            .FirstOrDefault();
        var lichSuNop = t.LichSuNhiemVus
            .Where(ls => (ls.TrangThaiMoi ?? "").Contains("Chờ duyệt"))
            .OrderByDescending(ls => ls.NgayCapNhat)
            .FirstOrDefault();
        var lichSuLamLai = t.LichSuNhiemVus
            .Where(ls => (ls.TrangThaiMoi ?? "").Contains("Làm lại") || (ls.GhiChu ?? "").Contains("yêu cầu làm lại"))
            .OrderByDescending(ls => ls.NgayCapNhat)
            .FirstOrDefault();
        var coLamThay = t.LichSuNhiemVus.Any(ls => (ls.GhiChu ?? "").Contains("làm thay"));

        return new
        {
            maNhiemVu = t.MaNhiemVu,
            tenNhiemVu = t.TenNhiemVu,
            moTa = t.MoTa,
            ngayBatDau = t.NgayBatDau,
            hanHoanThanh = t.HanHoanThanh,
            mucDoUuTien = t.MucDoUuTien,
            trangThai,
            phanTramHoanThanh = t.PhanTramHoanThanh,
            maDeTai = t.MaDeTai,
            maNhom = t.MaNhom,
            tenNhom = t.MaNhomNavigation?.TenNhom,
            maLop = t.MaNhomNavigation?.MaLop,
            tenLop = t.MaNhomNavigation?.MaLopNavigation?.TenLop,
            soThanhVienThamGia = t.MaNguoiDungs?.Count ?? 0,
            ghiChu = CleanSubmissionNote(lichSuMoiNhat?.GhiChu),
            ghiChuNop = CleanSubmissionNote(lichSuNop?.GhiChu),
            lyDoLamLai = lichSuLamLai?.GhiChu,
            coLamThay,
            tepDinhKems = t.TepDinhKems?.Select(f => new
            {
                maTep = f.MaTep,
                tenTep = f.TenTep,
                duongDanTep = f.DuongDanTep,
                dungLuong = f.DungLuong,
                ngayUpload = f.NgayUpload
            }).Cast<object>().ToList() ?? new List<object>(),
            maNguoiDungs = t.MaNguoiDungs?.Select(m => new
            {
                maNguoiDung = m.MaNguoiDung,
                maSo = m.MaSo,
                hoTen = m.HoTen
            }).Cast<object>().ToList() ?? new List<object>()
        };
    }

    private static (bool IsValid, string ErrorMessage) ValidateTaskDates(DateTime? ngayBatDau, DateTime? hanHoanThanh, DateTime? hanHoanThanhMoi)
    {
        if (ngayBatDau.HasValue && hanHoanThanh.HasValue && ngayBatDau.Value.Date >= hanHoanThanh.Value.Date)
        {
            return (false, "Ngày bắt đầu phải nhỏ hơn hạn hoàn thành");
        }

        if (hanHoanThanh.HasValue && hanHoanThanhMoi.HasValue && hanHoanThanh.Value.Date >= hanHoanThanhMoi.Value.Date)
        {
            return (false, "Hạn hoàn thành mới phải lớn hơn hạn hoàn thành hiện tại");
        }

        return (true, string.Empty);
    }

    private static string? CleanSubmissionNote(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
        {
            return note;
        }

        const string marker = "%.";
        if (note.StartsWith("Sinh viên nộp task. Tiến độ:", StringComparison.OrdinalIgnoreCase))
        {
            var markerIndex = note.IndexOf(marker, StringComparison.Ordinal);
            if (markerIndex >= 0)
            {
                return note[(markerIndex + marker.Length)..].Trim();
            }
        }

        return note.Trim();
    }

}

// =============================================
// DTOs
// =============================================
public class NhiemVuCreateUpdateDto
{
    public int MaNhom { get; set; }
    public int? MaDeTai { get; set; }
    public string TenNhiemVu { get; set; } = "";
    public string? MoTa { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? HanHoanThanh { get; set; }
    public string? MucDoUuTien { get; set; }
    public string? TrangThai { get; set; }
    public int? PhanTramHoanThanh { get; set; }
    public List<int>? MaNguoiDungs { get; set; }
    public string? GhiChuCapNhat { get; set; }
}

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
    public DateTime? MoiHanHoanThanh { get; set; }
}
