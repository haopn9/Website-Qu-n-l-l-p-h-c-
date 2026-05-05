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
    // LẤY TIN NHẮN THEO NHÓM
    // GET: api/tinnhan?maNhom=1
    // =============================================
    [HttpGet]
    public async Task<IActionResult> DanhSachTinNhan(int maNhom)
    {
        // Bước 1: Lấy tất cả tin nhắn của nhóm
        List<TinNhan> tatCaTinNhan = await _db.TinNhans
            .Include(t => t.MaNguoiGuiNavigation)
            .Include(t => t.TepDinhKems)
            .ToListAsync();

        // Bước 2: Lọc theo nhóm
        List<TinNhan> tinNhanTheoNhom = new List<TinNhan>();
        foreach (TinNhan tn in tatCaTinNhan)
        {
            if (tn.MaNhom == maNhom)
            {
                tinNhanTheoNhom.Add(tn);
            }
        }

        // Bước 3: Tạo danh sách kết quả
        List<object> ketQua = new List<object>();
        foreach (TinNhan tn in tinNhanTheoNhom)
        {
            string nguoiGui = "";
            if (tn.MaNguoiGuiNavigation != null)
            {
                nguoiGui = tn.MaNguoiGuiNavigation.HoTen;
            }

            ketQua.Add(new
            {
                maTinNhan = tn.MaTinNhan,
                maNhom = tn.MaNhom,
                maNguoiGui = tn.MaNguoiGui,
                nguoiGui = nguoiGui,
                noiDung = tn.NoiDung,
                thoiGianGui = tn.ThoiGianGui,
                maTinNhanCha = tn.MaTinNhanCha,
                soLuongPhanHoi = tinNhanTheoNhom.Count(x => x.MaTinNhanCha == tn.MaTinNhan),
                tepDinhKem = tn.TepDinhKems.Count
            });
        }

        // Bước 4: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // GỬI TIN NHẮN MỚI
    // POST: api/tinnhan
    // =============================================
    [HttpPost]
    public async Task<IActionResult> GuiTinNhan([FromBody] GuiTinNhanDto dto)
    {
        // Bước 1: Tạo tin nhắn mới
        TinNhan tinNhanMoi = new TinNhan();
        tinNhanMoi.MaNhom = dto.MaNhom;
        tinNhanMoi.MaNguoiGui = dto.MaNguoiGui;
        tinNhanMoi.NoiDung = dto.NoiDung;
        tinNhanMoi.MaTinNhanCha = dto.MaTinNhanCha;

        // Bước 2: Thêm vào database
        _db.TinNhans.Add(tinNhanMoi);

        // Bước 3: Lưu lại
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Gửi tin nhắn thành công", maTinNhan = tinNhanMoi.MaTinNhan });
    }

    // =============================================
    // XÓA TIN NHẮN
    // DELETE: api/tinnhan/1
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaTinNhan(int id)
    {
        // Bước 1: Tìm tin nhắn
        TinNhan? tinNhan = await _db.TinNhans.FindAsync(id);

        // Bước 2: Kiểm tra có tồn tại không
        if (tinNhan == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy tin nhắn" });
        }

        // Bước 3: Xóa tin nhắn
        _db.TinNhans.Remove(tinNhan);
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Xóa tin nhắn thành công" });
    }
}

// =============================================
// DTOs
// =============================================
public class GuiTinNhanDto
{
    public int MaNhom { get; set; }
    public int MaNguoiGui { get; set; }
    public string NoiDung { get; set; } = "";
    public int? MaTinNhanCha { get; set; }
}