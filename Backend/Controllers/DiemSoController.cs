using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiemSoController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public DiemSoController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    // GET: api/DiemSo - Lấy tất cả điểm số
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _db.DiemSos.ToListAsync());
    }

    // GET: api/DiemSo/{id} - Lấy chi tiết điểm số
    [HttpGet("chi-tiet/{id}")]
    public async Task<IActionResult> GetChiTiet(int id)
    {
        try
        {
            var diemSo = await _db.DiemSos
                .Include(d => d.MaSinhVienNavigation)
                .Include(d => d.MaNhomNavigation)
                .Include(d => d.MaGiangVienNavigation)
                .Include(d => d.MaLopNavigation)
                .FirstOrDefaultAsync(d => d.MaDiem == id);

            if (diemSo == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm số" });
            }

            var result = new
            {
                maDiem = diemSo.MaDiem,
                maSinhVien = diemSo.MaSinhVien,
                tenSinhVien = diemSo.MaSinhVienNavigation?.HoTen,
                maNhom = diemSo.MaNhom,
                tenNhom = diemSo.MaNhomNavigation?.TenNhom,
                maLop = diemSo.MaLop,
                tenLop = diemSo.MaLopNavigation?.TenLop,
                diemNhom = diemSo.DiemNhom,
                diemCaNhan = diemSo.DiemCaNhan,
                nhanXet = diemSo.NhanXet,
                maGiangVien = diemSo.MaGiangVien,
                tenGiangVien = diemSo.MaGiangVienNavigation?.HoTen,
                ngayCham = diemSo.NgayCham?.ToString("yyyy-MM-dd")
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết điểm số: " + ex.Message });
        }
    }
    // GET: api/DiemSo/{id} - Tìm kiếm điểm số theo mã hoặc tên
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            // Nếu để trống thì return tất cả
            if (string.IsNullOrWhiteSpace(id))
            {
                return Ok(await _db.DiemSos.ToListAsync());
            }

            var searchKeyword = id.ToLower().Trim();

            // Tìm kiếm theo maDiem hoặc tenSinhVien (không phân biệt hoa thường)
            var results = await _db.DiemSos
                .Where(d => d.MaDiem.ToString().Contains(searchKeyword) ||
                (d.MaSinhVienNavigation != null && d.MaSinhVienNavigation.HoTen.ToLower().Contains(searchKeyword)))
                .ToListAsync();

            // Return results (empty array nếu không tìm thấy)
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tìm kiếm: " + ex.Message });
        }
    }

    // POST: api/DiemSo - Thêm điểm số mới
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DiemSoDTOs dto)
    {
        try
        {
            if (dto.MaSinhVien <= 0 || dto.MaNhom <= 0 || dto.MaLop <= 0)
            {
                return BadRequest(new { message = "Mã sinh viên, nhóm, lớp không hợp lệ" });
            }

            // Kiểm tra sinh viên, nhóm, lớp tồn tại
            var sinhVien = await _db.NguoiDungs.FindAsync(dto.MaSinhVien);
            if (sinhVien == null)
            {
                return BadRequest(new { message = "Sinh viên không tồn tại" });
            }

            var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
            if (nhom == null)
            {
                return BadRequest(new { message = "Nhóm không tồn tại" });
            }

            var lopHoc = await _db.LopHocs.FindAsync(dto.MaLop);
            if (lopHoc == null)
            {
                return BadRequest(new { message = "Lớp học không tồn tại" });
            }

            var giangVien = await _db.NguoiDungs.FindAsync(dto.MaGiangVien);
            if (giangVien == null)
            {
                return BadRequest(new { message = "Giảng viên không tồn tại" });
            }

            var diemSo = new DiemSo
            {
                MaSinhVien = dto.MaSinhVien,
                MaNhom = dto.MaNhom,
                MaLop = dto.MaLop,
                DiemNhom = dto.DiemNhom,
                DiemCaNhan = dto.DiemCaNhan,
                NhanXet = dto.NhanXet?.Trim(),
                MaGiangVien = dto.MaGiangVien,
                NgayCham = DateTime.Now
            };

            _db.DiemSos.Add(diemSo);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = diemSo.MaDiem }, new
            {
                message = "Thêm điểm số thành công",
                maDiem = diemSo.MaDiem
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi thêm điểm số: " + ex.Message });
        }
    }

    // PUT: api/DiemSo/{id} - Sửa điểm số
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DiemSoDTOs dto)
    {
        try
        {
            var diemSo = await _db.DiemSos.FindAsync(id);
            if (diemSo == null)
            {
                return NotFound(new { message = "Điểm số không tồn tại" });
            }

            if (dto.MaSinhVien <= 0 || dto.MaNhom <= 0 || dto.MaLop <= 0)
            {
                return BadRequest(new { message = "Mã sinh viên, nhóm, lớp không hợp lệ" });
            }

            var sinhVien = await _db.NguoiDungs.FindAsync(dto.MaSinhVien);
            if (sinhVien == null)
            {
                return BadRequest(new { message = "Sinh viên không tồn tại" });
            }

            var nhom = await _db.Nhoms.FindAsync(dto.MaNhom);
            if (nhom == null)
            {
                return BadRequest(new { message = "Nhóm không tồn tại" });
            }

            var lopHoc = await _db.LopHocs.FindAsync(dto.MaLop);
            if (lopHoc == null)
            {
                return BadRequest(new { message = "Lớp học không tồn tại" });
            }

            var giangVien = await _db.NguoiDungs.FindAsync(dto.MaGiangVien);
            if (giangVien == null)
            {
                return BadRequest(new { message = "Giảng viên không tồn tại" });
            }

            diemSo.MaSinhVien = dto.MaSinhVien;
            diemSo.MaNhom = dto.MaNhom;
            diemSo.MaLop = dto.MaLop;
            diemSo.DiemNhom = dto.DiemNhom ?? diemSo.DiemNhom;
            diemSo.DiemCaNhan = dto.DiemCaNhan ?? diemSo.DiemCaNhan;
            diemSo.NhanXet = dto.NhanXet?.Trim() ?? diemSo.NhanXet;
            diemSo.MaGiangVien = dto.MaGiangVien;
            diemSo.NgayCham = DateTime.Now;

            _db.DiemSos.Update(diemSo);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật điểm số thành công", data = diemSo });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật điểm số: " + ex.Message });
        }
    }

    // DELETE: api/DiemSo/{id} - Xóa điểm số
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var diemSo = await _db.DiemSos.FindAsync(id);
            if (diemSo == null)
            {
                return NotFound(new { message = "Điểm số không tồn tại" });
            }

            _db.DiemSos.Remove(diemSo);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa điểm số thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xóa điểm số: " + ex.Message });
        }
    }

    // GET: api/DiemSo/by-lop/{maLop} - Lấy điểm số theo lớp
    [HttpGet("by-lop/{maLop}")]
    public async Task<IActionResult> GetByLop(int maLop)
    {
        try
        {
            var diemSos = await _db.DiemSos
                .Where(d => d.MaLop == maLop)
                .Include(d => d.MaSinhVienNavigation)
                .Include(d => d.MaNhomNavigation)
                .ToListAsync();

            if (!diemSos.Any())
            {
                return NotFound(new { message = "Không tìm thấy điểm số cho lớp này" });
            }

            var result = diemSos.Select(d => new
            {
                maDiem = d.MaDiem,
                maSinhVien = d.MaSinhVien,
                tenSinhVien = d.MaSinhVienNavigation?.HoTen,
                maNhom = d.MaNhom,
                tenNhom = d.MaNhomNavigation?.TenNhom,
                diemNhom = d.DiemNhom,
                diemCaNhan = d.DiemCaNhan
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy điểm số theo lớp: " + ex.Message });
        }
    }
}
public class DiemSoDTOs
{
    public int MaDiem { get; set; }
    public int MaSinhVien { get; set; }
    public string TenSinhVien { get; set; } = null!;

    public int MaNhom { get; set; }

    public int MaLop { get; set; }

    public decimal? DiemNhom { get; set; }

    public decimal? DiemCaNhan { get; set; }

    public string? NhanXet { get; set; }

    public int MaGiangVien { get; set; }
    public string TenGiangVien { get; set; } = null!;
    public DateTime? NgayCham { get; set; }
}
