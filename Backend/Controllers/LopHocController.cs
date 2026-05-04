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
    // LAY DANH SACH TAT CA LOP HOC
    // GET: api/lophoc
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachLop()
    {
        DateOnly homNay = DateOnly.FromDateTime(DateTime.Today);

        var tatCaLop = await _db.LopHocs
            .Include(l => l.MaGiangVienNavigation)
            .Include(l => l.MaHocKyNavigation)
            .Include(l => l.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaNhomTruongNavigation)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaDeTaiNavigation)
            .OrderByDescending(l => l.MaHocKyNavigation.LaHienTai)
            .ThenByDescending(l => l.MaHocKy)
            .ThenBy(l => l.TenLop)
            .ToListAsync();

        var ketQua = tatCaLop.Select(lop =>
        {
            string trangThai = "sap-dien-ra";
            if (lop.NgayBatDau.HasValue && lop.NgayBatDau > homNay)
            {
                trangThai = "sap-dien-ra";
            }
            else if (lop.NgayKetThuc.HasValue && lop.NgayKetThuc < homNay)
            {
                trangThai = "inactive";
            }
            else
            {
                trangThai = "active";
            }

            var danhSachNhom = lop.Nhoms
                .OrderBy(n => n.TenNhom)
                .Select(nhom => new
                {
                    maNhom = nhom.MaNhom,
                    tenNhom = nhom.TenNhom,
                    soThanhVien = nhom.MaSinhViens.Count,
                    maNhomTruong = nhom.MaNhomTruong,
                    tenNhomTruong = nhom.MaNhomTruongNavigation != null ? nhom.MaNhomTruongNavigation.HoTen : "Chua co",
                    maDeTai = nhom.MaDeTai,
                    tenDeTai = nhom.MaDeTaiNavigation != null ? nhom.MaDeTaiNavigation.TenDeTai : null
                })
                .ToList();

            var danhSachSinhVien = lop.MaSinhViens
                .OrderBy(sv => sv.HoTen)
                .Select(sv =>
                {
                    var nhomCuaSinhVien = lop.Nhoms.FirstOrDefault(n => n.MaSinhViens.Any(tv => tv.MaNguoiDung == sv.MaNguoiDung));
                    return new
                    {
                        maNguoiDung = sv.MaNguoiDung,
                        maSo = sv.MaSo,
                        hoTen = sv.HoTen,
                        email = sv.Email,
                        lopSinhVien = sv.LopSinhVien,
                        maNhom = nhomCuaSinhVien?.MaNhom,
                        tenNhom = nhomCuaSinhVien?.TenNhom
                    };
                })
                .ToList();

            return new
            {
                maLop = lop.MaLop,
                maLopHoc = lop.MaLopHoc,
                tenLop = lop.TenLop,
                maGiangVien = lop.MaGiangVien,
                tenGiangVien = lop.MaGiangVienNavigation.HoTen,
                maHocKy = lop.MaHocKy,
                tenHocKy = lop.MaHocKyNavigation.TenHocKy,
                ngayBatDau = lop.NgayBatDau,
                ngayKetThuc = lop.NgayKetThuc,
                thoiGianHoc = lop.ThoiGianHoc,
                choPhepDangKyNhom = lop.ChoPhepDangKyNhom ?? true,
                hanDangKyNhom = lop.HanDangKyNhom,
                soSinhVien = lop.MaSinhViens.Count,
                soNhom = lop.Nhoms.Count,
                soDeTai = lop.Nhoms.Count(n => n.MaDeTai.HasValue),
                trangThai = trangThai,
                danhSachSinhVien = danhSachSinhVien,
                danhSachNhom = danhSachNhom
            };
        });

        return Ok(ketQua);
    }

    // =============================================
    // LAY DANH SACH GIANG VIEN
    // GET: api/lophoc/giangvien
    // =============================================
    [HttpGet("giangvien")]
    public async Task<IActionResult> DanhSachGiangVien()
    {
        var ketQua = await _db.NguoiDungs
            .Where(u => u.MaVaiTro == 2 && (u.DangHoatDong ?? false))
            .OrderBy(u => u.HoTen)
            .Select(u => new
            {
                maNguoiDung = u.MaNguoiDung,
                hoTen = u.HoTen
            })
            .ToListAsync();

        return Ok(ketQua);
    }

    // =============================================
    // LAY DANH SACH HOC KY
    // GET: api/lophoc/hocky
    // =============================================
    [HttpGet("hocky")]
    public async Task<IActionResult> DanhSachHocKy()
    {
        var ketQua = await _db.HocKies
            .OrderByDescending(hk => hk.LaHienTai)
            .ThenByDescending(hk => hk.MaHocKy)
            .Select(hk => new
            {
                maHocKy = hk.MaHocKy,
                tenHocKy = hk.TenHocKy,
                ngayBatDau = hk.NgayBatDau,
                ngayKetThuc = hk.NgayKetThuc,
                laHienTai = hk.LaHienTai ?? false
            })
            .ToListAsync();

        return Ok(ketQua);
    }

    // =============================================
    // LAY DANH SACH LOP CUA NGUOI DUNG HIEN TAI
    // GET: api/lophoc/cua-toi
    // =============================================
    [HttpGet("cua-toi")]
    public async Task<IActionResult> GetMyClasses()
    {
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Khong xac dinh duoc nguoi dung" });
        }

        var user = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (user == null)
        {
            return NotFound(new { thongBao = "Khong tim thay nguoi dung" });
        }

        DateOnly homNay = DateOnly.FromDateTime(DateTime.Today);

        // Get classes based on user role
        List<LopHoc> lopHocList;
        if (user.MaVaiTro == 2)
        {
            // Teacher - get classes they teach
            lopHocList = await _db.LopHocs
                .Where(l => l.MaGiangVien == maNguoiDung)
                .Include(l => l.MaGiangVienNavigation)
                .Include(l => l.MaHocKyNavigation)
                .Include(l => l.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaNhomTruongNavigation)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaDeTaiNavigation)
                .OrderByDescending(l => l.MaHocKyNavigation.LaHienTai)
                .ThenByDescending(l => l.MaHocKy)
                .ThenBy(l => l.TenLop)
                .ToListAsync();
        }
        else if (user.MaVaiTro == 3)
        {
            // Student - get classes they're in
            lopHocList = await _db.LopHocs
                .Where(l => l.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung))
                .Include(l => l.MaGiangVienNavigation)
                .Include(l => l.MaHocKyNavigation)
                .Include(l => l.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaNhomTruongNavigation)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaDeTaiNavigation)
                .OrderByDescending(l => l.MaHocKyNavigation.LaHienTai)
                .ThenByDescending(l => l.MaHocKy)
                .ThenBy(l => l.TenLop)
                .ToListAsync();
        }
        else
        {
            // Admin can see all classes
            lopHocList = await _db.LopHocs
                .Include(l => l.MaGiangVienNavigation)
                .Include(l => l.MaHocKyNavigation)
                .Include(l => l.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaNhomTruongNavigation)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaSinhViens)
                .Include(l => l.Nhoms)
                    .ThenInclude(n => n.MaDeTaiNavigation)
                .OrderByDescending(l => l.MaHocKyNavigation.LaHienTai)
                .ThenByDescending(l => l.MaHocKy)
                .ThenBy(l => l.TenLop)
                .ToListAsync();
        }

        var ketQua = lopHocList.Select(lop =>
        {
            string trangThai = "sap-dien-ra";
            if (lop.NgayBatDau.HasValue && lop.NgayBatDau > homNay)
            {
                trangThai = "sap-dien-ra";
            }
            else if (lop.NgayKetThuc.HasValue && lop.NgayKetThuc < homNay)
            {
                trangThai = "inactive";
            }
            else
            {
                trangThai = "active";
            }

            return new
            {
                maLop = lop.MaLop,
                maLopHoc = lop.MaLopHoc,
                tenLop = lop.TenLop,
                maGiangVien = lop.MaGiangVien,
                tenGiangVien = lop.MaGiangVienNavigation.HoTen,
                maHocKy = lop.MaHocKy,
                tenHocKy = lop.MaHocKyNavigation.TenHocKy,
                ngayBatDau = lop.NgayBatDau,
                ngayKetThuc = lop.NgayKetThuc,
                thoiGianHoc = lop.ThoiGianHoc,
                soSinhVien = lop.MaSinhViens.Count,
                soNhom = lop.Nhoms.Count,
                soDeTai = lop.Nhoms.Count(n => n.MaDeTai.HasValue),
                trangThai = trangThai
            };
        });

        return Ok(ketQua);
    }

    // =============================================
    // THAM GIA LOP HOC BANG MA LOP
    // POST: api/lophoc/tham-gia
    // =============================================
    [HttpPost("tham-gia")]
    public async Task<IActionResult> JoinClass([FromBody] JoinClassDto dto)
    {
        var maNguoiDungClaim = User.FindFirst("maNguoiDung")?.Value;
        if (string.IsNullOrEmpty(maNguoiDungClaim) || !int.TryParse(maNguoiDungClaim, out int maNguoiDung))
        {
            return Unauthorized(new { thongBao = "Khong xac dinh duoc nguoi dung" });
        }

        if (string.IsNullOrWhiteSpace(dto.MaLopHoc))
        {
            return BadRequest(new { thongBao = "Ma lop hoc khong duoc de trong" });
        }

        var lop = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .FirstOrDefaultAsync(l => l.MaLopHoc == dto.MaLopHoc);
        if (lop == null)
        {
            return NotFound(new { thongBao = "Khong tim thay lop hoc" });
        }

        var sinhVien = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (sinhVien == null || sinhVien.MaVaiTro != 3)
        {
            return BadRequest(new { thongBao = "Chi sinh vien moi co the tham gia lop hoc" });
        }

        // Check if already in class
        if (lop.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung))
        {
            return BadRequest(new { thongBao = "Ban da tham gia lop hoc nay roi" });
        }

        lop.MaSinhViens.Add(sinhVien);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Tham gia lop hoc thanh cong", maLop = lop.MaLop });
    }

    // =============================================
    // TAO LOP HOC MOI
    // POST: api/lophoc
    // =============================================
    [HttpPost]
    public async Task<IActionResult> TaoLop([FromBody] TaoLopDto dto)
    {
        dto.TenLop = dto.TenLop.Trim();
        dto.MaLopHoc = dto.MaLopHoc.Trim();

        if (string.IsNullOrWhiteSpace(dto.TenLop) || string.IsNullOrWhiteSpace(dto.MaLopHoc))
        {
            return BadRequest(new { thongBao = "Ten lop va ma lop hoc khong duoc de trong" });
        }

        if (await _db.LopHocs.AnyAsync(l => l.MaLopHoc == dto.MaLopHoc))
        {
            return BadRequest(new { thongBao = "Ma lop hoc da ton tai" });
        }

        var lopMoi = new LopHoc
        {
            TenLop = dto.TenLop,
            MaLopHoc = dto.MaLopHoc,
            MaGiangVien = dto.MaGiangVien,
            MaHocKy = dto.MaHocKy,
            NgayBatDau = dto.NgayBatDau,
            NgayKetThuc = dto.NgayKetThuc,
            ThoiGianHoc = string.IsNullOrWhiteSpace(dto.ThoiGianHoc) ? null : dto.ThoiGianHoc.Trim(),
            ChoPhepDangKyNhom = dto.ChoPhepDangKyNhom,
            HanDangKyNhom = dto.HanDangKyNhom
        };

        _db.LopHocs.Add(lopMoi);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Tao lop thanh cong", maLop = lopMoi.MaLop });
    }

    // =============================================
    // XOA LOP HOC
    // DELETE: api/lophoc/1
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaLop(int id)
    {
        var lop = await _db.LopHocs.FindAsync(id);
        if (lop == null)
        {
            return NotFound(new { thongBao = "Khong tim thay lop hoc" });
        }

        _db.LopHocs.Remove(lop);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xoa lop thanh cong" });
    }
}

public class TaoLopDto
{
    public string TenLop { get; set; } = "";
    public string MaLopHoc { get; set; } = "";
    public int MaGiangVien { get; set; }
    public int MaHocKy { get; set; }
    public DateOnly? NgayBatDau { get; set; }
    public DateOnly? NgayKetThuc { get; set; }
    public string? ThoiGianHoc { get; set; }
    public bool? ChoPhepDangKyNhom { get; set; } = true;
    public DateTime? HanDangKyNhom { get; set; }
}

public class JoinClassDto
{
    public string MaLopHoc { get; set; } = "";
}
