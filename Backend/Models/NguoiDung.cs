using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class NguoiDung
{
    public int MaNguoiDung { get; set; }

    public string MaSo { get; set; } = null!;

    public string TenDangNhap { get; set; } = null!;

    public string MatKhauHash { get; set; } = null!;

    public string HoTen { get; set; } = null!;

    public DateOnly? NgaySinh { get; set; }

    public bool? GioiTinh { get; set; }

    public string? SoDienThoai { get; set; }

    public string? Email { get; set; }

    public string? DiaChi { get; set; }

    public string? AnhDaiDien { get; set; }

    public int? MaKhoa { get; set; }

    public int MaVaiTro { get; set; }

    public bool? DangHoatDong { get; set; }

    public DateTime? NgayTao { get; set; }

    public virtual ICollection<DiemSo> DiemSoMaGiangVienNavigations { get; set; } = new List<DiemSo>();

    public virtual ICollection<DiemSo> DiemSoMaSinhVienNavigations { get; set; } = new List<DiemSo>();

    public virtual ICollection<LichSuNhiemVu> LichSuNhiemVus { get; set; } = new List<LichSuNhiemVu>();

    public virtual ICollection<LopHoc> LopHocs { get; set; } = new List<LopHoc>();

    public virtual Khoa? MaKhoaNavigation { get; set; }

    public virtual VaiTro MaVaiTroNavigation { get; set; } = null!;

    public virtual ICollection<Nhom> Nhoms { get; set; } = new List<Nhom>();

    public virtual ICollection<TepDinhKem> TepDinhKems { get; set; } = new List<TepDinhKem>();

    public virtual ICollection<TinNhan> TinNhans { get; set; } = new List<TinNhan>();

    public virtual ICollection<YeuCauChuyenNhom> YeuCauChuyenNhoms { get; set; } = new List<YeuCauChuyenNhom>();

    public virtual ICollection<YeuCauVaoNhom> YeuCauVaoNhoms { get; set; } = new List<YeuCauVaoNhom>();

    public virtual ICollection<LopHoc> MaLops { get; set; } = new List<LopHoc>();

    public virtual ICollection<NhiemVu> MaNhiemVus { get; set; } = new List<NhiemVu>();

    public virtual ICollection<Nhom> MaNhoms { get; set; } = new List<Nhom>();
}
