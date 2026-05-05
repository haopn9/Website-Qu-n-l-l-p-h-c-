using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ThongKeController : ControllerBase
{
    private readonly QuanLyLopHocDbContext _db;

    public ThongKeController(QuanLyLopHocDbContext db)
    {
        _db = db;
    }

    [HttpGet("giang-vien")]
    public async Task<IActionResult> ThongKeGiangVien()
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        if (string.IsNullOrEmpty(claimMaNguoiDung)) return Unauthorized();
        int maNguoiDung = int.Parse(claimMaNguoiDung);

        var today = DateTime.Now;
        var todayDateOnly = DateOnly.FromDateTime(today);

        var classes = await _db.LopHocs
            .Include(l => l.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaSinhViens)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaNhomTruongNavigation)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.NhiemVus)
            .Include(l => l.Nhoms)
                .ThenInclude(n => n.MaDeTaiNavigation)
            .Where(l => l.MaGiangVien == maNguoiDung)
            .ToListAsync();

        int lopDangDay = classes.Count(c => c.NgayBatDau <= todayDateOnly && (c.NgayKetThuc == null || c.NgayKetThuc >= todayDateOnly));
        int tongNhom = classes.Sum(c => c.Nhoms.Count);
        int nhomCoTruong = classes.Sum(c => c.Nhoms.Count(n => n.MaNhomTruong != null));
        
        int nhiemVuTreHan = classes.Sum(c => c.Nhoms.Sum(n => n.NhiemVus.Count(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh < today)));
        
        var yeuCauChuyenNhom = await _db.YeuCauChuyenNhoms
            .Include(y => y.MaSinhVienNavigation)
            .Include(y => y.MaNhomHienTaiNavigation)
                .ThenInclude(n => n.MaLopNavigation)
            .Include(y => y.MaNhomMuonNavigation)
                .ThenInclude(n => n.MaLopNavigation)
            .Where(y => y.TrangThai == "Chờ duyệt" && y.MaNhomHienTaiNavigation.MaLopNavigation.MaGiangVien == maNguoiDung)
            .Select(y => new
            {
                sv = y.MaSinhVienNavigation.HoTen,
                maSV = y.MaSinhVienNavigation.MaSo,
                tuNhom = y.MaNhomHienTaiNavigation.TenNhom + " · " + y.MaNhomHienTaiNavigation.MaLopNavigation.TenLop,
                sangNhom = y.MaNhomMuonNavigation.TenNhom + " · " + y.MaNhomMuonNavigation.MaLopNavigation.TenLop,
                lyDo = y.LyDo,
                thoiGian = y.NgayGui != null ? y.NgayGui.Value.ToString("dd/MM/yyyy") : ""
            })
            .ToListAsync();

        var hoatDongGanDay = await _db.LichSuNhiemVus
            .Include(ls => ls.MaNhiemVuNavigation)
                .ThenInclude(nv => nv.MaNhomNavigation)
                    .ThenInclude(n => n.MaLopNavigation)
            .Include(ls => ls.MaNguoiCapNhatNavigation)
            .Where(ls => ls.MaNhiemVuNavigation.MaNhomNavigation.MaLopNavigation.MaGiangVien == maNguoiDung)
            .OrderByDescending(ls => ls.NgayCapNhat)
            .Take(6)
            .Select(ls => new {
                dot = "#c0dd97",
                text = $"{ls.MaNguoiCapNhatNavigation.HoTen} ({ls.MaNhiemVuNavigation.MaNhomNavigation.TenNhom}): {ls.GhiChu}",
                time = ls.NgayCapNhat != null ? ls.NgayCapNhat.Value.ToString("dd/MM HH:mm") : ""
            })
            .ToListAsync();

        var thongKeClasses = classes.Select(c => new
        {
            id = c.MaLop,
            tenLop = c.TenLop,
            maLop = c.MaLopHoc,
            soSV = c.MaSinhViens.Count,
            soNhom = c.Nhoms.Count,
            soNhomDayDu = c.Nhoms.Count(n => n.MaSinhViens.Count >= n.SoThanhVienToiDa),
            soNhomChuaTruong = c.Nhoms.Count(n => n.MaNhomTruong == null),
            tienDo = c.Nhoms.Any() ? (int)c.Nhoms.Average(n => n.NhiemVus.Any() ? n.NhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0) : 0,
            barColor = "#378add",
            groups = c.Nhoms.Select(n => new {
                ten = n.TenNhom,
                soDuong = n.MaSinhViens.Count,
                toiDa = n.SoThanhVienToiDa,
                truongNhom = n.MaNhomTruongNavigation?.HoTen,
                tienDo = n.NhiemVus.Any() ? (int)n.NhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0,
                deTai = n.MaDeTaiNavigation?.TenDeTai ?? "(Chưa đăng ký đề tài)"
            }).ToList()
        }).ToList();

        return Ok(new
        {
            stats = new[]
            {
                new { label = "Lớp đang dạy", value = lopDangDay, sub = "học kỳ này", color = "#e6f1fb", icon = "📚" },
                new { label = "Tổng nhóm quản lý", value = tongNhom, sub = $"{nhomCoTruong} nhóm đã có trưởng", color = "#eaf3de", icon = "👥" },
                new { label = "Nhiệm vụ trễ hạn", value = nhiemVuTreHan, sub = "cần xử lý của các nhóm", color = "#fcebeb", icon = "⚠️" },
                new { label = "Yêu cầu chuyển nhóm", value = yeuCauChuyenNhom.Count, sub = "đang chờ duyệt", color = "#faeeda", icon = "🔄" }
            },
            classes = thongKeClasses,
            transferRequests = yeuCauChuyenNhom,
            activity = hoatDongGanDay
        });
    }

    [HttpGet("sinh-vien")]
    public async Task<IActionResult> ThongKeSinhVien()
    {
        var claimMaNguoiDung = User.FindFirstValue("maNguoiDung");
        if (string.IsNullOrEmpty(claimMaNguoiDung)) return Unauthorized();
        int maNguoiDung = int.Parse(claimMaNguoiDung);

        var today = DateTime.Now;
        var todayDateOnly = DateOnly.FromDateTime(today);

        var sv = await _db.NguoiDungs.FindAsync(maNguoiDung);

        var cacLop = await _db.LopHocs
            .Where(l => l.MaSinhViens.Any(s => s.MaNguoiDung == maNguoiDung))
            .ToListAsync();
        int lopDangHoc = cacLop.Count(c => c.NgayBatDau <= todayDateOnly && (c.NgayKetThuc == null || c.NgayKetThuc >= todayDateOnly));

        var cacNhom = await _db.Nhoms
            .Include(n => n.MaSinhViens)
            .Include(n => n.MaLopNavigation)
            .Include(n => n.MaDeTaiNavigation)
            .Include(n => n.MaNhomTruongNavigation)
            .Include(n => n.NhiemVus)
                .ThenInclude(nv => nv.MaNguoiDungs)
            .Where(n => n.MaSinhViens.Any(s => s.MaNguoiDung == maNguoiDung))
            .ToListAsync();
            
        int nhomThamGia = cacNhom.Count;

        var nhiemVuCuaToi = cacNhom.SelectMany(n => n.NhiemVus.Where(nv => nv.MaNguoiDungs.Any(u => u.MaNguoiDung == maNguoiDung))).ToList();
        int dangLam = nhiemVuCuaToi.Count(nv => nv.TrangThai != "Hoàn thành");
        int treHan = nhiemVuCuaToi.Count(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh < today);

        var myTasksFormatted = nhiemVuCuaToi.Select(nv => new
        {
            name = nv.TenNhiemVu,
            group = cacNhom.First(n => n.MaNhom == nv.MaNhom).TenNhom + " · " + cacNhom.First(n => n.MaNhom == nv.MaNhom).MaLopNavigation.TenLop,
            pct = nv.PhanTramHoanThanh ?? 0,
            status = nv.TrangThai == "Hoàn thành" ? "done" : (nv.HanHoanThanh < today ? "late" : "doing"),
            label = nv.TrangThai == "Hoàn thành" ? "Hoàn thành" : (nv.HanHoanThanh < today ? "Trễ hạn" : "Đang làm"),
            barColor = nv.TrangThai == "Hoàn thành" ? "#639922" : (nv.HanHoanThanh < today ? "#e24b4a" : "#378add"),
            badgeStyle = nv.TrangThai == "Hoàn thành" ? new { background = "#eaf3de", color = "#3b6d11" } : 
                        (nv.HanHoanThanh < today ? new { background = "#fcebeb", color = "#a32d2d" } : 
                        new { background = "#e6f1fb", color = "#185fa5" })
        }).ToList();

        var groupProgress = cacNhom.Select(n => new
        {
            id = n.MaNhom,
            name = n.TenNhom + " — " + n.MaLopNavigation.TenLop,
            pct = n.NhiemVus.Any() ? (int)n.NhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0,
            barColor = "#378add",
            members = n.MaSinhViens.Select(m => new {
                initials = m.HoTen.Substring(m.HoTen.LastIndexOf(' ') + 1, 1).ToUpper(),
                name = m.HoTen,
                tasks = $"{n.NhiemVus.Count(nv => nv.MaNguoiDungs.Any(u => u.MaNguoiDung == m.MaNguoiDung) && nv.TrangThai == "Hoàn thành")}/{n.NhiemVus.Count(nv => nv.MaNguoiDungs.Any(u => u.MaNguoiDung == m.MaNguoiDung))} nhiệm vụ hoàn thành",
                pct = n.NhiemVus.Any(nv => nv.MaNguoiDungs.Any(u => u.MaNguoiDung == m.MaNguoiDung)) ? 
                    (int)n.NhiemVus.Where(nv => nv.MaNguoiDungs.Any(u => u.MaNguoiDung == m.MaNguoiDung)).Average(nv => nv.PhanTramHoanThanh ?? 0) : 0,
                bg = m.MaNguoiDung == maNguoiDung ? "#e6f1fb" : "#f1efe8",
                color = m.MaNguoiDung == maNguoiDung ? "#185fa5" : "#5f5e5a",
                isMe = m.MaNguoiDung == maNguoiDung,
                isLeader = n.MaNhomTruong == m.MaNguoiDung
            }).ToList()
        }).ToList();

        var groupInfo = cacNhom.Select(n => new
        {
            id = n.MaNhom,
            className = n.MaLopNavigation.TenLop,
            groupName = n.TenNhom,
            topic = n.MaDeTaiNavigation?.TenDeTai ?? "(Chưa có đề tài)",
            leader = n.MaNhomTruongNavigation?.HoTen ?? "Chưa có",
            members = n.MaSinhViens.Select(m => m.HoTen + (m.MaNguoiDung == maNguoiDung ? " (Tôi)" : "")).ToList(),
            totalSlots = n.SoThanhVienToiDa
        }).ToList();

        var deadlines = cacNhom.SelectMany(n => n.NhiemVus.Where(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh != null))
            .OrderBy(nv => nv.HanHoanThanh)
            .Take(5)
            .Select(nv => new {
                name = nv.TenNhiemVu,
                date = nv.HanHoanThanh?.ToString("dd/MM/yyyy"),
                status = nv.HanHoanThanh < today ? "late" : "doing",
                label = nv.HanHoanThanh < today ? "Trễ rồi" : "Sắp tới",
                badgeStyle = nv.HanHoanThanh < today ? new { background = "#fcebeb", color = "#a32d2d" } : new { background = "#e6f1fb", color = "#185fa5" }
            }).ToList();

        var hoatDongNhom = await _db.LichSuNhiemVus
            .Include(ls => ls.MaNhiemVuNavigation)
                .ThenInclude(nv => nv.MaNhomNavigation)
                    .ThenInclude(n => n.MaLopNavigation)
            .Include(ls => ls.MaNguoiCapNhatNavigation)
            .Where(ls => cacNhom.Select(n => n.MaNhom).Contains(ls.MaNhiemVuNavigation.MaNhom))
            .OrderByDescending(ls => ls.NgayCapNhat)
            .Take(10)
            .ToListAsync();

        var groupActivity = cacNhom.Select(n => new
        {
            id = n.MaNhom,
            name = n.TenNhom + " — " + n.MaLopNavigation.TenLop,
            feeds = hoatDongNhom.Where(ls => ls.MaNhiemVuNavigation.MaNhom == n.MaNhom).Select(ls => new {
                dot = "#c0dd97",
                text = $"{ls.MaNguoiCapNhatNavigation.HoTen}: {ls.GhiChu}",
                time = ls.NgayCapNhat != null ? ls.NgayCapNhat.Value.ToString("dd/MM HH:mm") : ""
            }).ToList()
        }).ToList();

        return Ok(new
        {
            student = new { name = sv?.HoTen, date = today.ToString("dd/MM/yyyy"), semester = "Học kỳ hiện tại" },
            stats = new[]
            {
                new { label = "Lớp đang học", value = lopDangHoc, sub = "học kỳ này", color = "#e6f1fb", icon = "📚" },
                new { label = "Nhóm tham gia", value = nhomThamGia, sub = "nhóm đang hoạt động", color = "#eaf3de", icon = "👥" },
                new { label = "Nhiệm vụ đang làm", value = dangLam, sub = $"{treHan} trễ hạn", color = "#faeeda", icon = "✅" },
                new { label = "Nhiệm vụ trễ hạn", value = treHan, sub = "cần xử lý ngay", color = "#fcebeb", icon = "⚠️" }
            },
            myTasks = myTasksFormatted,
            groupProgress = groupProgress,
            groupInfo = groupInfo,
            deadlines = deadlines,
            groupActivity = groupActivity
        });
    }
}
