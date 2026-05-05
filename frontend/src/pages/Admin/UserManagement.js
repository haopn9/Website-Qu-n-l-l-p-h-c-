// UserManagement.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTimes, FaLock, FaUnlock, FaKey } from 'react-icons/fa';
import './styles/UserManagement.css';
import userService from '../../services/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [lopSinhVienList, setLopSinhVienList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [importState, setImportState] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newUser, setNewUser] = useState({
    maSo: '',
    tenDangNhap: '',
    hoTen: '',
    email: '',
    matKhau: '',
    gioiTinh: 'Nam',
    ngaySinh: '',
    maKhoa: '1',
    maVaiTro: '3',
    lopSinhVien: ''
  });

  const [editUser, setEditUser] = useState(null);

  // Danh sách khoa từ bảng Khoa (Fetch động)
  const [khoaList, setKhoaList] = useState([]);

  // Danh sách vai trò từ bảng VaiTro
  const vaiTroList = [
    { MaVaiTro: 1, TenVaiTro: 'Quản trị' },
    { MaVaiTro: 2, TenVaiTro: 'Giảng viên' },
    { MaVaiTro: 3, TenVaiTro: 'Sinh viên' },
  ];

  const resetNewUser = () => {
    setNewUser({
      maSo: '',
      tenDangNhap: '',
      hoTen: '',
      email: '',
      matKhau: '',
      gioiTinh: 'Nam',
      ngaySinh: '',
      maKhoa: '1',
      maVaiTro: '3',
      lopSinhVien: ''
    });
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const normalizeText = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const passwordExists = (password) =>
    users.some(user => user.matKhau === password || user.matKhauHash === password);

  const normalizeUniqueValue = (value) => (value || '').trim().toLowerCase();

  const hasDuplicateUserField = (fieldName, fieldValue, ignoredUserId = null) =>
    users.some(user =>
      user.maNguoiDung !== ignoredUserId &&
      normalizeUniqueValue(user[fieldName]) === normalizeUniqueValue(fieldValue)
    );

  const passwordContainsUserName = (password, userName) => {
    const normalizedUserName = normalizeText(userName);
    if (!normalizedUserName) return false;
    return normalizeText(password).includes(normalizedUserName);
  };

  const shuffleText = (value) => {
    const chars = value.split('');
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  };

  const generatePasswordCandidate = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const number = '0123456789';
    const special = '!@#$%^&*';
    const allChars = upper + lower + number + special;
    const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
    const targetLength = 12;
    let password = [pick(upper), pick(lower), pick(number), pick(special)];

    while (password.length < targetLength) {
      password.push(pick(allChars));
    }

    return shuffleText(password.join(''));
  };

  const handleGeneratePassword = () => {
    let generatedPassword = '';

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = generatePasswordCandidate();
      const userNames = [newUser.tenDangNhap, newUser.hoTen, newUser.maSo].filter(Boolean);
      const containsUserName = userNames.some(name => passwordContainsUserName(candidate, name));

      if (!passwordExists(candidate) && !containsUserName && !/\s/.test(candidate)) {
        generatedPassword = candidate;
        break;
      }
    }

    if (!generatedPassword) {
      alert('Không thể sinh mật khẩu phù hợp, vui lòng thử lại.');
      return;
    }

    setNewUser({ ...newUser, matKhau: generatedPassword });
  };

  const handleRoleChange = (value, isEdit = false) => {
    const targetUser = isEdit ? editUser : newUser;
    const nextUser = { ...targetUser, maVaiTro: value };

    if (value === '1') {
      nextUser.maKhoa = '';
      nextUser.lopSinhVien = '';
    }

    if (value === '2') {
      nextUser.maKhoa = nextUser.maKhoa || '1';
      nextUser.lopSinhVien = '';
    }

    if (value === '3') {
      nextUser.maKhoa = nextUser.maKhoa || '1';
    }

    if (isEdit) {
      setEditUser(nextUser);
    } else {
      setNewUser(nextUser);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Lỗi lấy danh sách người dùng: ' + (err.message || 'Lỗi server'));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLopSinhViens = async () => {
    try {
      // Danh sách lớp hành chính lấy từ bảng LopSinhVien để không phải hardcode ở frontend.
      const data = await userService.getAllLopSinhViens();
      setLopSinhVienList(data);
    } catch (err) {
      setLopSinhVienList([]);
      console.error('Error fetching LopSinhVien:', err);
    }
  };

  const fetchKhoas = async () => {
    try {
      const res = await fetch('http://localhost:5186/api/khoa');
      if (res.ok) {
        const data = await res.json();
        setKhoaList(data.map(k => ({ MaKhoa: k.maKhoa, TenKhoa: k.tenKhoa })));
      }
    } catch (err) {
      setKhoaList([]);
      console.error('Error fetching Khoa:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLopSinhViens();
    fetchKhoas();
  }, []);

  // Lọc người dùng
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.maSo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.maVaiTro === parseInt(selectedRole);
    return matchesSearch && matchesRole;
  });

  const toggleStatus = async (userId, currentStatus) => {
    const actionText = currentStatus ? 'khóa' : 'mở khóa';
    if (window.confirm(`Bạn có chắc muốn ${actionText} người dùng này?`)) {
      try {
        await userService.toggleUserStatus(userId);
        setUsers(users.map(user =>
          user.maNguoiDung === userId
            ? { ...user, dangHoatDong: !currentStatus }
            : user
        ));
        setError('');
      } catch (err) {
        alert('Lỗi khóa người dùng: ' + (err.message || 'Lỗi server'));
        console.error('Error deleting user:', err);
      }
    }
  };

  // --- Logic Import Excel ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleCheckData = () => {
    if (!importFile) {
      alert('Vui lòng chọn file Excel!');
      return;
    }
    const mockPreviewData = [
      { maSo: 'SV001', hoTen: 'Nguyễn Văn A', email: 'nva@stu.edu.vn' },
      { maSo: 'SV002', hoTen: 'Trần Thị B', email: 'ttb@stu.edu.vn' },
      { maSo: 'SV003', hoTen: 'Lê Văn C', email: 'lvc@stu.edu.vn' },
    ];
    setImportData(mockPreviewData);
    setImportState(2);
  };

  const handleImport = async () => {
    alert('Import thành công (Giả lập Backend gửi mail qua Gmail SMTP cho sinh viên)');
    setShowImportModal(false);
    setImportState(1);
    setImportFile(null);
    setImportData([]);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportState(1);
    setImportFile(null);
    setImportData([]);
  };

  const handleAddUser = async () => {
    const maSo = newUser.maSo.trim();
    const tenDangNhap = newUser.tenDangNhap.trim();
    const hoTen = newUser.hoTen.trim();
    const email = newUser.email.trim();
    const matKhau = newUser.matKhau.trim();

    if (!maSo || !tenDangNhap || !hoTen || !email || !matKhau) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    if (hasDuplicateUserField('maSo', maSo)) {
      alert('Mã số này đã tồn tại trong hệ thống!');
      return;
    }

    if (hasDuplicateUserField('tenDangNhap', tenDangNhap)) {
      alert('Tên đăng nhập này đã được sử dụng!');
      return;
    }

    if (hasDuplicateUserField('email', email)) {
      alert('Email này đã được sử dụng!');
      return;
    }

    if (!isValidEmail(email)) {
      alert('Email không đúng định dạng. Vui lòng kiểm tra lại!');
      return;
    }

    if ((newUser.maVaiTro === '2' || newUser.maVaiTro === '3') && !newUser.maKhoa) {
      alert('Vui lòng chọn khoa cho tài khoản giảng viên hoặc sinh viên!');
      return;
    }

    if (newUser.maVaiTro === '3' && !newUser.lopSinhVien) {
      alert('Vui lòng chọn lớp sinh viên!');
      return;
    }

    if (/\s/.test(matKhau)) {
      alert('Mật khẩu không được chứa khoảng trắng!');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,12}$/.test(matKhau)) {
      alert('Mật khẩu phải dài 8-12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    if ([tenDangNhap, hoTen, maSo].some(name => passwordContainsUserName(matKhau, name))) {
      alert('Mật khẩu không được chứa tên hoặc mã số của người dùng!');
      return;
    }

    if (passwordExists(matKhau)) {
      alert('Mật khẩu không được trùng với mật khẩu của tài khoản khác!');
      return;
    }

    try {
      await userService.createUser({
        maSo,
        tenDangNhap,
        matKhau,
        hoTen,
        email,
        gioiTinh: newUser.gioiTinh === 'Nam' ? true : false,
        ngaySinh: newUser.ngaySinh ? newUser.ngaySinh : null,
        maKhoa: newUser.maKhoa ? parseInt(newUser.maKhoa) : 0,
        maVaiTro: parseInt(newUser.maVaiTro),
        lopSinhVien: newUser.maVaiTro === '3' ? newUser.lopSinhVien : null
      });

      alert('Thêm người dùng thành công!');
      fetchUsers();
      resetNewUser();
      setShowAddModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.thongBao || err.message || 'Không thể thêm người dùng';
      alert('Lỗi: ' + errorMsg);
      console.error('Lỗi gọi API thêm người dùng:', err);
    }
  };

  const handleEditClick = (user) => {
    setEditUser({
      ...user,
      maVaiTro: user.maVaiTro.toString(),
      maKhoa: user.maKhoa ? user.maKhoa.toString() : '1',
      gioiTinh: user.gioiTinh === true ? 'Nam' : user.gioiTinh === false ? 'Nữ' : 'Nam',
      ngaySinh: user.ngaySinh || '',
      lopSinhVien: user.lopSinhVien || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    const maSo = editUser.maSo.trim();
    const tenDangNhap = editUser.tenDangNhap.trim();
    const hoTen = editUser.hoTen.trim();
    const email = editUser.email.trim();

    if (!maSo || !tenDangNhap || !hoTen || !email) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    if (hasDuplicateUserField('maSo', maSo, editUser.maNguoiDung)) {
      alert('Mã số này đã tồn tại trong hệ thống!');
      return;
    }

    if (hasDuplicateUserField('tenDangNhap', tenDangNhap, editUser.maNguoiDung)) {
      alert('Tên đăng nhập này đã được sử dụng!');
      return;
    }

    if (hasDuplicateUserField('email', email, editUser.maNguoiDung)) {
      alert('Email này đã được sử dụng!');
      return;
    }

    if (!isValidEmail(email)) {
      alert('Email không đúng định dạng. Vui lòng kiểm tra lại!');
      return;
    }

    if ((editUser.maVaiTro === '2' || editUser.maVaiTro === '3') && !editUser.maKhoa) {
      alert('Vui lòng chọn khoa cho tài khoản giảng viên hoặc sinh viên!');
      return;
    }

    if (editUser.maVaiTro === '3' && !editUser.lopSinhVien) {
      alert('Vui lòng chọn lớp sinh viên!');
      return;
    }

    try {
      // Gửi đúng body mà PUT /api/nguoidung/{id} đang nhận ở backend.
      await userService.updateUser(editUser.maNguoiDung, {
        maSo,
        tenDangNhap,
        hoTen,
        email,
        gioiTinh: editUser.gioiTinh === 'Nam' ? true : false,
        ngaySinh: editUser.ngaySinh ? editUser.ngaySinh : null,
        maKhoa: editUser.maKhoa ? parseInt(editUser.maKhoa) : 0,
        maVaiTro: parseInt(editUser.maVaiTro),
        lopSinhVien: editUser.maVaiTro === '3' ? editUser.lopSinhVien : null
      });

      alert('Cập nhật người dùng thành công!');
      fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.thongBao || err.message || 'Không thể cập nhật người dùng';
      alert('Lỗi: ' + errorMsg);
      console.error('Lỗi gọi API cập nhật người dùng:', err);
    }
  };

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu từ bảng NguoiDung...</div>;
  }

  return (
    <div className="management-tab">
      <div className="page-header-modern">
        <div className="header-content">
          <h2>Quản lý người dùng</h2>
          <p>Quản lý tài khoản từ người dùng</p>
        </div>
      </div>

      <div className="toolbar-modern">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-add-modern" onClick={() => {
            resetNewUser();
            setShowAddModal(true);
          }}>
            <FaPlus /> Thêm người dùng
          </button>
          <button className="btn-add-modern" style={{ backgroundColor: '#217346' }} onClick={() => setShowImportModal(true)}>
            Import Excel
          </button>
        </div>

        <div className="search-filter-group">
          <div className="search-box-modern">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã số, tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>

          <select
            className="filter-select-modern"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            {vaiTroList.map(role => (
              <option key={role.MaVaiTro} value={role.MaVaiTro}>{role.TenVaiTro}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-modern">
        <div className="table-wrapper">
          <table className="data-table-modern">
            <thead>
              <tr>
                <th>Mã số</th>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.maNguoiDung}>
                  <td><span className="id-badge">{user.maSo}</span></td>
                  <td>{user.tenDangNhap}</td>
                  <td>{user.hoTen}</td>
                  <td>{user.email}</td>
                  <td>{user.gioiTinh === true ? 'Nam' : user.gioiTinh === false ? 'Nữ' : '-'}</td>
                  <td>{user.ngaySinh || '-'}</td>
                  <td>
                    <span className={`role-badge-modern ${user.maVaiTro === 1 ? 'admin' : user.maVaiTro === 2 ? 'teacher' : 'student'}`}>
                      {user.tenVaiTro}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.dangHoatDong ? 'active' : 'inactive'}`}>
                      {user.dangHoatDong ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="action-cells">
                    <button className="action-btn edit" title="Sửa" onClick={() => handleEditClick(user)}>
                      <FaEdit />
                    </button>
                    <button
                      className={`action-btn ${user.dangHoatDong ? 'delete' : 'unlock'}`}
                      style={!user.dangHoatDong ? { background: '#dcfce7', color: '#16a34a' } : {}}
                      title={user.dangHoatDong ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      onClick={() => toggleStatus(user.maNguoiDung, user.dangHoatDong)}
                    >
                      {user.dangHoatDong ? <FaLock /> : <FaUnlock />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Không tìm thấy người dùng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Hiển thị {filteredUsers.length} / {users.length} người dùng</span>
        </div>
      </div>

      {/* Modal thêm người dùng */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm người dùng mới</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Mã số (MSSV/MSGV) <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="VD: DH52200320 hoặc GV001"
                  value={newUser.maSo}
                  onChange={(e) => setNewUser({ ...newUser, maSo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tên đăng nhập <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.tenDangNhap}
                  onChange={(e) => setNewUser({ ...newUser, tenDangNhap: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Họ và tên <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={newUser.hoTen}
                  onChange={(e) => setNewUser({ ...newUser, hoTen: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    value={newUser.gioiTinh}
                    onChange={(e) => setNewUser({ ...newUser, gioiTinh: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={newUser.ngaySinh}
                    onChange={(e) => setNewUser({ ...newUser, ngaySinh: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  placeholder="example@stu.edu.vn"
                  className={newUser.email && !isValidEmail(newUser.email) ? 'input-error' : ''}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                {newUser.email && !isValidEmail(newUser.email) && (
                  <span className="field-error">Email chưa đúng định dạng.</span>
                )}
              </div>
              <div className="form-group">
                <label>Mật khẩu <span className="required">*</span></label>
                <div className="password-row">
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu"
                    value={newUser.matKhau}
                    onChange={(e) => setNewUser({ ...newUser, matKhau: e.target.value })}
                  />
                  <button type="button" className="btn-random-password" onClick={handleGeneratePassword}>
                    <FaKey /> Ngẫu nhiên
                  </button>
                </div>
                <span className="field-hint">8-12 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt.</span>
              </div>

              <div className="form-group">
                <label>Vai trò <span className="required">*</span></label>
                <select
                  value={newUser.maVaiTro}
                  onChange={(e) => handleRoleChange(e.target.value, false)}
                >
                  {vaiTroList.map(role => (
                    <option key={role.MaVaiTro} value={role.MaVaiTro}>{role.TenVaiTro}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Khoa</label>
                <select
                  value={newUser.maKhoa}
                  disabled={newUser.maVaiTro === '1'}
                  onChange={(e) => setNewUser({ ...newUser, maKhoa: e.target.value })}
                >
                  <option value="">Không thuộc khoa</option>
                  {khoaList.map(khoa => (
                    <option key={khoa.MaKhoa} value={khoa.MaKhoa}>{khoa.TenKhoa}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lớp sinh viên</label>
                <select
                  value={newUser.lopSinhVien}
                  disabled={newUser.maVaiTro !== '3'}
                  onChange={(e) => setNewUser({ ...newUser, lopSinhVien: e.target.value })}
                >
                  <option value="">Không thuộc lớp sinh viên</option>
                  {lopSinhVienList.map(lop => (
                    <option key={lop.maLopSinhVien} value={lop.maLopSinhVien}>{lop.tenLopSinhVien}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="btn-save" onClick={handleAddUser}>Thêm mới</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa người dùng */}
      {showEditModal && editUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cập nhật thông tin: {editUser.maSo}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Mã số <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="VD: DH52200320 hoặc GV001"
                  value={editUser.maSo}
                  onChange={(e) => setEditUser({ ...editUser, maSo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tên đăng nhập <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Username"
                  value={editUser.tenDangNhap}
                  onChange={(e) => setEditUser({ ...editUser, tenDangNhap: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Họ và tên <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={editUser.hoTen}
                  onChange={(e) => setEditUser({ ...editUser, hoTen: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    value={editUser.gioiTinh}
                    onChange={(e) => setEditUser({ ...editUser, gioiTinh: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={editUser.ngaySinh}
                    onChange={(e) => setEditUser({ ...editUser, ngaySinh: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  placeholder="example@stu.edu.vn"
                  className={editUser.email && !isValidEmail(editUser.email) ? 'input-error' : ''}
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Vai trò <span className="required">*</span></label>
                <select
                  value={editUser.maVaiTro}
                  onChange={(e) => handleRoleChange(e.target.value, true)}
                >
                  {vaiTroList.map(role => (
                    <option key={role.MaVaiTro} value={role.MaVaiTro}>{role.TenVaiTro}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Khoa</label>
                <select
                  value={editUser.maKhoa}
                  disabled={editUser.maVaiTro === '1'}
                  onChange={(e) => setEditUser({ ...editUser, maKhoa: e.target.value })}
                >
                  <option value="">Không thuộc khoa</option>
                  {khoaList.map(khoa => (
                    <option key={khoa.MaKhoa} value={khoa.MaKhoa}>{khoa.TenKhoa}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lớp sinh viên</label>
                <select
                  value={editUser.lopSinhVien}
                  disabled={editUser.maVaiTro !== '3'}
                  onChange={(e) => setEditUser({ ...editUser, lopSinhVien: e.target.value })}
                >
                  <option value="">Không thuộc lớp sinh viên</option>
                  {lopSinhVienList.map(lop => (
                    <option key={lop.maLopSinhVien} value={lop.maLopSinhVien}>{lop.tenLopSinhVien}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Hủy</button>
              <button className="btn-save" onClick={handleUpdateUser}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import danh sách từ Excel</h3>
              <button className="modal-close" onClick={closeImportModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {importState === 1 ? (
                <>
                  <div className="form-group" style={{ flexDirection: 'row', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Vai trò</label>
                      <select>
                        <option value="2">Giảng viên</option>
                        <option value="3">Sinh viên</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Khoa</label>
                      <select>
                        {khoaList.map(k => <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tải lên file Excel</label>
                    <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
                      <p style={{ margin: '0 0 10px', color: '#64748b' }}>Kéo thả file vào đây hoặc bấm chọn file (chỉ hỗ trợ .xlsx, .xls)</p>
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
                    ✅ Tìm thấy {importData.length + 42} dòng hợp lệ.
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table className="data-table-modern" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>Mã số</th>
                          <th style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>Họ tên</th>
                          <th style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.maSo}</td>
                            <td>{row.hoTen}</td>
                            <td>{row.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>Hiển thị 5 dòng đầu tiên để xác nhận.</p>
                </>
              )}
            </div>
            <div className="modal-footer">
              {importState === 1 ? (
                <>
                  <button className="btn-cancel" style={{ marginRight: 'auto', color: '#2563eb' }}>Tải file mẫu</button>
                  <button className="btn-cancel" onClick={closeImportModal}>Hủy</button>
                  <button className="btn-save" style={{ backgroundColor: '#eab308', color: '#fff' }} onClick={handleCheckData}>Kiểm tra dữ liệu</button>
                </>
              ) : (
                <>
                  <button className="btn-cancel" onClick={() => setImportState(1)}>Quay lại tải file khác</button>
                  <button className="btn-save" style={{ backgroundColor: '#10b981' }} onClick={handleImport}>Tiến hành Import</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

