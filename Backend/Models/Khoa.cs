using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class Khoa
{
    public int MaKhoa { get; set; }

    public string TenKhoa { get; set; } = null!;

    public string? KyHieuKhoa { get; set; }

    public virtual ICollection<LopSinhVien> LopSinhViens { get; set; } = new List<LopSinhVien>();

    public virtual ICollection<NguoiDung> NguoiDungs { get; set; } = new List<NguoiDung>();
}
