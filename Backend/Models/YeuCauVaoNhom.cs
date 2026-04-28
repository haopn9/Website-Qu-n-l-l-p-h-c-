using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class YeuCauVaoNhom
{
    public int MaYeuCau { get; set; }

    public int MaSinhVien { get; set; }

    public int MaNhom { get; set; }

    public string? LoiNhan { get; set; }

    public string? TrangThai { get; set; }

    public DateTime? NgayGui { get; set; }

    public DateTime? NgayXuLy { get; set; }

    public virtual Nhom MaNhomNavigation { get; set; } = null!;

    public virtual NguoiDung MaSinhVienNavigation { get; set; } = null!;
}
