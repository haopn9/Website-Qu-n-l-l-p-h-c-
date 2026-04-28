import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import loginIllustration from '../../assets/login-illustration.png';
import { FaEye, FaEyeSlash, FaTimes, FaArrowLeft } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();

  // State ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State lưu trữ dữ liệu nhập vào
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State kiểm tra xem người dùng đã chạm vào ô input chưa (để tránh báo lỗi đỏ ngay khi vừa vào trang)
  const [touched, setTouched] = useState({ username: false, password: false });

  // State quản lý Modal Quên mật khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Nút đăng nhập chỉ khả dụng khi cả username và password đều không bị trống
  const isButtonDisabled = username.trim() === '' || password.trim() === '';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    try {
      const response = await fetch('http://localhost:5186/api/xacthuc/dangnhap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenDangNhap: username,
          matKhau: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đăng nhập thành công!');
        // Lưu token và thông tin người dùng
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify({
          maNguoiDung: data.maNguoiDung,
          hoTen: data.hoTen,
          maVaiTro: data.maVaiTro,
          tenVaiTro: data.tenVaiTro
        }));

        // Chuyển hướng dựa theo mã vai trò
        if (data.maVaiTro === 1) {
          navigate('/admin');
        } else if (data.maVaiTro === 2) {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      } else {
        alert(data.thongBao || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch (error) {
      console.error('Lỗi kết nối server:', error);
      alert('Lỗi kết nối đến server. Vui lòng bật Backend.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-form-wrapper">
          
          {/* NÚT QUAY LẠI */}
          <div className="back-link" onClick={() => navigate('/')}>
            <FaArrowLeft className="back-icon" /> Quay lại trang chủ
          </div>

          <form onSubmit={handleLogin}>
            {/* TÊN ĐĂNG NHẬP */}
            <div className="input-group">
              <label>Tên Đăng Nhập:</label>
              <input 
                type="text" 
                placeholder="Nhập tên đăng nhập" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched({ ...touched, username: true })}
              />
              {/* Báo lỗi màu đỏ nếu đã chạm vào ô mà để trống, hoặc đã nhập pass mà quên username */}
              {(touched.username || password.length > 0) && username.trim() === '' && (
                <span className="error-text">Vui lòng nhập tên đăng nhập</span>
              )}
            </div>

            {/* MẬT KHẨU */}
            <div className="input-group">
              <label>Mật Khẩu:</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Nhập mật khẩu" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                />
                <span className="password-toggle" onClick={togglePasswordVisibility}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {/* Báo lỗi màu đỏ nếu đã chạm vào ô mà để trống, hoặc đã nhập username mà quên pass */}
              {(touched.password || username.length > 0) && password.trim() === '' && (
                <span className="error-text">Vui lòng nhập mật khẩu</span>
              )}
              
              <div className="forgot-password">
                {/* Mở Modal khi click */}
                <span className="forgot-link" onClick={() => setIsForgotModalOpen(true)}>
                  Quên mật khẩu?
                </span>
              </div>
            </div>

            {/* NÚT ĐĂNG NHẬP */}
            <button 
              type="submit" 
              className={`login-button ${isButtonDisabled ? 'btn-disabled' : ''}`}
              disabled={isButtonDisabled}
            >
              Đăng Nhập
            </button>
          </form>
        </div>
      </div>

      <div className="login-right">
        <div className="illustration-wrapper">
           <img src={loginIllustration} alt="Illustration" className="laptop-img" />
        </div>
        <div className="decoration-blob"></div>
      </div>

      {/* ==========================================
          MODAL: QUÊN MẬT KHẨU (RỖNG THEO YÊU CẦU)
      ========================================== */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-forgot">
            <div className="modal-header">
              <h3>Khôi phục mật khẩu</h3>
              <button className="close-btn" onClick={() => setIsForgotModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Phần này sẽ được thiết kế sau...</p>
              {/* Bạn sẽ chèn form quên mật khẩu vào đây sau này */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;