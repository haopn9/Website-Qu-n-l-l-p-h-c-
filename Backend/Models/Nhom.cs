using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class Nhom
{
    public int MaNhom { get; set; }

    public string TenNhom { get; set; } = null!;

    public int? SoThanhVienToiDa { get; set; }

    public int MaLop { get; set; }

    public int? MaNhomTruong { get; set; }

    public int? MaDeTai { get; set; }

    public DateTime? NgayTao { get; set; }

    public virtual ICollection<DiemSo> DiemSos { get; set; } = new List<DiemSo>();

    public virtual DeTai? MaDeTaiNavigation { get; set; }

    public virtual LopHoc MaLopNavigation { get; set; } = null!;

    public virtual NguoiDung? MaNhomTruongNavigation { get; set; }

    public virtual ICollection<NhiemVu> NhiemVus { get; set; } = new List<NhiemVu>();

    public virtual ICollection<TinNhan> TinNhans { get; set; } = new List<TinNhan>();

    public virtual ICollection<YeuCauChuyenNhom> YeuCauChuyenNhomMaNhomHienTaiNavigations { get; set; } = new List<YeuCauChuyenNhom>();

    public virtual ICollection<YeuCauChuyenNhom> YeuCauChuyenNhomMaNhomMuonNavigations { get; set; } = new List<YeuCauChuyenNhom>();

    public virtual ICollection<YeuCauVaoNhom> YeuCauVaoNhoms { get; set; } = new List<YeuCauVaoNhom>();

    public virtual ICollection<NguoiDung> MaSinhViens { get; set; } = new List<NguoiDung>();
}
