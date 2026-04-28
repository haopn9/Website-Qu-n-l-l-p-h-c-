using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NguoiDungController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public NguoiDungController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH NGƯỜI DÙNG
    // GET: api/nguoidung
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachNguoiDung()
    {
        // Bước 1: Lấy tất cả người dùng kèm vai trò
        List<NguoiDung> tatCaNguoiDung = await _db.NguoiDungs
            .Include(u => u.MaVaiTroNavigation)
            .ToListAsync();

        // Bước 2: Tạo danh sách kết quả
        List<object> ketQua = new List<object>();
        foreach (NguoiDung u in tatCaNguoiDung)
        {
            ketQua.Add(new
            {
                maNguoiDung = u.MaNguoiDung,
                maSo = u.MaSo,
                tenDangNhap = u.TenDangNhap,
                hoTen = u.HoTen,
                email = u.Email,
                maVaiTro = u.MaVaiTro,
                tenVaiTro = u.MaVaiTroNavigation != null ? u.MaVaiTroNavigation.TenVaiTro : "",
                dangHoatDong = u.DangHoatDong
            });
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // THÊM NGƯỜI DÙNG MỚI
    // POST: api/nguoidung
    // =============================================
    [HttpPost]
    public async Task<IActionResult> ThemNguoiDung([FromBody] ThemNguoiDungDto dto)
    {
        // Bước 1: Tạo object người dùng mới
        NguoiDung nguoiDungMoi = new NguoiDung();
        nguoiDungMoi.MaSo = dto.MaSo;
        nguoiDungMoi.TenDangNhap = dto.TenDangNhap;
        nguoiDungMoi.MatKhauHash = dto.MatKhau;   // thực tế cần hash BCrypt
        nguoiDungMoi.HoTen = dto.HoTen;
        nguoiDungMoi.Email = dto.Email;
        nguoiDungMoi.MaKhoa = dto.MaKhoa;
        nguoiDungMoi.MaVaiTro = dto.MaVaiTro;
        nguoiDungMoi.DangHoatDong = true;

        // Bước 2: Thêm vào database
        _db.NguoiDungs.Add(nguoiDungMoi);

        // Bước 3: Lưu lại
        await _db.SaveChangesAsync();

        // Bước 4: Trả về kết quả
        return Ok(new { thongBao = "Thêm người dùng thành công", maNguoiDung = nguoiDungMoi.MaNguoiDung });
    }

    // =============================================
    // KHÓA / MỞ KHÓA TÀI KHOẢN
    // PUT: api/nguoidung/5/trangthai
    // =============================================
    [HttpPut("{id}/trangthai")]
    public async Task<IActionResult> DoiTrangThai(int id)
    {
        // Bước 1: Tìm người dùng
        NguoiDung? nguoiDung = await _db.NguoiDungs.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Bước 3: Đổi trạng thái (true → false, false → true)
        if (nguoiDung.DangHoatDong == true)
        {
            nguoiDung.DangHoatDong = false;
        }
        else
        {
            nguoiDung.DangHoatDong = true;
        }

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cập nhật trạng thái thành công", trangThai = nguoiDung.DangHoatDong });
    }

    // =============================================
    // XÓA NGƯỜI DÙNG
    // DELETE: api/nguoidung/5
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaNguoiDung(int id)
    {
        // Bước 1: Tìm người dùng
        NguoiDung? nguoiDung = await _db.NguoiDungs.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (nguoiDung == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy người dùng" });
        }

        // Bước 3: Xóa mềm - chỉ khóa tài khoản thay vì xóa hẳn
        nguoiDung.DangHoatDong = false;

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xóa người dùng thành công" });
    }
}

// =============================================
// DTOs
// =============================================
public class ThemNguoiDungDto
{
    public string MaSo { get; set; } = "";
    public string TenDangNhap { get; set; } = "";
    public string MatKhau { get; set; } = "";
    public string HoTen { get; set; } = "";
    public string Email { get; set; } = "";
    public int MaKhoa { get; set; }
    public int MaVaiTro { get; set; }
}