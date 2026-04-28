using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NhomController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public NhomController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LẤY DANH SÁCH NHÓM THEO LỚP
    // GET: api/nhom?maLop=1
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachNhom(int maLop)
    {
        // Bước 1: Lấy tất cả nhóm ra
        List<Nhom> tatCaNhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)          // kèm danh sách sinh viên
            .Include(n => n.MaNhomTruongNavigation) // kèm thông tin nhóm trưởng
            .ToListAsync();

        // Bước 2: Lọc theo lớp
        List<Nhom> nhomTheoLop = new List<Nhom>();
        foreach (Nhom nhom in tatCaNhom)
        {
            if (nhom.MaLop == maLop)
            {
                nhomTheoLop.Add(nhom);
            }
        }

        // Bước 3: Tạo danh sách kết quả dễ đọc
        List<object> ketQua = new List<object>();
        foreach (Nhom nhom in nhomTheoLop)
        {
            string tenNhomTruong = "Chưa có";
            if (nhom.MaNhomTruongNavigation != null)
            {
                tenNhomTruong = nhom.MaNhomTruongNavigation.HoTen;
            }

            ketQua.Add(new
            {
                maNhom = nhom.MaNhom,
                tenNhom = nhom.TenNhom,
                soThanhVienToiDa = nhom.SoThanhVienToiDa,
                soThanhVienHienTai = nhom.MaSinhViens.Count,
                nhomTruong = tenNhomTruong
            });
        }

        return Ok(ketQua);
    }

    // =============================================
    // XEM CHI TIẾT NHÓM + DANH SÁCH THÀNH VIÊN
    // GET: api/nhom/1
    // =============================================
    [HttpGet("{maNhom}")]
    public async Task<IActionResult> ChiTietNhom(int maNhom)
    {
        // Bước 1: Tìm nhóm theo mã, kèm thành viên
        Nhom? nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .Include(n => n.MaNhomTruongNavigation)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        // Bước 2: Kiểm tra có tồn tại không
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 3: Tạo danh sách thành viên
        List<object> danhSachThanhVien = new List<object>();
        foreach (NguoiDung sv in nhom.MaSinhViens)
        {
            danhSachThanhVien.Add(new
            {
                maSinhVien = sv.MaNguoiDung,
                hoTen = sv.HoTen,
                email = sv.Email
            });
        }

        // Bước 4: Trả về kết quả
        string tenNhomTruong = "Chưa có";
        if (nhom.MaNhomTruongNavigation != null)
        {
            tenNhomTruong = nhom.MaNhomTruongNavigation.HoTen;
        }

        return Ok(new
        {
            maNhom = nhom.MaNhom,
            tenNhom = nhom.TenNhom,
            nhomTruong = tenNhomTruong,
            thanhVien = danhSachThanhVien
        });
    }

    // =============================================
    // TẠO NHÓM MỚI
    // POST: api/nhom
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoNhom([FromBody] TaoNhomDto dto)
    {
        // Bước 1: Tạo object nhóm mới
        Nhom nhomMoi = new Nhom();
        nhomMoi.TenNhom = dto.TenNhom;
        nhomMoi.MaLop = dto.MaLop;
        nhomMoi.SoThanhVienToiDa = dto.SoThanhVienToiDa;

        // Bước 2: Thêm vào database
        _db.Nhoms.Add(nhomMoi);

        // Bước 3: Lưu lại
        await _db.SaveChangesAsync();

        // Bước 4: Trả về kết quả
        return Ok(new { thongBao = "Tạo nhóm thành công", maNhom = nhomMoi.MaNhom });
    }

    // =============================================
    // THÊM SINH VIÊN VÀO NHÓM
    // POST: api/nhom/1/themthanhvien
    // =============================================
    [HttpPost("{maNhom}/themthanhvien")]
    public async Task<IActionResult> ThemThanhVien(int maNhom, [FromBody] ThemThanhVienDto dto)
    {
        // Bước 1: Tìm nhóm, kèm danh sách sinh viên hiện tại
        Nhom? nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        // Bước 2: Kiểm tra nhóm có tồn tại không
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 3: Kiểm tra nhóm có đầy không
        if (nhom.MaSinhViens.Count >= nhom.SoThanhVienToiDa)
        {
            return BadRequest(new { thongBao = "Nhóm đã đủ thành viên" });
        }

        // Bước 4: Tìm sinh viên cần thêm
        NguoiDung? sinhVien = await _db.NguoiDungs.FindAsync(dto.MaSinhVien);
        if (sinhVien == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy sinh viên" });
        }

        // Bước 5: Thêm sinh viên vào nhóm
        nhom.MaSinhViens.Add(sinhVien);

        // Bước 6: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Thêm thành viên thành công" });
    }

    // =============================================
    // XÓA THÀNH VIÊN KHỎI NHÓM
    // DELETE: api/nhom/1/xoathanhvien/2
    // =============================================
    [HttpDelete("{maNhom}/xoathanhvien/{maSinhVien}")]
    public async Task<IActionResult> XoaThanhVien(int maNhom, int maSinhVien)
    {
        // Bước 1: Tìm nhóm kèm danh sách thành viên
        Nhom? nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        // Bước 2: Kiểm tra nhóm có tồn tại không
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 3: Tìm sinh viên cần xóa trong danh sách
        NguoiDung? canXoa = null;
        foreach (NguoiDung sv in nhom.MaSinhViens)
        {
            if (sv.MaNguoiDung == maSinhVien)
            {
                canXoa = sv;
            }
        }

        // Bước 4: Kiểm tra có tìm thấy không
        if (canXoa == null)
        {
            return NotFound(new { thongBao = "Sinh viên không có trong nhóm" });
        }

        // Bước 5: Xóa khỏi nhóm
        nhom.MaSinhViens.Remove(canXoa);

        // Bước 6: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xóa thành viên thành công" });
    }

    // =============================================
    // ĐẶT NHÓM TRƯỞNG
    // PUT: api/nhom/1/nhomtruong
    // =============================================
    [HttpPut("{maNhom}/nhomtruong")]
    public async Task<IActionResult> DatNhomTruong(int maNhom, [FromBody] DatNhomTruongDto dto)
    {
        // Bước 1: Tìm nhóm
        Nhom? nhom = await _db.Nhoms.FindAsync(maNhom);

        // Bước 2: Kiểm tra có tồn tại không
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 3: Cập nhật nhóm trưởng
        nhom.MaNhomTruong = dto.MaSinhVien;

        // Bước 4: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Đặt nhóm trưởng thành công" });
    }


    // =============================================
    // THÊM ĐỀ TÀI CHO NHÓM
    // POST: api/nhom/1/detai
    // =============================================
    [HttpPost("{maNhom}/detai")]
    public async Task<IActionResult> ThemDeTai(int maNhom, [FromBody] ThemDeTaiDto dto)
    {
        // Bước 1: Tìm nhóm
        Nhom? nhom = await _db.Nhoms.FindAsync(maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 2: Tạo đề tài mới
        DeTai deTaiMoi = new DeTai();
        deTaiMoi.TenDeTai = dto.TenDeTai;
        deTaiMoi.MoTa = dto.MoTa;
        deTaiMoi.SanPhamKyVong = dto.SanPhamKyVong;
        deTaiMoi.MaLop = nhom.MaLop;
        deTaiMoi.NgayBatDau = dto.NgayBatDau;
        deTaiMoi.NgayKetThuc = dto.NgayKetThuc;

        // Bước 3: Lưu đề tài
        _db.DeTais.Add(deTaiMoi);
        await _db.SaveChangesAsync();

        // Bước 4: Gán đề tài cho nhóm
        nhom.MaDeTai = deTaiMoi.MaDeTai;
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Thêm đề tài thành công", maDeTai = deTaiMoi.MaDeTai });
    }

    // =============================================
    // XÓA NHÓM
    // DELETE: api/nhom/1
    // =============================================
    [HttpDelete("{maNhom}")]
    public async Task<IActionResult> XoaNhom(int maNhom)
    {
        // Bước 1: Tìm nhóm
        Nhom? nhom = await _db.Nhoms.FindAsync(maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        }

        // Bước 2: Xóa nhóm
        _db.Nhoms.Remove(nhom);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xóa nhóm thành công" });
    }
}


// =============================================
// DTOs
// =============================================
public class TaoNhomDto
{
    public string TenNhom { get; set; } = "";
    public int MaLop { get; set; }
    public int SoThanhVienToiDa { get; set; } = 5;
}

public class ThemThanhVienDto
{
    public int MaSinhVien { get; set; }
}

public class DatNhomTruongDto
{
    public int MaSinhVien { get; set; }
}
public class ThemDeTaiDto
{
    public string TenDeTai { get; set; } = "";
    public string? MoTa { get; set; }
    public string? SanPhamKyVong { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
}