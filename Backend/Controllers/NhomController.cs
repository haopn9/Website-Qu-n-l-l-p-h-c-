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
    // LAY DANH SACH NHOM THEO LOP
    // GET: api/nhom?maLop=1
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachNhom([FromQuery] int? maLop)
    {
        DateOnly homNay = DateOnly.FromDateTime(DateTime.Today);

        var query = _db.Nhoms
            .Include(n => n.MaLopNavigation)
            .Include(n => n.MaNhomTruongNavigation)
            .Include(n => n.MaSinhViens)
            .Include(n => n.MaDeTaiNavigation)
            .Include(n => n.NhiemVus)
            .Include(n => n.TinNhans)
            .AsQueryable();

        if (maLop.HasValue)
        {
            query = query.Where(n => n.MaLop == maLop.Value);
        }

        var ketQua = await query
            .OrderBy(n => n.MaLopNavigation.TenLop)
            .ThenBy(n => n.TenNhom)
            .Select(nhom => new
            {
                maNhom = nhom.MaNhom,
                maLop = nhom.MaLop,
                tenLop = nhom.MaLopNavigation.TenLop,
                maLopHoc = nhom.MaLopNavigation.MaLopHoc,
                tenNhom = nhom.TenNhom,
                soThanhVienToiDa = nhom.SoThanhVienToiDa,
                soThanhVienHienTai = nhom.MaSinhViens.Count,
                maNhomTruong = nhom.MaNhomTruong,
                nhomTruong = nhom.MaNhomTruongNavigation != null ? nhom.MaNhomTruongNavigation.HoTen : "Chua co",
                maDeTai = nhom.MaDeTai,
                tenDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.TenDeTai : null,
                moTaDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.MoTa : null,
                sanPhamKyVong = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.SanPhamKyVong : null,
                ngayBatDauDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.NgayBatDau : null,
                ngayKetThucDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.NgayKetThuc : null,
                soLuongTask = nhom.NhiemVus.Count,
                soLuongHoanThanh = nhom.NhiemVus.Count(nv => nv.TrangThai == "Hoan thanh" || nv.TrangThai == "Hoàn thành"),
                soLuongTinNhan = nhom.TinNhans.Count,
                trangThai = nhom.MaLopNavigation.NgayKetThuc != null && nhom.MaLopNavigation.NgayKetThuc < homNay ? "inactive" : "active",
                thanhVien = nhom.MaSinhViens
                    .OrderBy(sv => sv.HoTen)
                    .Select(sv => new
                    {
                        maNguoiDung = sv.MaNguoiDung,
                        maSo = sv.MaSo,
                        hoTen = sv.HoTen,
                        email = sv.Email,
                        lopSinhVien = sv.LopSinhVien,
                        vaiTroTrongNhom = nhom.MaNhomTruong == sv.MaNguoiDung ? "leader" : "member"
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(ketQua);
    }

    // =============================================
    // XEM CHI TIET NHOM + DANH SACH THANH VIEN
    // GET: api/nhom/1
    // =============================================
    [HttpGet("{maNhom}")]
    public async Task<IActionResult> ChiTietNhom(int maNhom)
    {
        var nhom = await _db.Nhoms
            .Include(n => n.MaLopNavigation)
            .Include(n => n.MaNhomTruongNavigation)
            .Include(n => n.MaSinhViens)
            .Include(n => n.MaDeTaiNavigation)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        return Ok(new
        {
            maNhom = nhom.MaNhom,
            tenNhom = nhom.TenNhom,
            maLop = nhom.MaLop,
            tenLop = nhom.MaLopNavigation.TenLop,
            nhomTruong = nhom.MaNhomTruongNavigation != null ? nhom.MaNhomTruongNavigation.HoTen : "Chua co",
            maDeTai = nhom.MaDeTai,
            tenDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.TenDeTai : null,
            thanhVien = nhom.MaSinhViens.Select(sv => new
            {
                maSinhVien = sv.MaNguoiDung,
                maSo = sv.MaSo,
                hoTen = sv.HoTen,
                email = sv.Email,
                lopSinhVien = sv.LopSinhVien,
                vaiTroTrongNhom = nhom.MaNhomTruong == sv.MaNguoiDung ? "leader" : "member"
            })
        });
    }

    // =============================================
    // TAO NHOM MOI
    // POST: api/nhom
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoNhom([FromBody] TaoNhomDto dto)
    {
        dto.TenNhom = dto.TenNhom.Trim();
        if (string.IsNullOrWhiteSpace(dto.TenNhom))
        {
            return BadRequest(new { thongBao = "Ten nhom khong duoc de trong" });
        }

        var nhomMoi = new Nhom
        {
            TenNhom = dto.TenNhom,
            MaLop = dto.MaLop,
            SoThanhVienToiDa = dto.SoThanhVienToiDa
        };

        _db.Nhoms.Add(nhomMoi);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Tao nhom thanh cong", maNhom = nhomMoi.MaNhom });
    }

    // =============================================
    // THEM SINH VIEN VAO NHOM
    // POST: api/nhom/1/themthanhvien
    // =============================================
    [HttpPost("{maNhom}/themthanhvien")]
    public async Task<IActionResult> ThemThanhVien(int maNhom, [FromBody] ThemThanhVienDto dto)
    {
        var nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        if (nhom.MaSinhViens.Count >= (nhom.SoThanhVienToiDa ?? 0))
        {
            return BadRequest(new { thongBao = "Nhom da du thanh vien" });
        }

        var sinhVien = await _db.NguoiDungs.FindAsync(dto.MaSinhVien);
        if (sinhVien == null)
        {
            return NotFound(new { thongBao = "Khong tim thay sinh vien" });
        }

        if (nhom.MaSinhViens.Any(sv => sv.MaNguoiDung == dto.MaSinhVien))
        {
            return BadRequest(new { thongBao = "Sinh vien da co trong nhom" });
        }

        nhom.MaSinhViens.Add(sinhVien);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Them thanh vien thanh cong" });
    }

    // =============================================
    // XOA THANH VIEN KHOI NHOM
    // DELETE: api/nhom/1/xoathanhvien/2
    // =============================================
    [HttpDelete("{maNhom}/xoathanhvien/{maSinhVien}")]
    public async Task<IActionResult> XoaThanhVien(int maNhom, int maSinhVien)
    {
        var nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        var canXoa = nhom.MaSinhViens.FirstOrDefault(sv => sv.MaNguoiDung == maSinhVien);
        if (canXoa == null)
        {
            return NotFound(new { thongBao = "Sinh vien khong co trong nhom" });
        }

        nhom.MaSinhViens.Remove(canXoa);
        if (nhom.MaNhomTruong == maSinhVien)
        {
            nhom.MaNhomTruong = null;
        }

        await _db.SaveChangesAsync();
        return Ok(new { thongBao = "Xoa thanh vien thanh cong" });
    }

    // =============================================
    // DAT NHOM TRUONG
    // PUT: api/nhom/1/nhomtruong
    // =============================================
    [HttpPut("{maNhom}/nhomtruong")]
    public async Task<IActionResult> DatNhomTruong(int maNhom, [FromBody] DatNhomTruongDto dto)
    {
        var nhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .FirstOrDefaultAsync(n => n.MaNhom == maNhom);

        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        if (!nhom.MaSinhViens.Any(sv => sv.MaNguoiDung == dto.MaSinhVien))
        {
            var sinhVien = await _db.NguoiDungs.FindAsync(dto.MaSinhVien);
            if (sinhVien == null)
            {
                return NotFound(new { thongBao = "Khong tim thay sinh vien" });
            }

            nhom.MaSinhViens.Add(sinhVien);
        }

        nhom.MaNhomTruong = dto.MaSinhVien;
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Dat nhom truong thanh cong" });
    }

    // =============================================
    // THEM DE TAI CHO NHOM
    // POST: api/nhom/1/detai
    // =============================================
    [HttpPost("{maNhom}/detai")]
    public async Task<IActionResult> ThemDeTai(int maNhom, [FromBody] ThemDeTaiDto dto)
    {
        var nhom = await _db.Nhoms.FindAsync(maNhom);
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        dto.TenDeTai = dto.TenDeTai.Trim();
        if (string.IsNullOrWhiteSpace(dto.TenDeTai))
        {
            return BadRequest(new { thongBao = "Ten de tai khong duoc de trong" });
        }

        var deTaiMoi = new DeTai
        {
            TenDeTai = dto.TenDeTai,
            MoTa = string.IsNullOrWhiteSpace(dto.MoTa) ? null : dto.MoTa.Trim(),
            SanPhamKyVong = string.IsNullOrWhiteSpace(dto.SanPhamKyVong) ? null : dto.SanPhamKyVong.Trim(),
            MaLop = nhom.MaLop,
            NgayBatDau = dto.NgayBatDau,
            NgayKetThuc = dto.NgayKetThuc
        };

        _db.DeTais.Add(deTaiMoi);
        await _db.SaveChangesAsync();

        nhom.MaDeTai = deTaiMoi.MaDeTai;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            thongBao = "Them de tai thanh cong",
            maDeTai = deTaiMoi.MaDeTai
        });
    }

    // =============================================
    // XOA NHOM
    // DELETE: api/nhom/1
    // =============================================
    [HttpDelete("{maNhom}")]
    public async Task<IActionResult> XoaNhom(int maNhom)
    {
        var nhom = await _db.Nhoms.FindAsync(maNhom);
        if (nhom == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nhom" });
        }

        _db.Nhoms.Remove(nhom);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xoa nhom thanh cong" });
    }
}

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
