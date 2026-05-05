using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
}
