using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class LopSinhVien
{
    public string MaLopSinhVien { get; set; } = null!;

    public string TenLopSinhVien { get; set; } = null!;

    public int? MaKhoa { get; set; }

    public bool? DangHoatDong { get; set; }

    public virtual Khoa? MaKhoaNavigation { get; set; }
}
