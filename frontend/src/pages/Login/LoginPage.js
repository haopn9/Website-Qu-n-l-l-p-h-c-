import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import loginIllustration from '../../assets/login-illustration.png';
import { FaEye, FaEyeSlash, FaTimes, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';

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
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);

  // State for loading and error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect đếm ngược timer
  React.useEffect(() => {
    let interval = null;
    if (isForgotModalOpen && forgotStep === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isForgotModalOpen, forgotStep, otpTimer]);

  const handleSendOtp = () => {
    // Giả lập API gửi OTP
    alert(`Thông báo: Gửi mã xác nhận đến email [${forgotEmail}] thành công! (Mã test là 123456)`);
    setForgotStep(2);
    setOtpTimer(300); // 5 phút
    setForgotOtp('');
  };

  const handleVerifyOtp = () => {
    // Giả lập kiểm tra OTP
    if (forgotOtp === '123456') {
      setForgotStep(3);
    } else {
      alert('Mã xác nhận không đúng! Vui lòng thử lại.');
    }
  };

  const handleResetPassword = () => {
    alert('Cập nhật mật khẩu mới thành công!');
    setIsForgotModalOpen(false);
    setForgotStep(1);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotEmail('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Nút đăng nhập chỉ khả dụng khi cả username và password đều không bị trống
  const isButtonDisabled = username.trim() === '' || password.trim() === '';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(username, password);
      
      alert('Đăng nhập thành công!');
      
      // Navigate based on role
      const user = authService.getCurrentUser();
      if (user.maVaiTro === 1) {
        navigate('/admin/dashboard');
      } else if (user.maVaiTro === 2) {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Sai tài khoản hoặc mật khẩu');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
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

            {/* THÔNG BÁO LỖI TỪ API */}
            {error && (
              <div className="error-api-text">{error}</div>
            )}

            {/* NÚT ĐĂNG NHẬP */}
            <button
              type="submit"
              className={`login-button ${isButtonDisabled || loading ? 'btn-disabled' : ''}`}
              disabled={isButtonDisabled || loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
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
          MODAL: QUÊN MẬT KHẨU
      ========================================== */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-forgot">
            <div className="modal-header">
              <h3>Khôi phục mật khẩu</h3>
              <button className="close-btn" onClick={() => {
                setIsForgotModalOpen(false);
                setForgotStep(1);
                setOtpTimer(0);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {forgotStep === 1 && (
                <div className="forgot-form">
                  <p className="forgot-desc">Vui lòng nhập email tài khoản của bạn. Hệ thống sẽ gửi mã xác nhận (OTP) qua email này.</p>
                  <input
                    type="email"
                    className="forgot-input"
                    placeholder="Nhập email của bạn..."
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <button className="forgot-btn" onClick={handleSendOtp} disabled={!forgotEmail}>Gửi mã xác nhận</button>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="forgot-form">
                  <p className="forgot-desc">Mã xác nhận đã được gửi đến: <b>{forgotEmail}</b></p>
                  <input
                    type="text"
                    className="forgot-input"
                    placeholder="Nhập mã xác nhận (6 số)..."
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    maxLength="6"
                  />
                  <p className="forgot-timer">
                    {otpTimer > 0
                      ? `Thời gian mã xác nhận còn hiệu lực: ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                      : <span className="timer-expired">Mã xác nhận đã hết hạn. <span className="resend-link" onClick={handleSendOtp}>Gửi lại mã</span></span>
                    }
                  </p>
                  <button className="forgot-btn" onClick={handleVerifyOtp} disabled={!forgotOtp || otpTimer <= 0}>Xác nhận</button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="forgot-form">
                  <p className="forgot-desc">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                  <div className="password-wrapper" style={{ marginBottom: "15px" }}>
                    <input
                      type={showForgotPass ? "text" : "password"}
                      className="forgot-input"
                      style={{ marginBottom: 0 }}
                      placeholder="Mật khẩu mới..."
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                    />
                    <span className="password-toggle" onClick={() => setShowForgotPass(!showForgotPass)}>
                      {showForgotPass ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>

                  <div className="password-wrapper">
                    <input
                      type={showForgotPass ? "text" : "password"}
                      className="forgot-input"
                      style={{ marginBottom: 0 }}
                      placeholder="Nhập lại mật khẩu mới..."
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="password-validation">
                    <div className={forgotNewPassword.length >= 8 ? "valid" : "invalid"}>✔ Độ dài tối thiểu 8 ký tự</div>
                    <div className={/[A-Z]/.test(forgotNewPassword) ? "valid" : "invalid"}>✔ Có chữ hoa (A-Z)</div>
                    <div className={/[a-z]/.test(forgotNewPassword) ? "valid" : "invalid"}>✔ Có chữ thường (a-z)</div>
                    <div className={/[0-9]/.test(forgotNewPassword) ? "valid" : "invalid"}>✔ Có số (0-9)</div>
                    <div className={/[!@#$%^&*(),.?":{}|<>]/.test(forgotNewPassword) ? "valid" : "invalid"}>✔ Có ký tự đặc biệt</div>
                    <div className={(!/\s/.test(forgotNewPassword) && forgotNewPassword.length > 0) ? "valid" : "invalid"}>✔ Không có khoảng trắng</div>
                    <div className={(forgotNewPassword.length > 0 && forgotNewPassword === forgotConfirmPassword) ? "valid" : "invalid"}>✔ Mật khẩu khớp nhau</div>
                    <div className={(forgotNewPassword.length > 0 && !forgotNewPassword.includes(forgotEmail.split('@')[0])) ? "valid" : "invalid"}>✔ Không chứa tên user/mã tài khoản</div>
                    <div className={forgotNewPassword.length > 0 ? "valid" : "invalid"}>✔ Không trùng mật khẩu trước đó</div>
                  </div>

                  <button
                    className="forgot-btn"
                    onClick={handleResetPassword}
                    disabled={
                      forgotNewPassword.length < 8 ||
                      !/[A-Z]/.test(forgotNewPassword) ||
                      !/[a-z]/.test(forgotNewPassword) ||
                      !/[0-9]/.test(forgotNewPassword) ||
                      !/[!@#$%^&*(),.?":{}|<>]/.test(forgotNewPassword) ||
                      /\s/.test(forgotNewPassword) ||
                      forgotNewPassword.includes(forgotEmail.split('@')[0]) ||
                      forgotNewPassword !== forgotConfirmPassword
                    }
                  >
                    Xác nhận đổi mật khẩu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
