using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
    // LẤY DANH SÁCH LỚP HỌC CỦA TÔI
    // GET: api/lophoc/cua-toi
    // =============================================
    [HttpGet("cua-toi")]
    [Authorize]
    public async Task<IActionResult> DanhSachLopCuaToi()
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");

        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maNguoiDung = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");

        List<object> ketQua = new List<object>();

        if (maVaiTro == 2) // Giảng viên
        {
            List<LopHoc> lopCuaGV = await _db.LopHocs
                .Include(l => l.MaGiangVienNavigation)
                .Where(l => l.MaGiangVien == maNguoiDung)
                .ToListAsync();

            foreach (var lop in lopCuaGV)
            {
                ketQua.Add(new { maLop = lop.MaLop, maLopHoc = lop.MaLopHoc, tenLop = lop.TenLop, tenGiangVien = lop.MaGiangVienNavigation?.HoTen, maHocKy = lop.MaHocKy });
            }
        }
        else if (maVaiTro == 3) // Sinh viên
        {
            // Tìm các lớp mà sinh viên tham gia thông qua Navigation MaSinhViens (M-N với NguoiDung)
            NguoiDung? sv = await _db.NguoiDungs
                .Include(u => u.MaLops) // Sinh viên nằm trong nhiều lớp
                .ThenInclude(l => l.MaGiangVienNavigation)
                .FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDung);

            if (sv != null)
            {
                foreach (var lop in sv.MaLops)
                {
                    ketQua.Add(new { maLop = lop.MaLop, maLopHoc = lop.MaLopHoc, tenLop = lop.TenLop, tenGiangVien = lop.MaGiangVienNavigation?.HoTen, maHocKy = lop.MaHocKy });
                }
            }
        }

        return Ok(ketQua);
    }

    // =============================================
    // THAM GIA LỚP HỌC (Sinh viên nhập mã)
    // POST: api/lophoc/tham-gia
    // =============================================
    [HttpPost("tham-gia")]
    [Authorize]
    public async Task<IActionResult> ThamGiaLop([FromBody] ThamGiaLopDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maNguoiDung = int.Parse(claimMaNguoiDung);

        // Tìm lớp học dựa vào mã lớp học (chuỗi, ví dụ: "LTWEB01")
        LopHoc? lopHoc = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .FirstOrDefaultAsync(l => l.MaLopHoc == dto.MaLopHoc);

        if (lopHoc == null)
        {
            return NotFound(new { thongBao = "Mã lớp học không tồn tại" });
        }

        // Tìm sinh viên
        NguoiDung? sinhVien = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (sinhVien == null) return NotFound(new { thongBao = "Không tìm thấy sinh viên" });

        // Kiểm tra sinh viên đã ở trong lớp chưa
        if (lopHoc.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung))
        {
            return BadRequest(new { thongBao = "Bạn đã tham gia lớp này rồi" });
        }

        // Thêm sinh viên vào lớp
        lopHoc.MaSinhViens.Add(sinhVien);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Tham gia lớp học thành công", maLop = lopHoc.MaLop });
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
public class ThamGiaLopDto
{
    public string MaLopHoc { get; set; } = "";
}

public class TaoLopDto
{
    public string TenLop { get; set; } = "";
    public string MaLopHoc { get; set; } = "";
    public int MaGiangVien { get; set; }
    public int MaHocKy { get; set; }
}