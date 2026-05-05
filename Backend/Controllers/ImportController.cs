using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Chỉ cho phép người dùng đã đăng nhập
public class ImportController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public ImportController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // IMPORT DANH SÁCH SINH VIÊN VÀO LỚP HỌC TỪ FILE EXCEL
    // POST: api/import/sinh-vien-lop
    // =============================================
    [HttpPost("sinh-vien-lop")]
    [Authorize(Roles = "1,2")] // Chỉ Admin (1) và Giảng viên (2) được import
    public async Task<IActionResult> ImportSinhVienVaoLop([FromForm] ImportSinhVienDto dto)
    {
        try
        {
            // Validate input
            if (dto.File == null || dto.File.Length == 0)
            {
                return BadRequest(new { thongBao = "Vui lòng chọn file Excel" });
            }

            if (dto.MaLop <= 0)
            {
                return BadRequest(new { thongBao = "Mã lớp học không hợp lệ" });
            }

            // Kiểm tra lớp học tồn tại
            var lopHoc = await _db.LopHocs.FindAsync(dto.MaLop);
            if (lopHoc == null)
            {
                return BadRequest(new { thongBao = "Lớp học không tồn tại" });
            }

            // Kiểm tra định dạng file
            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(dto.File.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { thongBao = "Chỉ chấp nhận file Excel (.xlsx, .xls)" });
            }

            // Đọc file Excel
            var ketQuaImport = new List<ImportResult>();
            using (var stream = new MemoryStream())
            {
                await dto.File.CopyToAsync(stream);
                using (var package = new ExcelPackage(stream))
                {
                    var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null)
                    {
                        return BadRequest(new { thongBao = "File Excel không có dữ liệu" });
                    }

                    // Đọc dữ liệu từ dòng 2 (bỏ qua header)
                    for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
                    {
                        try
                        {
                            var maSo = worksheet.Cells[row, 1].Text?.Trim();
                            var tenDangNhap = worksheet.Cells[row, 2].Text?.Trim();
                            var hoTen = worksheet.Cells[row, 3].Text?.Trim();
                            var email = worksheet.Cells[row, 4].Text?.Trim();

                            // Validate dữ liệu cơ bản
                            if (string.IsNullOrWhiteSpace(maSo) || string.IsNullOrWhiteSpace(tenDangNhap) ||
                                string.IsNullOrWhiteSpace(hoTen))
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Lỗi",
                                    Message = "Thiếu thông tin bắt buộc (Mã số, Tên đăng nhập, Họ tên)"
                                });
                                continue;
                            }

                            // Kiểm tra sinh viên đã tồn tại
                            var sinhVienTonTai = await _db.NguoiDungs
                                .FirstOrDefaultAsync(u => u.MaSo == maSo || u.TenDangNhap == tenDangNhap);

                            if (sinhVienTonTai != null)
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Bỏ qua",
                                    Message = "Sinh viên đã tồn tại trong hệ thống"
                                });
                                continue;
                            }

                            // Tạo sinh viên mới
                            var sinhVienMoi = new NguoiDung
                            {
                                MaSo = maSo,
                                TenDangNhap = tenDangNhap,
                                MatKhauHash = BCrypt.Net.BCrypt.HashPassword("123456"), // Mật khẩu mặc định
                                HoTen = hoTen,
                                Email = email,
                                MaVaiTro = 3, // Vai trò Sinh viên
                                DangHoatDong = true,
                                NgayTao = DateTime.Now
                            };

                            _db.NguoiDungs.Add(sinhVienMoi);
                            await _db.SaveChangesAsync();

                            // Thêm sinh viên vào lớp học
                            var lopHocCanThem = await _db.LopHocs
                                .Include(l => l.MaSinhViens)
                                .FirstOrDefaultAsync(l => l.MaLop == dto.MaLop);

                            if (lopHocCanThem != null)
                            {
                                lopHocCanThem.MaSinhViens.Add(sinhVienMoi);
                                await _db.SaveChangesAsync();
                            }

                            ketQuaImport.Add(new ImportResult
                            {
                                Row = row,
                                MaSo = maSo,
                                TenDangNhap = tenDangNhap,
                                HoTen = hoTen,
                                Email = email,
                                Status = "Thành công",
                                Message = $"Đã thêm sinh viên và đăng ký vào lớp {lopHoc.TenLop}"
                            });
                        }
                        catch (Exception ex)
                        {
                            ketQuaImport.Add(new ImportResult
                            {
                                Row = row,
                                Status = "Lỗi",
                                Message = $"Lỗi xử lý: {ex.Message}"
                            });
                        }
                    }
                }
            }

            // Tính toán thống kê
            var thanhCong = ketQuaImport.Count(r => r.Status == "Thành công");
            var boQua = ketQuaImport.Count(r => r.Status == "Bỏ qua");
            var loi = ketQuaImport.Count(r => r.Status == "Lỗi");

            return Ok(new
            {
                thongBao = $"Import hoàn thành. Thành công: {thanhCong}, Bỏ qua: {boQua}, Lỗi: {loi}",
                tongSo = ketQuaImport.Count,
                thanhCong = thanhCong,
                boQua = boQua,
                loi = loi,
                chiTiet = ketQuaImport
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = $"Lỗi khi import: {ex.Message}" });
        }
    }

    // =============================================
    // IMPORT DANH SÁCH NGƯỜI DÙNG (Admin/Giảng viên)
    // POST: api/import/nguoi-dung
    // =============================================
    [HttpPost("nguoi-dung")]
    [Authorize(Roles = "1")] // Chỉ Admin được import người dùng
    public async Task<IActionResult> ImportNguoiDung([FromForm] ImportNguoiDungDto dto)
    {
        try
        {
            // Validate input
            if (dto.File == null || dto.File.Length == 0)
            {
                return BadRequest(new { thongBao = "Vui lòng chọn file Excel" });
            }

            // Kiểm tra định dạng file
            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(dto.File.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { thongBao = "Chỉ chấp nhận file Excel (.xlsx, .xls)" });
            }

            // Đọc file Excel
            var ketQuaImport = new List<ImportResult>();
            using (var stream = new MemoryStream())
            {
                await dto.File.CopyToAsync(stream);
                using (var package = new ExcelPackage(stream))
                {
                    var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null)
                    {
                        return BadRequest(new { thongBao = "File Excel không có dữ liệu" });
                    }

                    // Đọc dữ liệu từ dòng 2 (bỏ qua header)
                    for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
                    {
                        try
                        {
                            var maSo = worksheet.Cells[row, 1].Text?.Trim();
                            var tenDangNhap = worksheet.Cells[row, 2].Text?.Trim();
                            var hoTen = worksheet.Cells[row, 3].Text?.Trim();
                            var email = worksheet.Cells[row, 4].Text?.Trim();
                            var maVaiTroText = worksheet.Cells[row, 5].Text?.Trim();
                            var maKhoaText = worksheet.Cells[row, 6].Text?.Trim();

                            // Validate dữ liệu cơ bản
                            if (string.IsNullOrWhiteSpace(maSo) || string.IsNullOrWhiteSpace(tenDangNhap) ||
                                string.IsNullOrWhiteSpace(hoTen) || string.IsNullOrWhiteSpace(maVaiTroText))
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Lỗi",
                                    Message = "Thiếu thông tin bắt buộc (Mã số, Tên đăng nhập, Họ tên, Vai trò)"
                                });
                                continue;
                            }

                            // Parse vai trò và khoa
                            if (!int.TryParse(maVaiTroText, out int maVaiTro))
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Lỗi",
                                    Message = "Mã vai trò phải là số"
                                });
                                continue;
                            }

                            int? maKhoa = null;
                            int khoaParsed = 0;
                            if (!string.IsNullOrWhiteSpace(maKhoaText) && !int.TryParse(maKhoaText, out khoaParsed))
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Lỗi",
                                    Message = "Mã khoa phải là số"
                                });
                                continue;
                            }
                            else if (!string.IsNullOrWhiteSpace(maKhoaText))
                            {
                                maKhoa = khoaParsed;
                            }

                            // Kiểm tra vai trò tồn tại
                            var vaiTro = await _db.VaiTros.FindAsync(maVaiTro);
                            if (vaiTro == null)
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Lỗi",
                                    Message = "Vai trò không tồn tại"
                                });
                                continue;
                            }

                            // Kiểm tra khoa nếu có
                            if (maKhoa.HasValue)
                            {
                                var khoa = await _db.Khoas.FindAsync(maKhoa.Value);
                                if (khoa == null)
                                {
                                    ketQuaImport.Add(new ImportResult
                                    {
                                        Row = row,
                                        MaSo = maSo,
                                        TenDangNhap = tenDangNhap,
                                        HoTen = hoTen,
                                        Email = email,
                                        Status = "Lỗi",
                                        Message = "Khoa không tồn tại"
                                    });
                                    continue;
                                }
                            }

                            // Kiểm tra người dùng đã tồn tại
                            var nguoiDungTonTai = await _db.NguoiDungs
                                .FirstOrDefaultAsync(u => u.MaSo == maSo || u.TenDangNhap == tenDangNhap);

                            if (nguoiDungTonTai != null)
                            {
                                ketQuaImport.Add(new ImportResult
                                {
                                    Row = row,
                                    MaSo = maSo,
                                    TenDangNhap = tenDangNhap,
                                    HoTen = hoTen,
                                    Email = email,
                                    Status = "Bỏ qua",
                                    Message = "Người dùng đã tồn tại trong hệ thống"
                                });
                                continue;
                            }

                            // Tạo người dùng mới
                            var nguoiDungMoi = new NguoiDung
                            {
                                MaSo = maSo,
                                TenDangNhap = tenDangNhap,
                                MatKhauHash = BCrypt.Net.BCrypt.HashPassword("123456"), // Mật khẩu mặc định
                                HoTen = hoTen,
                                Email = email,
                                MaKhoa = maKhoa,
                                MaVaiTro = maVaiTro,
                                DangHoatDong = true,
                                NgayTao = DateTime.Now
                            };

                            _db.NguoiDungs.Add(nguoiDungMoi);
                            await _db.SaveChangesAsync();

                            ketQuaImport.Add(new ImportResult
                            {
                                Row = row,
                                MaSo = maSo,
                                TenDangNhap = tenDangNhap,
                                HoTen = hoTen,
                                Email = email,
                                Status = "Thành công",
                                Message = $"Đã thêm người dùng với vai trò {vaiTro.TenVaiTro}"
                            });
                        }
                        catch (Exception ex)
                        {
                            ketQuaImport.Add(new ImportResult
                            {
                                Row = row,
                                Status = "Lỗi",
                                Message = $"Lỗi xử lý: {ex.Message}"
                            });
                        }
                    }
                }
            }

            // Tính toán thống kê
            var thanhCong = ketQuaImport.Count(r => r.Status == "Thành công");
            var boQua = ketQuaImport.Count(r => r.Status == "Bỏ qua");
            var loi = ketQuaImport.Count(r => r.Status == "Lỗi");

            return Ok(new
            {
                thongBao = $"Import hoàn thành. Thành công: {thanhCong}, Bỏ qua: {boQua}, Lỗi: {loi}",
                tongSo = ketQuaImport.Count,
                thanhCong = thanhCong,
                boQua = boQua,
                loi = loi,
                chiTiet = ketQuaImport
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { thongBao = $"Lỗi khi import: {ex.Message}" });
        }
    }
}

// =============================================
// DTOs cho Import
// =============================================
public class ImportSinhVienDto
{
    public IFormFile File { get; set; } = null!;
    public int MaLop { get; set; }
}

public class ImportNguoiDungDto
{
    public IFormFile File { get; set; } = null!;
}

public class ImportResult
{
    public int Row { get; set; }
    public string? MaSo { get; set; }
    public string? TenDangNhap { get; set; }
    public string? HoTen { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = ""; // "Thành công", "Bỏ qua", "Lỗi"
    public string Message { get; set; } = "";
}