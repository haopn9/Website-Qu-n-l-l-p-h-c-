using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public AdminController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // THỐNG KÊ TỔNG QUAN CHO DASHBOARD
    // GET: api/admin/thongke
    // =============================================
    [HttpGet("thongke")]
    public async Task<IActionResult> ThongKe()
    {
        // Bước 1: Lấy tất cả người dùng
        List<NguoiDung> tatCaNguoiDung = await _db.NguoiDungs.ToListAsync();

        // Bước 2: Đếm từng loại
        int tongNguoiDung = tatCaNguoiDung.Count;
        int soGiangVien = 0;
        int soSinhVien = 0;
        foreach (NguoiDung u in tatCaNguoiDung)
        {
            if (u.MaVaiTro == 2) soGiangVien++;
            if (u.MaVaiTro == 3) soSinhVien++;
        }

        // Bước 3: Đếm lớp học
        List<LopHoc> tatCaLopHoc = await _db.LopHocs.ToListAsync();
        int tongLopHoc = tatCaLopHoc.Count;

        // Bước 4: Đếm nhóm
        List<Nhom> tatCaNhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .ToListAsync();
        int tongNhom = tatCaNhom.Count;
        int nhomDangHoatDong = 0;
        foreach (var nhom in tatCaNhom)
        {
            if (nhom.MaSinhViens.Count > 0) nhomDangHoatDong++;
        }

        // Bước 5: Đếm nhiệm vụ
        List<NhiemVu> tatCaNhiemVu = await _db.NhiemVus.ToListAsync();
        int dangThucHien = 0;
        int treHan = 0;
        foreach (NhiemVu nv in tatCaNhiemVu)
        {
            if (nv.TrangThai == "Đang thực hiện") dangThucHien++;
            if (nv.TrangThai == "Trễ hạn") treHan++;
        }

        // Bước 6: Đếm tin nhắn
        List<TinNhan> tatCaTinNhan = await _db.TinNhans.ToListAsync();
        int tongTinNhan = tatCaTinNhan.Count;

        // Bước 7: Đếm khoa & lớp hành chính
        int tongKhoa = await _db.Khoas.CountAsync();
        int tongLopHanhChinh = await _db.LopSinhViens.CountAsync();

        // Bước 8: Trả về kết quả
        return Ok(new
        {
            totalUsers = tongNguoiDung,
            totalTeachers = soGiangVien,
            totalStudents = soSinhVien,
            totalClasses = tongLopHoc,
            totalGroups = tongNhom,
            activeGroups = nhomDangHoatDong,
            pendingTasks = dangThucHien,
            overdueTasks = treHan,
            totalMessages = tongTinNhan,
            totalDepartments = tongKhoa,
            totalAdminClasses = tongLopHanhChinh
        });
    }

    // =============================================
    // LẤY CÂY PHÂN CẤP: KHOA -> GIẢNG VIÊN -> LỚP -> NHÓM
    // GET: api/admin/khoa-giangvien-lophoc-nhom
    // =============================================
    [HttpGet("khoa-giangvien-lophoc-nhom")]
    public async Task<IActionResult> GetHierarchy()
    {
        var khoas = await _db.Khoas
            .Include(k => k.NguoiDungs.Where(u => u.MaVaiTro == 2))
                .ThenInclude(gv => gv.LopHocs)
                    .ThenInclude(l => l.Nhoms)
                        .ThenInclude(n => n.MaDeTaiNavigation)
            .Include(k => k.NguoiDungs.Where(u => u.MaVaiTro == 2))
                .ThenInclude(gv => gv.LopHocs)
                    .ThenInclude(l => l.Nhoms)
                        .ThenInclude(n => n.MaSinhViens)
            .Select(k => new
            {
                k.MaKhoa,
                k.TenKhoa,
                GiangViens = k.NguoiDungs.Where(u => u.MaVaiTro == 2).Select(gv => new
                {
                    gv.MaNguoiDung,
                    gv.HoTen,
                    gv.MaSo,
                    LopHocs = gv.LopHocs.Select(l => new
                    {
                        l.MaLop,
                        l.MaLopHoc,
                        l.TenLop,
                        Nhoms = l.Nhoms.Select(n => new
                        {
                            n.MaNhom,
                            n.TenNhom,
                            TenDeTai = n.MaDeTaiNavigation != null ? n.MaDeTaiNavigation.TenDeTai : null,
                            SoThanhVien = n.MaSinhViens.Count,
                            n.SoThanhVienToiDa
                        }).ToList()
                    }).ToList()
                }).ToList()
            }).ToListAsync();

        return Ok(khoas);
    }

    // =============================================
    // QUẢN LÝ CẤU HÌNH HỆ THỐNG
    // =============================================
    
    public class CauHinhUpdateDto
    {
        public Dictionary<string, string> Settings { get; set; } = new();
    }

    [HttpGet("cauhinh")]
    public async Task<IActionResult> GetCauHinh()
    {
        var cauHinhs = await _db.CauHinhHeThongs.ToListAsync();
        return Ok(cauHinhs);
    }

    [HttpPost("cauhinh")]
    public async Task<IActionResult> UpdateCauHinh([FromBody] CauHinhUpdateDto dto)
    {
        foreach (var kvp in dto.Settings)
        {
            var setting = await _db.CauHinhHeThongs.FirstOrDefaultAsync(c => c.KhoaCauHinh == kvp.Key);
            if (setting != null)
            {
                setting.GiaTriCauHinh = kvp.Value;
            }
            else
            {
                _db.CauHinhHeThongs.Add(new CauHinhHeThong
                {
                    KhoaCauHinh = kvp.Key,
                    GiaTriCauHinh = kvp.Value
                });
            }
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật cấu hình thành công" });
    }
}