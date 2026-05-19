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

        // Sử dụng Select để lấy dữ liệu thống kê nhanh, tránh load toàn bộ Object
        var classesData = await _db.LopHocs
            .Where(l => l.MaGiangVien == maNguoiDung)
            .Select(l => new {
                id = l.MaLop,
                tenLop = l.TenLop,
                maLop = l.MaLopHoc,
                ngayBatDau = l.NgayBatDau,
                ngayKetThuc = l.NgayKetThuc,
                soSV = l.MaSinhViens.Count,
                soNhom = l.Nhoms.Count,
                soNhomDayDu = l.Nhoms.Count(n => n.MaSinhViens.Count >= n.SoThanhVienToiDa),
                soNhomChuaTruong = l.Nhoms.Count(n => n.MaNhomTruong == null),
                tienDo = l.Nhoms.Any() ? (int)l.Nhoms.Average(n => n.NhiemVus.Any() ? n.NhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0) : 0,
                nhiemVuTreHanCount = l.Nhoms.Sum(n => n.NhiemVus.Count(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh < today)),
                nhomCoTruongCount = l.Nhoms.Count(n => n.MaNhomTruong != null),
                groups = l.Nhoms.Select(n => new {
                    ten = n.TenNhom,
                    soDuong = n.MaSinhViens.Count,
                    toiDa = n.SoThanhVienToiDa,
                    truongNhom = n.MaNhomTruongNavigation != null ? n.MaNhomTruongNavigation.HoTen : "Chưa có",
                    tienDo = n.NhiemVus.Any() ? (int)n.NhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0,
                    deTai = n.MaDeTaiNavigation != null ? n.MaDeTaiNavigation.TenDeTai : "(Chưa đăng ký đề tài)"
                }).ToList()
            })
            .ToListAsync();

        int lopDangDay = classesData.Count(c => c.ngayBatDau <= todayDateOnly && (c.ngayKetThuc == null || c.ngayKetThuc >= todayDateOnly));
        int tongNhom = classesData.Sum(c => c.soNhom);
        int nhomCoTruong = classesData.Sum(c => c.nhomCoTruongCount);
        int nhiemVuTreHan = classesData.Sum(c => c.nhiemVuTreHanCount);
        
        var yeuCauChuyenNhom = await _db.YeuCauChuyenNhoms
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
            .Where(ls => ls.MaNhiemVuNavigation.MaNhomNavigation.MaLopNavigation.MaGiangVien == maNguoiDung)
            .OrderByDescending(ls => ls.NgayCapNhat)
            .Take(6)
            .Select(ls => new {
                dot = "#c0dd97",
                text = $"{ls.MaNguoiCapNhatNavigation.HoTen} ({ls.MaNhiemVuNavigation.MaNhomNavigation.TenNhom}): {ls.GhiChu}",
                time = ls.NgayCapNhat != null ? ls.NgayCapNhat.Value.ToString("dd/MM HH:mm") : ""
            })
            .ToListAsync();

        return Ok(new
        {
            stats = new[]
            {
                new { label = "Lớp đang dạy", value = lopDangDay, sub = "học kỳ này", color = "#e6f1fb", icon = "📚" },
                new { label = "Tổng nhóm quản lý", value = tongNhom, sub = $"{nhomCoTruong} nhóm đã có trưởng", color = "#eaf3de", icon = "👥" },
                new { label = "Nhiệm vụ trễ hạn", value = nhiemVuTreHan, sub = "cần xử lý của các nhóm", color = "#fcebeb", icon = "⚠️" },
                new { label = "Yêu cầu chuyển nhóm", value = yeuCauChuyenNhom.Count, sub = "đang chờ duyệt", color = "#faeeda", icon = "🔄" }
            },
            classes = classesData,
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
        if (sv == null) return NotFound();

        // 1. Lấy thông tin lớp và trạng thái
        var classes = await _db.LopHocs
            .Where(l => l.MaSinhViens.Any(s => s.MaNguoiDung == maNguoiDung))
            .Select(l => new {
                l.MaLop,
                l.NgayBatDau,
                l.NgayKetThuc
            })
            .ToListAsync();
            
        int lopDangHoc = classes.Count(c => c.NgayBatDau <= todayDateOnly && (c.NgayKetThuc == null || c.NgayKetThuc >= todayDateOnly));

        // 2. Lấy thông tin nhóm và nhiệm vụ
        var groupsData = await _db.Nhoms
            .Where(n => n.MaSinhViens.Any(s => s.MaNguoiDung == maNguoiDung))
            .Select(n => new {
                n.MaNhom,
                n.TenNhom,
                tenLop = n.MaLopNavigation.TenLop,
                deTai = n.MaDeTaiNavigation != null ? n.MaDeTaiNavigation.TenDeTai : "(Chưa có đề tài)",
                leader = n.MaNhomTruongNavigation != null ? n.MaNhomTruongNavigation.HoTen : "Chưa có",
                totalSlots = n.SoThanhVienToiDa,
                members = n.MaSinhViens.Select(m => new { m.MaNguoiDung, m.HoTen }).ToList(),
                nhiemVus = n.NhiemVus.Select(nv => new {
                    nv.TenNhiemVu,
                    nv.TrangThai,
                    nv.HanHoanThanh,
                    nv.PhanTramHoanThanh,
                    isAssignee = nv.MaNguoiDungs.Any(u => u.MaNguoiDung == maNguoiDung)
                }).ToList()
            })
            .ToListAsync();

        int nhomThamGia = groupsData.Count;
        var allMyTasks = groupsData.SelectMany(g => g.nhiemVus.Where(nv => nv.isAssignee)).ToList();
        int dangLam = allMyTasks.Count(nv => nv.TrangThai != "Hoàn thành");
        int treHan = allMyTasks.Count(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh < today);

        var myTasksFormatted = allMyTasks.Select(nv => new
        {
            name = nv.TenNhiemVu,
            group = groupsData.First(g => g.nhiemVus.Contains(nv)).TenNhom + " · " + groupsData.First(g => g.nhiemVus.Contains(nv)).tenLop,
            pct = nv.PhanTramHoanThanh ?? 0,
            status = nv.TrangThai == "Hoàn thành" ? "done" : (nv.HanHoanThanh < today ? "late" : "doing"),
            label = nv.TrangThai == "Hoàn thành" ? "Hoàn thành" : (nv.HanHoanThanh < today ? "Trễ hạn" : "Đang làm"),
            barColor = nv.TrangThai == "Hoàn thành" ? "#639922" : (nv.HanHoanThanh < today ? "#e24b4a" : "#378add"),
            badgeStyle = nv.TrangThai == "Hoàn thành" ? new { background = "#eaf3de", color = "#3b6d11" } : 
                        (nv.HanHoanThanh < today ? new { background = "#fcebeb", color = "#a32d2d" } : 
                        new { background = "#e6f1fb", color = "#185fa5" })
        }).ToList();

        var groupProgress = groupsData.Select(n => new
        {
            id = n.MaNhom,
            name = n.TenNhom + " — " + n.tenLop,
            pct = n.nhiemVus.Any() ? (int)n.nhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0,
            barColor = "#378add",
            members = n.members.Select(m => new {
                initials = m.HoTen.Substring(m.HoTen.LastIndexOf(' ') + 1, 1).ToUpper(),
                name = m.HoTen,
                tasks = $"{n.nhiemVus.Count(nv => nv.TrangThai == "Hoàn thành" && n.members.Any(mem => mem.MaNguoiDung == m.MaNguoiDung))}/{n.nhiemVus.Count(nv => n.members.Any(mem => mem.MaNguoiDung == m.MaNguoiDung))} nhiệm vụ hoàn thành",
                pct = n.nhiemVus.Any() ? (int)n.nhiemVus.Average(nv => nv.PhanTramHoanThanh ?? 0) : 0, // Simplified for performance
                bg = m.MaNguoiDung == maNguoiDung ? "#e6f1fb" : "#f1efe8",
                color = m.MaNguoiDung == maNguoiDung ? "#185fa5" : "#5f5e5a",
                isMe = m.MaNguoiDung == maNguoiDung
            }).ToList()
        }).ToList();

        var groupInfo = groupsData.Select(n => new
        {
            id = n.MaNhom,
            className = n.tenLop,
            groupName = n.TenNhom,
            topic = n.deTai,
            leader = n.leader,
            members = n.members.Select(m => m.HoTen + (m.MaNguoiDung == maNguoiDung ? " (Tôi)" : "")).ToList(),
            totalSlots = n.totalSlots
        }).ToList();

        var deadlines = groupsData.SelectMany(g => g.nhiemVus.Where(nv => nv.TrangThai != "Hoàn thành" && nv.HanHoanThanh != null))
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
            .Where(ls => groupsData.Select(g => g.MaNhom).Contains(ls.MaNhiemVuNavigation.MaNhom))
            .OrderByDescending(ls => ls.NgayCapNhat)
            .Take(10)
            .Select(ls => new {
                maNhom = ls.MaNhiemVuNavigation.MaNhom,
                dot = "#c0dd97",
                text = $"{ls.MaNguoiCapNhatNavigation.HoTen}: {ls.GhiChu}",
                time = ls.NgayCapNhat != null ? ls.NgayCapNhat.Value.ToString("dd/MM HH:mm") : ""
            })
            .ToListAsync();

        var groupActivity = groupsData.Select(n => new
        {
            id = n.MaNhom,
            name = n.TenNhom + " — " + n.tenLop,
            feeds = hoatDongNhom.Where(ls => ls.maNhom == n.MaNhom).Select(ls => new {
                ls.dot, ls.text, ls.time
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
