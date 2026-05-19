import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { FaEdit, FaLock, FaTimes, FaEye, FaEyeSlash, FaCheck, FaTimes as FaX } from 'react-icons/fa';



// ============================================================
// HELPER: hiển thị giới tính từ BIT
// ============================================================
const gioiTinhDisplay = (bit) => {
  if (bit === null || bit === undefined) return '—';
  return bit ? 'Nam' : 'Nữ';
};

// ============================================================
// HELPER: kiểm tra quy chuẩn mật khẩu (Đã chuyển logic vào component)
// ============================================================

// ============================================================
// SUB-COMPONENT: Rule check item (✅ / ❌)
// ============================================================
function RuleItem({ ok, text }) {
  return (
    <div className={`rule-item ${ok ? 'rule-ok' : 'rule-fail'}`}>
      {ok ? <FaCheck className="rule-icon" /> : <FaX className="rule-icon" />}
      <span>{text}</span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const UserProfile = ({ role }) => {

  // ── DỮ LIỆU NGƯỜI DÙNG ──────────────────────────────────
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const storedStr = localStorage.getItem('userInfo');
    if (storedStr) {
      const storedUser = JSON.parse(storedStr);
      setUserData(storedUser);
    } else {
      setUserData({});
    }
  }, [role]);

  // ── MODAL CẬP NHẬT HỒ SƠ ────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const openEditModal = () => {
    setEditForm({
      soDienThoai: userData.soDienThoai || '',
      email: userData.email || '',
      diaChi: userData.diaChi || '',
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const email = editForm.email || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Email chưa đúng định dạng. Vui lòng kiểm tra lại!');
      return;
    }
    // TODO: axios.put('/api/nguoidung/me', editForm)
    setUserData(prev => ({ ...prev, ...editForm }));
    setIsEditOpen(false);
    alert('Cập nhật hồ sơ thành công!');
  };

  // ── MODAL ĐỔI MẬT KHẨU ──────────────────────────────────
  const [isPassOpen, setIsPassOpen] = useState(false);

  // Giá trị input
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Ẩn/hiện mật khẩu
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Thông báo lỗi riêng từng ô
  const [errOld, setErrOld] = useState('');
  const [errNew, setErrNew] = useState('');
  const [errConfirm, setErrConfirm] = useState('');

  // Quy chuẩn pass mới — tính realtime
  const rules = {
    length: newPass.length >= 8,
    lower: /[a-z]/.test(newPass),
    upper: /[A-Z]/.test(newPass),
    number: /[0-9]/.test(newPass),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPass),
    noSpace: !/\s/.test(newPass) && newPass.length > 0,
    noAccountCode: newPass.length > 0 ? (!userData.maSo || !newPass.includes(userData.maSo)) : false,
    noUsername: newPass.length > 0 ? (!userData.tenDangNhap || !newPass.includes(userData.tenDangNhap)) : false,
    notOldPass: newPass.length > 0 && oldPass !== '' && newPass !== oldPass
  };
  const allRulesOk = Object.values(rules).every(Boolean);

  // Reset khi đóng modal
  const closePassModal = () => {
    setIsPassOpen(false);
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setShowOld(false); setShowNew(false); setShowConfirm(false);
    setErrOld(''); setErrNew(''); setErrConfirm('');
  };

  // Validate realtime ô "Nhập pass mới"
  const handleNewPassChange = (val) => {
    setNewPass(val);
    setErrNew(''); // xoá lỗi cũ khi user đang gõ
  };

  // Validate realtime ô "Nhập lại pass mới"
  const handleConfirmPassChange = (val) => {
    setConfirmPass(val);
    setErrConfirm('');
  };

  // Submit đổi mật khẩu
  const handleSavePassword = (e) => {
    e.preventDefault();
    let hasError = false;

    // 1. Kiểm tra pass mới đủ quy chuẩn chưa
    if (!allRulesOk) {
      setErrNew('Mật khẩu chưa đạt đủ tiêu chuẩn bên dưới.');
      hasError = true;
    }

    // 2. Kiểm tra pass mới trùng pass cũ (demo: so sánh thẳng)
    if (newPass === oldPass && oldPass !== '') {
      setErrNew('Mật khẩu mới không được trùng với mật khẩu cũ.');
      hasError = true;
    }

    // 3. Kiểm tra nhập lại có khớp không
    if (confirmPass !== newPass) {
      setErrConfirm('Mật khẩu nhập lại không khớp với mật khẩu mới.');
      hasError = true;
    }

    if (hasError) return;

    // 4. Gọi API — backend sẽ kiểm tra oldPass có đúng không
    // TODO: axios.put('/api/nguoidung/doi-mat-khau', { oldPass, newPass })
    //   .catch(err => { if (err.status === 400) setErrOld('Mật khẩu cũ không đúng.'); })
    //
    // Demo: giả lập pass cũ đúng là "Demo@123"
    if (oldPass !== 'Demo@123') {
      setErrOld('Mật khẩu cũ không đúng, vui lòng kiểm tra lại.');
      return;
    }

    alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
    closePassModal();
  };

  // ── LABEL THEO ROLE ──────────────────────────────────────
  const roleNameDisplay = {
    admin: 'Quản trị viên',
    teacher: 'Giảng viên',
    student: 'Sinh viên',
  }[role] || 'Người dùng';

  const codeLabelDisplay = {
    admin: 'Mã số admin',
    teacher: 'Mã số giảng viên',
    student: 'Mã số sinh viên',
  }[role] || 'Mã số';

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="profile-view-container">

      <div className="profile-header">
        <h2 className="page-title">Hồ sơ cá nhân</h2>
        <p className="page-subtitle">
          Thông tin chi tiết tài khoản {roleNameDisplay.toLowerCase()} của bạn.
        </p>
      </div>

      {/* CARD THÔNG TIN */}
      <div className="profile-card-vertical">
        <div className="profile-avatar-wrapper">
          <div className="avatar-circle-large">
            <img src={userData.anhDaiDien} alt="Avatar" />
          </div>
          <h3>{userData.hoTen}</h3>
          <span className="role-tag">{roleNameDisplay}</span>
        </div>

        <div className="info-list-vertical">
          <div className="info-item">
            <span className="info-label">{codeLabelDisplay}</span>
            <span className="info-value">{userData.maSo}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Họ và tên</span>
            <span className="info-value">{userData.hoTen}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ngày sinh</span>
            <span className="info-value">{userData.ngaySinh}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Giới tính</span>
            {/* GioiTinh lưu BIT trong DB: true=Nam, false=Nữ */}
            <span className="info-value">{gioiTinhDisplay(userData.gioiTinh)}</span>
          </div>

          {/* Chỉ hiện KHOA cho SV và GV */}
          {(role === 'student' || role === 'teacher') && (
            <div className="info-item">
              <span className="info-label">Khoa</span>
              <span className="info-value">{userData.tenKhoa || '—'}</span>
            </div>
          )}

          {/* Chỉ hiện LỚP HÀNH CHÍNH cho SV */}
          {role === 'student' && (
            <div className="info-item">
              <span className="info-label">Lớp hành chính</span>
              <span className="info-value">{userData.tenLopSinhVien || '—'}</span>
            </div>
          )}

          <div className="info-item">
            <span className="info-label">Số điện thoại</span>
            <span className="info-value">{userData.soDienThoai || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{userData.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Địa chỉ</span>
            <span className="info-value">{userData.diaChi || '—'}</span>
          </div>
        </div>

        <div className="profile-actions-footer">
          <button className="action-link-btn" onClick={openEditModal}>
            <FaEdit className="icon" /> Cập nhật hồ sơ
          </button>
          <div className="action-divider" />
          <button className="action-link-btn" onClick={() => setIsPassOpen(true)}>
            <FaLock className="icon" /> Đổi mật khẩu
          </button>
        </div>
      </div>

      <p className="read-only-note">
        * Các thông tin định danh cốt lõi (Mã số, Họ tên, Ngày sinh, Khoa) chỉ có thể
        thay đổi bởi Nhà trường &amp; Quản trị viên.
      </p>

      {/* ══════════════════════════════════════════════════
          MODAL 1: CẬP NHẬT HỒ SƠ
      ══════════════════════════════════════════════════ */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cập nhật hồ sơ</h3>
              <button className="close-btn" onClick={() => setIsEditOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="modal-form">
              {/* ── Thông tin chỉ đọc ── */}
              <p className="modal-section-title" style={{ color: '#94a3b8' }}>
                Thông tin định danh (Chỉ xem)
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label>{codeLabelDisplay}</label>
                  <input value={userData.maSo || ''} disabled className="input-readonly" />
                </div>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input value={userData.hoTen || ''} disabled className="input-readonly" />
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input value={userData.ngaySinh || ''} disabled className="input-readonly" />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <input value={gioiTinhDisplay(userData.gioiTinh)} disabled className="input-readonly" />
                </div>
                {(role === 'student' || role === 'teacher') && (
                  <div className="form-group">
                    <label>Khoa</label>
                    <input value={userData.tenKhoa || ''} disabled className="input-readonly" />
                  </div>
                )}
                {role === 'student' && (
                  <div className="form-group">
                    <label>Lớp hành chính</label>
                    <input value={userData.tenLopSinhVien || ''} disabled className="input-readonly" />
                  </div>
                )}
              </div>

              <hr className="modal-divider" />

              {/* ── Thông tin có thể chỉnh ── */}
              <p className="modal-section-title">Thông tin liên hệ (Có thể chỉnh sửa)</p>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text" name="soDienThoai"
                  value={editForm.soDienThoai}
                  onChange={handleEditChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email" name="email"
                  value={editForm.email || ''}
                  onChange={handleEditChange}
                  placeholder="Nhập email"
                  className={editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()) ? 'input-error' : ''}
                  required
                />
                {editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()) && (
                  <span className="field-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>Email chưa đúng định dạng.</span>
                )}
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  name="diaChi"
                  value={editForm.diaChi}
                  onChange={handleEditChange}
                  rows="2"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-save">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 2: ĐỔI MẬT KHẨU
      ══════════════════════════════════════════════════ */}
      {isPassOpen && (
        <div className="modal-overlay" onClick={closePassModal}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi mật khẩu</h3>
              <button className="close-btn" onClick={closePassModal}><FaTimes /></button>
            </div>

            <form onSubmit={handleSavePassword} className="modal-form">

              {/* ── Mật khẩu cũ ── */}
              <div className="form-group">
                <label>Mật khẩu cũ</label>
                <div className="password-input-wrapper">
                  <input
                    type={showOld ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={oldPass}
                    onChange={e => { setOldPass(e.target.value); setErrOld(''); }}
                    required
                  />
                  <span className="password-toggle-icon" onClick={() => setShowOld(v => !v)}>
                    {showOld ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {/* Lỗi pass cũ sai — hiện sau khi submit */}
                {errOld && <span className="field-error">{errOld}</span>}
              </div>

              {/* ── Mật khẩu mới ── */}
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => handleNewPassChange(e.target.value)}
                    required
                  />
                  <span className="password-toggle-icon" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errNew && <span className="field-error">{errNew}</span>}

                {/* Checklist quy chuẩn — chỉ hiện khi user bắt đầu gõ */}
                {newPass.length > 0 && (
                  <div className="password-rules">
                    <RuleItem ok={rules.length} text="Độ dài tối thiểu 8 ký tự" />
                    <RuleItem ok={rules.upper} text="Có chữ hoa (A-Z)" />
                    <RuleItem ok={rules.lower} text="Có chữ thường (a-z)" />
                    <RuleItem ok={rules.number} text="Có số (0-9)" />
                    <RuleItem ok={rules.special} text="Có ký tự đặc biệt (!@#...)" />
                    <RuleItem ok={rules.noSpace} text="Không có khoảng trắng" />
                    <RuleItem ok={rules.noAccountCode} text="Không chứa mã tài khoản" />
                    <RuleItem ok={rules.notOldPass} text="Không trùng mật khẩu cũ" />
                    <RuleItem ok={rules.noUsername} text="Không chứa tên user (username)" />
                  </div>
                )}
              </div>

              {/* ── Nhập lại mật khẩu mới ── */}
              <div className="form-group">
                <label>Nhập lại mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={e => handleConfirmPassChange(e.target.value)}
                    required
                  />
                  <span className="password-toggle-icon" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {/* Kiểm tra khớp realtime khi đã nhập đủ */}
                {confirmPass.length > 0 && confirmPass !== newPass && (
                  <span className="field-error">Mật khẩu nhập lại chưa khớp.</span>
                )}
                {confirmPass.length > 0 && confirmPass === newPass && (
                  <span className="field-ok">✓ Mật khẩu khớp.</span>
                )}
                {errConfirm && <span className="field-error">{errConfirm}</span>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closePassModal}>Hủy</button>
                <button
                  type="submit"
                  className={`btn-save ${(!allRulesOk || confirmPass !== newPass || oldPass === '') ? 'btn-disabled' : ''}`}
                  disabled={!allRulesOk || confirmPass !== newPass || oldPass === ''}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;