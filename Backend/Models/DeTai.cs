using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class DeTai
{
    public int MaDeTai { get; set; }

    public string TenDeTai { get; set; } = null!;

    public string? MoTa { get; set; }

    public string? SanPhamKyVong { get; set; }

    public int MaLop { get; set; }

    public DateTime? NgayBatDau { get; set; }

    public DateTime? NgayKetThuc { get; set; }
    
    public string PhuongThucGiao { get; set; } = null!;

    public DateTime? NgayTao { get; set; }

    public virtual LopHoc MaLopNavigation { get; set; } = null!;

    public virtual ICollection<NhiemVu> NhiemVus { get; set; } = new List<NhiemVu>();

    public virtual ICollection<Nhom> Nhoms { get; set; } = new List<Nhom>();

    public virtual ICollection<TepDinhKem> TepDinhKems { get; set; } = new List<TepDinhKem>();
}
