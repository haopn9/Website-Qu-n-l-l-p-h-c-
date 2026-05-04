using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class LopHoc
{
    public int MaLop { get; set; }

    public string MaLopHoc { get; set; } = null!;

    public string TenLop { get; set; } = null!;

    public int MaGiangVien { get; set; }

    public int MaHocKy { get; set; }

    public DateOnly? NgayBatDau { get; set; }

    public DateOnly? NgayKetThuc { get; set; }

    public string? ThoiGianHoc { get; set; }

    public bool? ChoPhepDangKyNhom { get; set; }

    public DateTime? HanDangKyNhom { get; set; }

    public virtual ICollection<DeTai> DeTais { get; set; } = new List<DeTai>();

    public virtual ICollection<DiemSo> DiemSos { get; set; } = new List<DiemSo>();

    public virtual NguoiDung MaGiangVienNavigation { get; set; } = null!;

    public virtual HocKy MaHocKyNavigation { get; set; } = null!;

    public virtual ICollection<Nhom> Nhoms { get; set; } = new List<Nhom>();

    public virtual ICollection<NguoiDung> MaSinhViens { get; set; } = new List<NguoiDung>();
}
