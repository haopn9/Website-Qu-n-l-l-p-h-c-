import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaTimes, FaComments, FaUser, FaUsers,
  FaTrash, FaEye, FaReply, FaPaperPlane, FaBookOpen,
  FaChevronRight, FaArrowLeft, FaClock, FaReplyAll,
  FaDownload, FaImage, FaComment
} from 'react-icons/fa';
import './styles/MessageManagement.css';

const MessageManagement = () => {
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [clsRes, grpRes, usrRes] = await Promise.all([
        fetch('http://localhost:5186/api/lophoc'),
        fetch('http://localhost:5186/api/nhom'),
        fetch('http://localhost:5186/api/nguoidung')
      ]);

      if (clsRes.ok) {
        const data = await clsRes.json();
        setClasses(data.map((c) => ({
          maLop: c.maLop,
          tenLop: c.tenLop,
          maLopHoc: c.maLopHoc,
          giangVien: c.tenGiangVien,
          hocKy: c.tenHocKy
        })));
      }

      if (grpRes.ok) {
        const data = await grpRes.json();
        setGroups(data.map((g) => ({
          maNhom: g.maNhom,
          tenNhom: g.tenNhom,
          maLop: g.maLop,
          tenLop: g.tenLop,
          soThanhVien: g.soThanhVienHienTai || 0,
          nhomTruong: g.nhomTruong || 'Chưa có',
          soLuongTinNhan: g.soLuongTinNhan || 0
        })));
      }

      if (usrRes.ok) {
        const data = await usrRes.json();
        setUsers(data.map((u) => ({
          maNguoiDung: u.maNguoiDung,
          hoTen: u.hoTen,
          vaiTro: u.tenVaiTro,
          avatar: u.hoTen?.charAt(0)?.toUpperCase() || 'U'
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchMessagesForGroup = async (maNhom) => {
    try {
      const res = await fetch(`http://localhost:5186/api/tinnhan?maNhom=${maNhom}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m) => ({
          id: m.maTinNhan,
          maTinNhan: m.maTinNhan,
          maNhom: m.maNhom,
          tenNhom: m.tenNhom,
          maNguoiGui: m.maNguoiGui,
          nguoiGui: m.nguoiGui,
          vaiTroNguoiGui: m.vaiTroNguoiGui,
          noiDung: m.noiDung,
          thoiGianGui: m.thoiGianGui,
          maTinNhanCha: m.maTinNhanCha,
          soLuongPhanHoi: m.soLuongPhanHoi || 0,
          tepDinhKem: m.tepDinhKem || 0
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchMessagesForGroup(selectedGroup.maNhom);
    } else {
      setMessages([]);
    }
  }, [selectedGroup]);

  const groupsByClass = groups.filter((group) => group.maLop === selectedClass?.maLop);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.nguoiGui.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || new Date(msg.thoiGianGui).toISOString().split('T')[0] === selectedDate;
    return matchesSearch && matchesDate;
  });

  const deleteMessage = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

    try {
      const res = await fetch(`http://localhost:5186/api/tinnhan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(messages.filter((msg) => msg.id !== id));
        alert('Đã xóa tin nhắn thành công!');
      } else {
        alert('Lỗi xóa tin nhắn');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      alert('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    try {
      const res = await fetch('http://localhost:5186/api/tinnhan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maNhom: selectedMessage.maNhom,
          maNguoiGui: currentUser.maNguoiDung || 1,
          noiDung: replyMessage,
          maTinNhanCha: selectedMessage.maTinNhan
        })
      });

      if (res.ok) {
        alert('Đã gửi phản hồi thành công!');
        fetchMessagesForGroup(selectedGroup.maNhom);
        setReplyMessage('');
        setShowReplyModal(false);
      } else {
        alert('Lỗi gửi phản hồi');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateTime) => new Date(dateTime).toLocaleString('vi-VN');

  const getParentMessage = (message) => {
    if (!message.maTinNhanCha) return null;
    return messages.find((m) => m.maTinNhan === message.maTinNhanCha);
  };

  if (loading) {
    return <div className="loading-state">Đang tải dữ liệu...</div>;
  }

  if (!selectedClass) {
    return (
      <div className="message-management">
        <div className="page-header-modern">
          <div className="header-content">
            <h2>Quản lý tin nhắn</h2>
            <p>Chọn lớp học để xem tin nhắn của các nhóm</p>
          </div>
        </div>

        <div className="class-selection-container">
          <h3 className="selection-title">
            <FaBookOpen /> Danh sách lớp học
          </h3>
          <div className="class-cards-grid">
            {classes.map((classItem) => (
              <div key={classItem.maLop} className="class-select-card" onClick={() => setSelectedClass(classItem)}>
                <div className="class-card-icon"><FaBookOpen /></div>
                <div className="class-card-info">
                  <h4>{classItem.tenLop}</h4>
                  <p className="class-code">{classItem.maLopHoc}</p>
                  <p className="class-teacher">Giảng viên: {classItem.giangVien}</p>
                  <p className="class-semester">{classItem.hocKy}</p>
                </div>
                <div className="class-card-arrow"><FaChevronRight /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedClass && !selectedGroup) {
    return (
      <div className="message-management">
        <div className="page-header-modern">
          <div className="header-content">
            <button className="back-button" onClick={() => setSelectedClass(null)}>
              <FaArrowLeft /> Quay lại chọn lớp
            </button>
            <h2>Lớp: {selectedClass.tenLop}</h2>
            <p>Chọn nhóm để xem tin nhắn thảo luận</p>
          </div>
        </div>

        <div className="group-selection-container">
          <h3 className="selection-title">
            <FaUsers /> Danh sách nhóm
          </h3>
          <div className="group-cards-grid">
            {groupsByClass.map((group) => (
              <div key={group.maNhom} className="group-select-card" onClick={() => setSelectedGroup(group)}>
                <div className="group-card-icon"><FaUsers /></div>
                <div className="group-card-info">
                  <h4>{group.tenNhom}</h4>
                  <p className="group-leader">Nhóm trưởng: {group.nhomTruong}</p>
                  <p className="group-members">{group.soThanhVien} thành viên</p>
                  <p className="group-messages-count">
                    <FaComments /> {group.soLuongTinNhan} tin nhắn
                  </p>
                </div>
                <div className="group-card-arrow"><FaChevronRight /></div>
              </div>
            ))}
          </div>
          {groupsByClass.length === 0 && (
            <div className="empty-state">
              <p>Lớp học này chưa có nhóm nào</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="message-management">
      <div className="page-header-modern">
        <div className="header-content">
          <button className="back-button" onClick={() => setSelectedGroup(null)}>
            <FaArrowLeft /> Quay lại chọn nhóm
          </button>
          <h2>Nhóm: {selectedGroup.tenNhom}</h2>
          <p>Lớp: {selectedClass.tenLop} | Nhóm trưởng: {selectedGroup.nhomTruong}</p>
        </div>
      </div>

      <div className="message-stats-group">
        <div className="stat-card-mini">
          <div className="stat-icon-mini blue"><FaComments /></div>
          <div className="stat-info-mini">
            <h4>Tổng tin nhắn</h4>
            <p className="stat-number-mini">{messages.length}</p>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon-mini green"><FaComment /></div>
          <div className="stat-info-mini">
            <h4>Chủ đề</h4>
            <p className="stat-number-mini">{messages.filter((m) => !m.maTinNhanCha).length}</p>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon-mini orange"><FaReplyAll /></div>
          <div className="stat-info-mini">
            <h4>Phản hồi</h4>
            <p className="stat-number-mini">{messages.filter((m) => m.maTinNhanCha).length}</p>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon-mini purple"><FaUser /></div>
          <div className="stat-info-mini">
            <h4>Thành viên</h4>
            <p className="stat-number-mini">{selectedGroup.soThanhVien}</p>
          </div>
        </div>
      </div>

      <div className="message-toolbar">
        <div className="search-filter-group">
          <div className="search-box-modern">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Tìm kiếm tin nhắn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <input type="date" className="filter-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <div className="messages-list-container">
        {filteredMessages.map((message) => {
          const parentMessage = getParentMessage(message);
          return (
            <div key={message.id} className={`message-item ${message.maTinNhanCha ? 'reply-item' : 'thread-item'}`}>
              <div className="message-avatar">
                <div className="avatar-placeholder">
                  {users.find((u) => u.maNguoiDung === message.maNguoiGui)?.avatar || 'U'}
                </div>
              </div>
              <div className="message-content-wrapper">
                <div className="message-header">
                  <div className="message-sender">
                    <strong>{message.nguoiGui}</strong>
                    <span className="message-role">{message.vaiTroNguoiGui || 'Sinh viên'}</span>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">
                      <FaClock size={10} /> {formatDate(message.thoiGianGui)}
                    </span>
                  </div>
                </div>

                {parentMessage && (
                  <div className="message-reply-to">
                    <FaReply className="reply-icon" />
                    <span>Trả lời: <em>{parentMessage.nguoiGui}</em> - {parentMessage.noiDung.substring(0, 80)}...</span>
                  </div>
                )}

                <div className="message-body">
                  <p>{message.noiDung}</p>
                  {message.tepDinhKem > 0 && (
                    <div className="message-attachments">
                      <span className="attachment-badge"><FaImage /> {message.tepDinhKem} tệp đính kèm</span>
                    </div>
                  )}
                </div>

                <div className="message-actions">
                  <button className="msg-action-btn view" onClick={() => {
                    setSelectedMessage(message);
                    setShowDetailModal(true);
                  }}>
                    <FaEye /> Chi tiết
                  </button>
                  <button className="msg-action-btn reply" onClick={() => {
                    setSelectedMessage(message);
                    setShowReplyModal(true);
                  }}>
                    <FaReply /> Phản hồi
                  </button>
                  <button className="msg-action-btn delete" onClick={() => deleteMessage(message.id)}>
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMessages.length === 0 && (
        <div className="empty-state">
          <FaComments className="empty-icon" />
          <p>Chưa có tin nhắn nào trong nhóm này</p>
        </div>
      )}

      {showDetailModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết tin nhắn</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Thông tin tin nhắn</h4>
                <div className="info-grid">
                  <div className="info-item"><label>Người gửi:</label><span>{selectedMessage.nguoiGui}</span></div>
                  <div className="info-item"><label>Nhóm:</label><span>{selectedMessage.tenNhom}</span></div>
                  <div className="info-item"><label>Thời gian:</label><span>{formatDate(selectedMessage.thoiGianGui)}</span></div>
                  {selectedMessage.maTinNhanCha && (
                    <div className="info-item"><label>Trả lời tin:</label><span>#{selectedMessage.maTinNhanCha}</span></div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Nội dung</h4>
                <div className="message-full-content">{selectedMessage.noiDung}</div>
              </div>

              {selectedMessage.tepDinhKem > 0 && (
                <div className="detail-section">
                  <h4>Tệp đính kèm</h4>
                  <div className="attachments-list">
                    <div className="attachment-item"><FaDownload /> Có {selectedMessage.tepDinhKem} tệp đính kèm</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReplyModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phản hồi tin nhắn</h3>
              <button className="modal-close" onClick={() => setShowReplyModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="original-message">
                <strong>{selectedMessage.nguoiGui}:</strong>
                <p>{selectedMessage.noiDung}</p>
              </div>
              <div className="form-group">
                <label>Nội dung phản hồi</label>
                <textarea
                  className="reply-textarea"
                  rows="5"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowReplyModal(false)}>Hủy</button>
              <button className="btn-save" onClick={handleReply}>
                <FaPaperPlane /> Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;
