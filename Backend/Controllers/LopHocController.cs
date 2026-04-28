using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LopHocController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public LopHocController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH TẤT CẢ LỚP HỌC
    // GET: api/lophoc
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachLop()
    {
        // Bước 1: Lấy tất cả lớp học kèm thông tin giảng viên
        List<LopHoc> tatCaLop = await _db.LopHocs
            .Include(l => l.MaGiangVienNavigation)
            .ToListAsync();

        // Bước 2: Tạo danh sách kết quả
        List<object> ketQua = new List<object>();
        foreach (LopHoc lop in tatCaLop)
        {
            string tenGiangVien = "";
            if (lop.MaGiangVienNavigation != null)
            {
                tenGiangVien = lop.MaGiangVienNavigation.HoTen;
            }

            ketQua.Add(new
            {
                maLop = lop.MaLop,
                maLopHoc = lop.MaLopHoc,
                tenLop = lop.TenLop,
                maGiangVien = lop.MaGiangVien,
                tenGiangVien = tenGiangVien,
                maHocKy = lop.MaHocKy,
                ngayBatDau = lop.NgayBatDau,
                ngayKetThuc = lop.NgayKetThuc
            });
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // LẤY DANH SÁCH GIẢNG VIÊN (cho dropdown tạo lớp)
    // GET: api/lophoc/giangvien
    // =============================================
    [HttpGet("giangvien")]
    public async Task<IActionResult> DanhSachGiangVien()
    {
        // Bước 1: Lấy tất cả người dùng
        List<NguoiDung> tatCaNguoiDung = await _db.NguoiDungs.ToListAsync();

        // Bước 2: Lọc chỉ lấy giảng viên (MaVaiTro = 2)
        List<object> ketQua = new List<object>();
        foreach (NguoiDung u in tatCaNguoiDung)
        {
            if (u.MaVaiTro == 2)
            {
                ketQua.Add(new
                {
                    maNguoiDung = u.MaNguoiDung,
                    hoTen = u.HoTen
                });
            }
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // LẤY DANH SÁCH HỌC KỲ (cho dropdown tạo lớp)
    // GET: api/lophoc/hocky
    // =============================================
    [HttpGet("hocky")]
    public async Task<IActionResult> DanhSachHocKy()
    {
        // Bước 1: Lấy tất cả học kỳ
        List<HocKy> tatCaHocKy = await _db.HocKies.ToListAsync();

        // Bước 2: Tạo kết quả
        List<object> ketQua = new List<object>();
        foreach (HocKy hk in tatCaHocKy)
        {
            ketQua.Add(new
            {
                maHocKy = hk.MaHocKy,
                tenHocKy = hk.TenHocKy
            });
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // TẠO LỚP HỌC MỚI
    // POST: api/lophoc
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoLop([FromBody] TaoLopDto dto)
    {
        // Bước 1: Tạo object lớp học mới
        LopHoc lopMoi = new LopHoc();
        lopMoi.TenLop = dto.TenLop;
        lopMoi.MaLopHoc = dto.MaLopHoc;
        lopMoi.MaGiangVien = dto.MaGiangVien;
        lopMoi.MaHocKy = dto.MaHocKy;

        // Bước 2: Thêm vào database
        _db.LopHocs.Add(lopMoi);

        // Bước 3: Lưu lại
        await _db.SaveChangesAsync();

        // Bước 4: Trả về kết quả
        return Ok(new { thongBao = "Tạo lớp thành công", maLop = lopMoi.MaLop });
    }

    // =============================================
    // XÓA LỚP HỌC
    // DELETE: api/lophoc/1
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaLop(int id)
    {
        // Bước 1: Tìm lớp học
        LopHoc? lop = await _db.LopHocs.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (lop == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy lớp học" });
        }

        // Bước 3: Xóa lớp
        _db.LopHocs.Remove(lop);
        await _db.SaveChangesAsync();

        // Bước 4: Trả về kết quả
        return Ok(new { thongBao = "Xóa lớp thành công" });
    }
}

// =============================================
// DTOs
// =============================================
public class TaoLopDto
{
    public string TenLop { get; set; } = "";
    public string MaLopHoc { get; set; } = "";
    public int MaGiangVien { get; set; }
    public int MaHocKy { get; set; }
}