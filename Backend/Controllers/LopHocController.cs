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
    // LẤY DANH SÁCH SINH VIÊN CHƯA CÓ NHÓM TRONG LỚP
    // GET: api/lophoc/1/sinhvien-chua-co-nhom
    // =============================================
    [HttpGet("{maLop}/sinhvien-chua-co-nhom")]
    public async Task<IActionResult> GetSinhVienChuaCoNhom(int maLop)
    {
        // 1. Lấy thông tin lớp học và danh sách sinh viên trong lớp
        var lopHoc = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .FirstOrDefaultAsync(l => l.MaLop == maLop);

        if (lopHoc == null) return NotFound(new { thongBao = "Không tìm thấy lớp học" });

        // 2. Lấy danh sách ID sinh viên đã có nhóm trong lớp này
        var svDaCoNhomIds = await _db.Nhoms
            .Where(n => n.MaLop == maLop)
            .SelectMany(n => n.MaSinhViens)
            .Select(sv => sv.MaNguoiDung)
            .Distinct()
            .ToListAsync();

        // 3. Lọc ra những sinh viên trong lớp mà chưa có tên trong danh sách đã có nhóm
        var svChuaCoNhom = lopHoc.MaSinhViens
            .Where(sv => !svDaCoNhomIds.Contains(sv.MaNguoiDung))
            .Select(sv => new
            {
                maNguoiDung = sv.MaNguoiDung,
                maSo = sv.MaSo,
                hoTen = sv.HoTen,
                email = sv.Email
            })
            .ToList();

        return Ok(svChuaCoNhom);
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
                .Include(l => l.MaHocKyNavigation)
                .Include(l => l.MaSinhViens)
                .Include(l => l.Nhoms)
                .Where(l => l.MaGiangVien == maNguoiDung)
                .ToListAsync();

            foreach (var lop in lopCuaGV)
            {
                ketQua.Add(TaoLopHocResponse(lop));
            }
        }
        else if (maVaiTro == 3) // Sinh viên
        {
            // Tìm các lớp mà sinh viên tham gia thông qua Navigation MaSinhViens (M-N với NguoiDung)
            NguoiDung? sv = await _db.NguoiDungs
                .Include(u => u.MaLops) // Sinh viên nằm trong nhiều lớp
                .ThenInclude(l => l.MaGiangVienNavigation)
                .Include(u => u.MaLops)
                .ThenInclude(l => l.MaHocKyNavigation)
                .Include(u => u.MaLops)
                .ThenInclude(l => l.MaSinhViens)
                .Include(u => u.MaLops)
                .ThenInclude(l => l.Nhoms)
                .FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDung);

            if (sv != null)
            {
                foreach (var lop in sv.MaLops)
                {
                    ketQua.Add(TaoLopHocResponse(lop));
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
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maNguoiDung = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");
        if (maVaiTro != 3)
        {
            return BadRequest(new { thongBao = "Chỉ sinh viên mới được tham gia lớp học bằng mã lớp" });
        }

        string maLopHoc = dto.MaLopHoc.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(maLopHoc))
        {
            return BadRequest(new { thongBao = "Vui lòng nhập mã lớp học" });
        }

        // Tìm lớp học dựa vào mã lớp học (chuỗi, ví dụ: "LTWEB01")
        LopHoc? lopHoc = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .FirstOrDefaultAsync(l => l.MaLopHoc.ToUpper() == maLopHoc);

        if (lopHoc == null)
        {
            return NotFound(new { thongBao = "Mã lớp học không tồn tại" });
        }

        if (lopHoc.NgayKetThuc.HasValue && lopHoc.NgayKetThuc.Value < DateOnly.FromDateTime(DateTime.Now))
        {
            return BadRequest(new { thongBao = "Lớp học đã kết thúc, không thể tham gia" });
        }

        // Tìm sinh viên
        NguoiDung? sinhVien = await _db.NguoiDungs.FindAsync(maNguoiDung);
        if (sinhVien == null) return NotFound(new { thongBao = "Không tìm thấy sinh viên" });
        if (sinhVien.DangHoatDong != true)
        {
            return BadRequest(new { thongBao = "Tài khoản của bạn đang bị khóa" });
        }

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
    public async Task<IActionResult> DanhSachLop([FromQuery] int? maHocKy)
    {
        var homNay = DateOnly.FromDateTime(DateTime.Now);

        // Bước 1: Lấy tất cả lớp học kèm thông tin giảng viên
        var query = _db.LopHocs
            .Include(l => l.MaGiangVienNavigation)
            .Include(l => l.MaHocKyNavigation)
            .Include(l => l.MaSinhViens)
            .Include(l => l.DeTais)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaDeTaiNavigation)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaNhomTruongNavigation)
            .AsQueryable();

        if (maHocKy.HasValue && maHocKy.Value > 0)
        {
            query = query.Where(l => l.MaHocKy == maHocKy.Value);
        }

        List<LopHoc> tatCaLop = await query.ToListAsync();

        // Bước 2: Tạo danh sách kết quả
        List<object> ketQua = new List<object>();
        foreach (LopHoc lop in tatCaLop)
        {
            string tenGiangVien = "";
            if (lop.MaGiangVienNavigation != null)
            {
                tenGiangVien = lop.MaGiangVienNavigation.HoTen;
            }

            ketQua.Add(TaoLopHocResponse(lop, tenGiangVien, homNay));
        }

        // Bước 3: Trả về kết quả
        return Ok(ketQua);
    }

    // =============================================
    // LẤY CHI TIẾT LỚP HỌC
    // GET: api/lophoc/5
    // =============================================
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> ChiTietLop(int id)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maNguoiDung = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");

        LopHoc? lop = await _db.LopHocs
            .Include(l => l.MaGiangVienNavigation)
            .Include(l => l.MaHocKyNavigation)
            .Include(l => l.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaDeTaiNavigation)
            .Include(l => l.DeTais)
                .ThenInclude(dt => dt.Nhoms)
            .FirstOrDefaultAsync(l => l.MaLop == id);

        if (lop == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy lớp học" });
        }

        bool duocXem = maVaiTro == 1 ||
            lop.MaGiangVien == maNguoiDung ||
            lop.MaSinhViens.Any(sv => sv.MaNguoiDung == maNguoiDung);
        if (!duocXem)
        {
            return Forbid();
        }

        return Ok(TaoLopHocResponse(lop));
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
        List<HocKy> tatCaHocKy = await _db.HocKies
            .OrderByDescending(hk => hk.LaHienTai == true)
            .ThenByDescending(hk => hk.NgayBatDau)
            .ToListAsync();

        // Bước 2: Tạo kết quả
        List<object> ketQua = new List<object>();
        foreach (HocKy hk in tatCaHocKy)
        {
            ketQua.Add(new
            {
                maHocKy = hk.MaHocKy,
                tenHocKy = hk.TenHocKy,
                laHienTai = hk.LaHienTai
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
    [Authorize]
    public async Task<IActionResult> TaoLop([FromBody] TaoLopDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maGiangVien = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");
        if (maVaiTro != 2)
        {
            return BadRequest(new { thongBao = "Chỉ giảng viên mới được tạo lớp học" });
        }

        string tenLop = dto.TenLop.Trim();
        if (string.IsNullOrWhiteSpace(tenLop))
        {
            return BadRequest(new { thongBao = "Vui lòng nhập tên môn học" });
        }

        bool hocKyTonTai = await _db.HocKies.AnyAsync(hk => hk.MaHocKy == dto.MaHocKy);
        if (!hocKyTonTai)
        {
            return BadRequest(new { thongBao = "Học kỳ không tồn tại" });
        }

        if (dto.NgayBatDau.HasValue && dto.NgayKetThuc.HasValue && dto.NgayKetThuc.Value < dto.NgayBatDau.Value)
        {
            return BadRequest(new { thongBao = "Ngày kết thúc phải sau ngày bắt đầu" });
        }

        // Bước 1: Tạo object lớp học mới, mã lớp do backend tự sinh để đảm bảo unique.
        LopHoc lopMoi = new LopHoc();
        lopMoi.TenLop = tenLop;
        lopMoi.MaLopHoc = await TaoMaLopHocUnique();
        lopMoi.MaGiangVien = maGiangVien;
        lopMoi.MaHocKy = dto.MaHocKy;
        lopMoi.NgayBatDau = dto.NgayBatDau;
        lopMoi.NgayKetThuc = dto.NgayKetThuc;
        lopMoi.ThoiGianHoc = dto.ThoiGianHoc;

        // Bước 2: Thêm vào database
        _db.LopHocs.Add(lopMoi);

        // Bước 3: Lưu lại
        await _db.SaveChangesAsync();

        // Bước 4: Trả về kết quả
        return Ok(new { thongBao = "Tạo lớp thành công", maLop = lopMoi.MaLop, maLopHoc = lopMoi.MaLopHoc });
    }

    // =============================================
    // CẬP NHẬT LỚP HỌC
    // PUT: api/lophoc/5
    // =============================================
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> CapNhatLop(int id, [FromBody] CapNhatLopDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maNguoiDung = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");

        LopHoc? lop = await _db.LopHocs.FirstOrDefaultAsync(l => l.MaLop == id);
        if (lop == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy lớp học" });
        }

        if (maVaiTro != 2 || lop.MaGiangVien != maNguoiDung)
        {
            return BadRequest(new { thongBao = "Chỉ giảng viên phụ trách mới được cập nhật lớp học" });
        }

        string tenLop = dto.TenLop.Trim();
        if (string.IsNullOrWhiteSpace(tenLop))
        {
            return BadRequest(new { thongBao = "Vui lòng nhập tên môn học" });
        }

        bool hocKyTonTai = await _db.HocKies.AnyAsync(hk => hk.MaHocKy == dto.MaHocKy);
        if (!hocKyTonTai)
        {
            return BadRequest(new { thongBao = "Học kỳ không tồn tại" });
        }

        if (dto.NgayBatDau.HasValue && dto.NgayKetThuc.HasValue && dto.NgayKetThuc.Value < dto.NgayBatDau.Value)
        {
            return BadRequest(new { thongBao = "Ngày kết thúc phải sau ngày bắt đầu" });
        }

        // Chỉ cập nhật thông tin lớp; mã lớp học giữ nguyên vì sinh viên đang dùng code này để tham gia.
        lop.TenLop = tenLop;
        lop.MaHocKy = dto.MaHocKy;
        lop.NgayBatDau = dto.NgayBatDau;
        lop.NgayKetThuc = dto.NgayKetThuc;
        lop.ThoiGianHoc = dto.ThoiGianHoc;

        await _db.SaveChangesAsync();

        return Ok(new { thongBao = "Cập nhật lớp học thành công" });
    }

    // =============================================
    // XÓA LỚP HỌC
    // DELETE: api/lophoc/1
    // =============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaLop(int id)
    {
        // Bước 1: Tìm lớp học
        LopHoc? lop = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .Include(l => l.Nhoms)
            .Include(l => l.DeTais)
            .FirstOrDefaultAsync(l => l.MaLop == id);

        // Bước 2: Kiểm tra có tồn tại không
        if (lop == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy lớp học" });
        }

        // Bước 3: Không xóa cứng lớp đã phát sinh dữ liệu liên quan để tránh mất dữ liệu lớp học.
        if (lop.MaSinhViens.Count > 0 || lop.Nhoms.Count > 0 || lop.DeTais.Count > 0)
        {
            return BadRequest(new { thongBao = "Không thể xóa lớp đã có sinh viên, nhóm hoặc đề tài" });
        }

        // Bước 4: Xóa lớp chưa phát sinh dữ liệu
        _db.LopHocs.Remove(lop);
        await _db.SaveChangesAsync();

        // Bước 5: Trả về kết quả
        return Ok(new { thongBao = "Xóa lớp thành công" });
    }

    // =============================================
    // XÓA SINH VIÊN KHỎI LỚP HỌC
    // DELETE: api/lophoc/5/sinhvien/10
    // =============================================
    [HttpDelete("{maLop}/sinhvien/{maSinhVien}")]
    [Authorize]
    public async Task<IActionResult> XoaSinhVienKhoiLop(int maLop, int maSinhVien)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung))
        {
            return Unauthorized(new { thongBao = "Chưa đăng nhập" });
        }

        int maGiangVien = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");

        LopHoc? lop = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .Include(l => l.Nhoms)
            .ThenInclude(n => n.MaSinhViens)
            .FirstOrDefaultAsync(l => l.MaLop == maLop);
        if (lop == null)
        {
            return NotFound(new { thongBao = "Không tìm thấy lớp học" });
        }

        if (maVaiTro != 2 || lop.MaGiangVien != maGiangVien)
        {
            return BadRequest(new { thongBao = "Chỉ giảng viên phụ trách mới được xóa sinh viên khỏi lớp" });
        }

        NguoiDung? sinhVien = lop.MaSinhViens.FirstOrDefault(sv => sv.MaNguoiDung == maSinhVien);
        if (sinhVien == null)
        {
            return NotFound(new { thongBao = "Sinh viên không có trong lớp học này" });
        }

        // Nếu sinh viên đang thuộc nhóm trong lớp này thì gỡ khỏi nhóm trước để dữ liệu nhóm không bị lệch.
        foreach (Nhom nhom in lop.Nhoms)
        {
            NguoiDung? thanhVien = nhom.MaSinhViens.FirstOrDefault(sv => sv.MaNguoiDung == maSinhVien);
            if (thanhVien != null)
            {
                nhom.MaSinhViens.Remove(thanhVien);
            }

            if (nhom.MaNhomTruong == maSinhVien)
            {
                nhom.MaNhomTruong = null;
            }
        }

        lop.MaSinhViens.Remove(sinhVien);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            thongBao = "Xóa sinh viên khỏi lớp thành công",
            maLop = lop.MaLop,
            tenLop = lop.TenLop,
            maSinhVien = sinhVien.MaNguoiDung
        });
    }

    private async Task<string> TaoMaLopHocUnique()
    {
        const string kyTu = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();

        for (int lanThu = 0; lanThu < 20; lanThu++)
        {
            string maLopHoc = new string(Enumerable.Range(0, 6)
                .Select(_ => kyTu[random.Next(kyTu.Length)])
                .ToArray());

            bool daTonTai = await _db.LopHocs.AnyAsync(l => l.MaLopHoc == maLopHoc);
            if (!daTonTai)
            {
                return maLopHoc;
            }
        }

        return Guid.NewGuid().ToString("N")[..8].ToUpper();
    }

    private object TaoLopHocResponse(LopHoc lop, string? tenGiangVien = null, DateOnly? homNay = null)
    {
        DateOnly ngayHienTai = homNay ?? DateOnly.FromDateTime(DateTime.Now);

        return new
        {
            maLop = lop.MaLop,
            maLopHoc = lop.MaLopHoc,
            tenLop = lop.TenLop,
            maGiangVien = lop.MaGiangVien,
            tenGiangVien = tenGiangVien ?? lop.MaGiangVienNavigation?.HoTen ?? "",
            soSinhVien = lop.MaSinhViens.Count,
            soNhom = lop.Nhoms.Count,
            trangThai = (lop.NgayKetThuc.HasValue && lop.NgayKetThuc.Value < ngayHienTai) ? "inactive" : "active",
            maHocKy = lop.MaHocKy,
            tenHocKy = lop.MaHocKyNavigation?.TenHocKy ?? "",
            ngayBatDau = lop.NgayBatDau,
            ngayKetThuc = lop.NgayKetThuc,
            thoiGianHoc = lop.ThoiGianHoc,
            danhSachSinhVien = lop.MaSinhViens
                .OrderBy(sv => sv.MaSo)
                .Select(sv => new
                {
                    maNguoiDung = sv.MaNguoiDung,
                    maSo = sv.MaSo,
                    hoTen = sv.HoTen,
                    email = sv.Email,
                    lopSinhVien = sv.LopSinhVien,
                    // Tìm nhom sinh viên đang thuộc trong lớp này
                    tenNhom = lop.Nhoms.FirstOrDefault(n => n.MaSinhViens.Any(s => s.MaNguoiDung == sv.MaNguoiDung))?.TenNhom ?? "",
                    laNhomTruong = lop.Nhoms.Any(n => n.MaNhomTruong == sv.MaNguoiDung)
                })
                .ToList(),
            danhSachNhom = lop.Nhoms
                .OrderBy(n => n.TenNhom)
                .Select(n => new
                {
                    maNhom = n.MaNhom,
                    tenNhom = n.TenNhom,
                    soThanhVienHienTai = n.MaSinhViens.Count,
                    soThanhVienToiDa = n.SoThanhVienToiDa,
                    tenDeTai = n.MaDeTaiNavigation?.TenDeTai ?? "",
                    maDeTai = n.MaDeTai,
                    maNhomTruong = n.MaNhomTruong,
                    tenNhomTruong = n.MaNhomTruongNavigation?.HoTen ?? "",
                    thanhViens = n.MaSinhViens.Select(sv => new
                    {
                        maNguoiDung = sv.MaNguoiDung,
                        maSo = sv.MaSo,
                        hoTen = sv.HoTen,
                        laNhomTruong = n.MaNhomTruong == sv.MaNguoiDung
                    }).ToList()
                })
                .ToList(),
            danhSachDeTai = lop.DeTais
                .OrderBy(dt => dt.TenDeTai)
                .Select(dt => new
                {
                    maDeTai = dt.MaDeTai,
                    tenDeTai = dt.TenDeTai,
                    moTa = dt.MoTa,
                    sanPhamKyVong = dt.SanPhamKyVong,
                    ngayBatDau = dt.NgayBatDau?.ToString("yyyy-MM-dd"),
                    ngayKetThuc = dt.NgayKetThuc?.ToString("yyyy-MM-dd"),
                    phuongThucGiao = dt.PhuongThucGiao ?? "Đăng ký tự do",
                    daCoNhom = dt.Nhoms.Any(),
                    tenNhom = dt.Nhoms.FirstOrDefault()?.TenNhom ?? ""
                })
                .ToList()
        };
    }
    // =============================================
    // CHỐT DANH SÁCH NHÓM
    // PUT: api/lophoc/5/chot-nhom
    // =============================================
    [HttpPut("{maLop}/chot-nhom")]
    [Authorize]
    public async Task<IActionResult> ChotNhom(int maLop, [FromBody] ChotNhomDto dto)
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        var claimMaVaiTro = User.FindFirstValue("maVaiTro");
        if (string.IsNullOrEmpty(claimMaNguoiDung)) return Unauthorized();

        int maNguoiDung = int.Parse(claimMaNguoiDung);
        int maVaiTro = int.Parse(claimMaVaiTro ?? "0");

        LopHoc? lop = await _db.LopHocs.FindAsync(maLop);
        if (lop == null) return NotFound(new { thongBao = "Không tìm thấy lớp học" });

        if (maVaiTro != 2 || lop.MaGiangVien != maNguoiDung)
        {
            return BadRequest(new { thongBao = "Chỉ giảng viên phụ trách mới được chốt nhóm cho lớp này" });
        }

        lop.ChoPhepDangKyNhom = !dto.TrangThaiChot; // Nếu chốt (true) thì ChoPhepDangKyNhom = false
        await _db.SaveChangesAsync();

        return Ok(new { thongBao = dto.TrangThaiChot ? "Đã chốt danh sách nhóm" : "Đã mở đăng ký nhóm" });
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
    public int MaHocKy { get; set; }
    public DateOnly? NgayBatDau { get; set; }
    public DateOnly? NgayKetThuc { get; set; }
    public string? ThoiGianHoc { get; set; }
}

public class CapNhatLopDto
{
    public string TenLop { get; set; } = "";
    public int MaHocKy { get; set; }
    public DateOnly? NgayBatDau { get; set; }
    public DateOnly? NgayKetThuc { get; set; }
    public string? ThoiGianHoc { get; set; }
}

public class ChotNhomDto
{
    public bool TrangThaiChot { get; set; }
}
