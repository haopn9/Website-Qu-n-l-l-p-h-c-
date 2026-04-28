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
        List<Nhom> tatCaNhom = await _db.Nhoms.ToListAsync();
        int tongNhom = tatCaNhom.Count;

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

        // Bước 7: Trả về kết quả
        return Ok(new
        {
            totalUsers = tongNguoiDung,
            totalTeachers = soGiangVien,
            totalStudents = soSinhVien,
            totalClasses = tongLopHoc,
            totalGroups = tongNhom,
            pendingTasks = dangThucHien,
            overdueTasks = treHan,
            totalMessages = tongTinNhan
        });
    }
}