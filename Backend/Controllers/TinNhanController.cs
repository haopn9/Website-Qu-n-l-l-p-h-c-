using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TinNhanController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public TinNhanController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // =============================================
    // LAY TIN NHAN THEO NHOM
    // GET: api/tinnhan?maNhom=1
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachTinNhan(int maNhom)
    {
        var tinNhans = await _db.TinNhans
            .Where(t => t.MaNhom == maNhom)
            .Include(t => t.MaNguoiGuiNavigation)
                .ThenInclude(u => u.MaVaiTroNavigation)
            .Include(t => t.MaNhomNavigation)
            .Include(t => t.TepDinhKems)
            .OrderBy(t => t.ThoiGianGui)
            .ToListAsync();

        var ketQua = tinNhans.Select(tn => new
        {
            maTinNhan = tn.MaTinNhan,
            maNhom = tn.MaNhom,
            tenNhom = tn.MaNhomNavigation.TenNhom,
            maNguoiGui = tn.MaNguoiGui,
            nguoiGui = tn.MaNguoiGuiNavigation.HoTen,
            vaiTroNguoiGui = tn.MaNguoiGuiNavigation.MaVaiTroNavigation.TenVaiTro,
            noiDung = tn.NoiDung,
            thoiGianGui = tn.ThoiGianGui,
            maTinNhanCha = tn.MaTinNhanCha,
            soLuongPhanHoi = tinNhans.Count(x => x.MaTinNhanCha == tn.MaTinNhan),
            tepDinhKem = tn.TepDinhKems.Count
        });

        return Ok(ketQua);
    }

    // =============================================
    // GUI TIN NHAN MOI
    // POST: api/tinnhan
    // =============================================
    [HttpPost]
    public async Task<IActionResult> GuiTinNhan([FromBody] GuiTinNhanDto dto)
    {
        dto.NoiDung = dto.NoiDung.Trim();
        if (string.IsNullOrWhiteSpace(dto.NoiDung))
        {
            return BadRequest(new { thongBao = "Noi dung tin nhan khong duoc de trong" });
        }

        var tinNhanMoi = new TinNhan
        {
            MaNhom = dto.MaNhom,
            MaNguoiGui = dto.MaNguoiGui,
            NoiDung = dto.NoiDung,
            MaTinNhanCha = dto.MaTinNhanCha
        };

        _db.TinNhans.Add(tinNhanMoi);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            thongBao = "Gui tin nhan thanh cong",
            maTinNhan = tinNhanMoi.MaTinNhan
        });
    }

    // =============================================
    // XOA TIN NHAN
    // DELETE: api/tinnhan/1
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaTinNhan(int id)
    {
        var tinNhan = await _db.TinNhans.FindAsync(id);
        if (tinNhan == null)
        {
            return NotFound(new { thongBao = "Khong tim thay tin nhan" });
        }

        _db.TinNhans.Remove(tinNhan);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xoa tin nhan thanh cong" });
    }
}

public class GuiTinNhanDto
{
    public int MaNhom { get; set; }
    public int MaNguoiGui { get; set; }
    public string NoiDung { get; set; } = "";
    public int? MaTinNhanCha { get; set; }
}
