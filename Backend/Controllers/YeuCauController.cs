using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class YeuCauController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public YeuCauController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // SINH VIÊN XIN VÀO NHÓM
    // POST: api/yeucau/xin-vao-nhom
    // =============================================
    [HttpPost("xin-vao-nhom")]
    [Authorize]
    public async Task<IActionResult> XinVaoNhom([FromBody] XinVaoNhomDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        if (string.IsNullOrEmpty(claimMaNguoiDung)) return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        int maNguoiDung = int.Parse(claimMaNguoiDung);

        // Kiểm tra nhóm
        Nhom? nhom = await _db.Nhoms.Include(n => n.MaSinhViens).FirstOrDefaultAsync(n => n.MaNhom == dto.MaNhom);
        if (nhom == null) return NotFound(new { thongBao = "Không tìm thấy nhóm" });
        
        if (nhom.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung))
            return BadRequest(new { thongBao = "Bạn đã ở trong nhóm này rồi" });

        // Tạo yêu cầu
        YeuCauVaoNhom yc = new YeuCauVaoNhom
        {
            MaSinhVien = maNguoiDung,
            MaNhom = dto.MaNhom,
            LoiNhan = dto.LoiNhan,
            TrangThai = "Chờ duyệt",
            NgayGui = DateTime.Now
        };

        _db.YeuCauVaoNhoms.Add(yc);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Đã gửi yêu cầu xin vào nhóm", maYeuCau = yc.MaYeuCau });
    }

    // =============================================
    // SINH VIÊN XIN CHUYỂN NHÓM
    // POST: api/yeucau/xin-chuyen-nhom
    // =============================================
    [HttpPost("xin-chuyen-nhom")]
    [Authorize]
    public async Task<IActionResult> XinChuyenNhom([FromBody] XinChuyenNhomDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        if (string.IsNullOrEmpty(claimMaNguoiDung)) return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        int maNguoiDung = int.Parse(claimMaNguoiDung);

        // Kiểm tra nhóm hiện tại và nhóm muốn chuyển
        Nhom? nhomHienTai = await _db.Nhoms.FindAsync(dto.MaNhomHienTai);
        Nhom? nhomMuon = await _db.Nhoms.FindAsync(dto.MaNhomMuon);
        
        if (nhomHienTai == null || nhomMuon == null) 
            return NotFound(new { thongBao = "Không tìm thấy nhóm" });

        // Tạo yêu cầu
        YeuCauChuyenNhom yc = new YeuCauChuyenNhom
        {
            MaSinhVien = maNguoiDung,
            MaNhomHienTai = dto.MaNhomHienTai,
            MaNhomMuon = dto.MaNhomMuon,
            LyDo = dto.LyDo,
            TrangThai = "Chờ duyệt",
            NgayGui = DateTime.Now
        };

        _db.YeuCauChuyenNhoms.Add(yc);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Đã gửi yêu cầu chuyển nhóm", maYeuCau = yc.MaYeuCau });
    }

    // =============================================
    // GIẢNG VIÊN / NHÓM TRƯỞNG LẤY DANH SÁCH YÊU CẦU CỦA LỚP/NHÓM
    // GET: api/yeucau/vao-nhom?maLop=1
    // =============================================
    [HttpGet("vao-nhom")]
    public async Task<IActionResult> DanhSachYeuCauVaoNhom(int maLop)
    {
        var ds = await _db.YeuCauVaoNhoms
            .Include(y => y.MaSinhVienNavigation)
            .Include(y => y.MaNhomNavigation)
            .Where(y => y.MaNhomNavigation.MaLop == maLop && y.TrangThai == "Chờ duyệt")
            .Select(y => new {
                maYeuCau = y.MaYeuCau,
                sinhVien = y.MaSinhVienNavigation.HoTen,
                tenNhom = y.MaNhomNavigation.TenNhom,
                loiNhan = y.LoiNhan,
                ngayGui = y.NgayGui
            }).ToListAsync();

        return Ok(ds);
    }
    
    [HttpGet("chuyen-nhom")]
    public async Task<IActionResult> DanhSachYeuCauChuyenNhom(int maLop)
    {
        var ds = await _db.YeuCauChuyenNhoms
            .Include(y => y.MaSinhVienNavigation)
            .Include(y => y.MaNhomHienTaiNavigation)
            .Include(y => y.MaNhomMuonNavigation)
            .Where(y => y.MaNhomHienTaiNavigation.MaLop == maLop && y.TrangThai == "Chờ duyệt")
            .Select(y => new {
                maYeuCau = y.MaYeuCau,
                sinhVien = y.MaSinhVienNavigation.HoTen,
                nhomHienTai = y.MaNhomHienTaiNavigation.TenNhom,
                nhomMuon = y.MaNhomMuonNavigation.TenNhom,
                lyDo = y.LyDo,
                ngayGui = y.NgayGui
            }).ToListAsync();

        return Ok(ds);
    }

    // =============================================
    // DUYỆT YÊU CẦU VÀO NHÓM
    // PUT: api/yeucau/duyet-vao-nhom/1
    // =============================================
    [HttpPut("duyet-vao-nhom/{maYeuCau}")]
    public async Task<IActionResult> DuyetVaoNhom(int maYeuCau, [FromBody] DuyetYeuCauDto dto)
    {
        YeuCauVaoNhom? yc = await _db.YeuCauVaoNhoms.FindAsync(maYeuCau);
        if (yc == null) return NotFound(new { thongBao = "Không tìm thấy yêu cầu" });

        yc.TrangThai = dto.TrangThai; // "Đã duyệt" hoặc "Từ chối"
        yc.NgayXuLy = DateTime.Now;

        if (dto.TrangThai == "Đã duyệt")
        {
            Nhom nhom = await _db.Nhoms.Include(n => n.MaSinhViens).FirstAsync(n => n.MaNhom == yc.MaNhom);
            NguoiDung sv = await _db.NguoiDungs.FirstAsync(u => u.MaNguoiDung == yc.MaSinhVien);
            
            if (!nhom.MaSinhViens.Any(s => s.MaNguoiDung == sv.MaNguoiDung))
            {
                nhom.MaSinhViens.Add(sv);
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { thongBao = "Đã xử lý yêu cầu" });
    }

    // =============================================
    // DUYỆT YÊU CẦU CHUYỂN NHÓM
    // PUT: api/yeucau/duyet-chuyen-nhom/1
    // =============================================
    [HttpPut("duyet-chuyen-nhom/{maYeuCau}")]
    public async Task<IActionResult> DuyetChuyenNhom(int maYeuCau, [FromBody] DuyetYeuCauDto dto)
    {
        YeuCauChuyenNhom? yc = await _db.YeuCauChuyenNhoms.FindAsync(maYeuCau);
        if (yc == null) return NotFound(new { thongBao = "Không tìm thấy yêu cầu" });

        yc.TrangThai = dto.TrangThai; // "Đã duyệt" hoặc "Từ chối"
        yc.NgayXuLy = DateTime.Now;

        if (dto.TrangThai == "Đã duyệt")
        {
            Nhom nhomCu = await _db.Nhoms.Include(n => n.MaSinhViens).FirstAsync(n => n.MaNhom == yc.MaNhomHienTai);
            Nhom nhomMoi = await _db.Nhoms.Include(n => n.MaSinhViens).FirstAsync(n => n.MaNhom == yc.MaNhomMuon);
            NguoiDung sv = await _db.NguoiDungs.FirstAsync(u => u.MaNguoiDung == yc.MaSinhVien);
            
            var svInCu = nhomCu.MaSinhViens.FirstOrDefault(s => s.MaNguoiDung == sv.MaNguoiDung);
            if (svInCu != null) nhomCu.MaSinhViens.Remove(svInCu);

            if (!nhomMoi.MaSinhViens.Any(s => s.MaNguoiDung == sv.MaNguoiDung))
            {
                nhomMoi.MaSinhViens.Add(sv);
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { thongBao = "Đã xử lý yêu cầu" });
    }
}

// DTOs
public class XinVaoNhomDto { public int MaNhom { get; set; } public string? LoiNhan { get; set; } }
public class XinChuyenNhomDto { public int MaNhomHienTai { get; set; } public int MaNhomMuon { get; set; } public string? LyDo { get; set; } }
public class DuyetYeuCauDto { public string TrangThai { get; set; } = "Đã duyệt"; }