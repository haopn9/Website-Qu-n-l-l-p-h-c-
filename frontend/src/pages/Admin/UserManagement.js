// UserManagement.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaLock, FaUnlock } from 'react-icons/fa';
import './styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    maSo: '',
    tenDangNhap: '',
    hoTen: '',
    email: '',
    matKhau: '',
    maKhoa: '1',
    maVaiTro: '3'
  });

  // Danh sách khoa từ bảng Khoa
  const khoaList = [
    { MaKhoa: 1, TenKhoa: 'Công nghệ thông tin' },
    { MaKhoa: 2, TenKhoa: 'Kỹ thuật máy tính' },
    { MaKhoa: 3, TenKhoa: 'Hệ thống thông tin' },
  ];

  // Danh sách vai trò từ bảng VaiTro
  const vaiTroList = [
    { MaVaiTro: 1, TenVaiTro: 'Quản trị' },
    { MaVaiTro: 2, TenVaiTro: 'Giảng viên' },
    { MaVaiTro: 3, TenVaiTro: 'Sinh viên' },
  ];

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5186/api/nguoidung');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lọc người dùng
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.tenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.maSo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.maVaiTro === parseInt(selectedRole);
    return matchesSearch && matchesRole;
  });

  const toggleUserStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5186/api/nguoidung/${userId}/trangthai`, {
        method: 'PUT'
      });
      if (response.ok) {
        setUsers(users.map(user => 
          user.maNguoiDung === userId 
            ? { ...user, dangHoatDong: !user.dangHoatDong }
            : user
        ));
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn khóa (xóa) người dùng này?')) {
      try {
        const response = await fetch(`http://localhost:5186/api/nguoidung/${userId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // Xóa mềm -> Đổi trạng thái thành false
          setUsers(users.map(user => 
            user.maNguoiDung === userId 
              ? { ...user, dangHoatDong: false }
              : user
          ));
        } else {
          alert('Có lỗi xảy ra khi khóa người dùng');
        }
      } catch (error) {
        console.error('Lỗi khóa người dùng:', error);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.maSo || !newUser.tenDangNhap || !newUser.hoTen || !newUser.email || !newUser.matKhau) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5186/api/nguoidung', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maSo: newUser.maSo,
          tenDangNhap: newUser.tenDangNhap,
          matKhau: newUser.matKhau,
          hoTen: newUser.hoTen,
          email: newUser.email,
          maKhoa: parseInt(newUser.maKhoa),
          maVaiTro: parseInt(newUser.maVaiTro)
        })
      });

      if (response.ok) {
        alert('Thêm người dùng thành công!');
        fetchUsers(); // Lấy lại danh sách mới
        setNewUser({ maSo: '', tenDangNhap: '', hoTen: '', email: '', matKhau: '', maKhoa: '1', maVaiTro: '3' });
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert('Lỗi: ' + (errorData.thongBao || 'Không thể thêm người dùng'));
      }
    } catch (error) {
      console.error('Lỗi gọi API thêm người dùng:', error);
      alert('Lỗi kết nối máy chủ');
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
        <button className="btn-add-modern" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Thêm người dùng
        </button>
        
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
                    <button className="action-btn edit" title="Sửa">
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn edit" 
                      title={user.dangHoatDong ? 'Khóa' : 'Mở khóa'}
                      onClick={() => toggleUserStatus(user.maNguoiDung)}
                    >
                      {user.dangHoatDong ? <FaLock /> : <FaUnlock />}
                    </button>
                    <button className="action-btn delete" title="Xóa" onClick={() => deleteUser(user.maNguoiDung)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-footer">
          <span>Hiển thị {filteredUsers.length} / {users.length} người dùng (từ bảng NguoiDung)</span>
        </div>
      </div>

      {/* Modal thêm người dùng */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm người dùng mới vào bảng NguoiDung</h3>
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
                  onChange={(e) => setNewUser({...newUser, maSo: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tên đăng nhập <span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder="Username"
                  value={newUser.tenDangNhap}
                  onChange={(e) => setNewUser({...newUser, tenDangNhap: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Họ và tên <span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder="Nhập họ và tên"
                  value={newUser.hoTen}
                  onChange={(e) => setNewUser({...newUser, hoTen: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input 
                  type="email" 
                  placeholder="example@stu.edu.vn"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu <span className="required">*</span></label>
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu"
                  value={newUser.matKhau}
                  onChange={(e) => setNewUser({...newUser, matKhau: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Khoa (tham chiếu bảng Khoa)</label>
                <select 
                  value={newUser.maKhoa}
                  onChange={(e) => setNewUser({...newUser, maKhoa: e.target.value})}
                >
                  {khoaList.map(khoa => (
                    <option key={khoa.MaKhoa} value={khoa.MaKhoa}>{khoa.TenKhoa}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Vai trò (tham chiếu bảng VaiTro) <span className="required">*</span></label>
                <select 
                  value={newUser.maVaiTro}
                  onChange={(e) => setNewUser({...newUser, maVaiTro: e.target.value})}
                >
                  {vaiTroList.map(role => (
                    <option key={role.MaVaiTro} value={role.MaVaiTro}>{role.TenVaiTro}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="btn-save" onClick={handleAddUser}>Thêm vào NguoiDung</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;