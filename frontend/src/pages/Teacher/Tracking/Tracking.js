import React, { useState } from 'react';
import './Tracking.css';
import { FaChartLine, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaClock, FaComments, FaStar, FaTasks, FaUsers, FaPaperclip, FaTimes, FaSave } from 'react-icons/fa';

// ===== DỮ LIỆU GIẢ LẬP =====
const mockGroupProgress = [
  {
    groupId: 1, groupName: 'Nhóm 1', className: 'Lập trình Web',
    topicName: 'Website bán hàng trực tuyến', overallProgress: 72,
    tasks: { done: 5, inProgress: 3, overdue: 1, pending: 2 },
    members: [
      { userId: 101, fullName: 'Nguyễn Văn An', progress: 85, tasksCompleted: 3, role: 'leader' },
      { userId: 102, fullName: 'Trần Thị Bình', progress: 70, tasksCompleted: 2, role: 'member' },
      { userId: 103, fullName: 'Lê Hoàng Cường', progress: 60, tasksCompleted: 2, role: 'member' },
      { userId: 104, fullName: 'Phạm Minh Đức', progress: 55, tasksCompleted: 1, role: 'member' },
    ]
  },
  {
    groupId: 2, groupName: 'Nhóm 2', className: 'Lập trình Web',
    topicName: 'Ứng dụng quản lý thư viện', overallProgress: 45,
    tasks: { done: 3, inProgress: 4, overdue: 2, pending: 3 },
    members: [
      { userId: 105, fullName: 'Hoàng Thị Hoa', progress: 60, tasksCompleted: 2, role: 'leader' },
      { userId: 106, fullName: 'Võ Thanh Hùng', progress: 40, tasksCompleted: 1, role: 'member' },
      { userId: 107, fullName: 'Đặng Quốc Bảo', progress: 35, tasksCompleted: 1, role: 'member' },
    ]
  },
  {
    groupId: 3, groupName: 'Nhóm 3', className: 'Lập trình Web',
    topicName: 'Hệ thống quản lý sinh viên', overallProgress: 20,
    tasks: { done: 1, inProgress: 2, overdue: 3, pending: 4 },
    members: [
      { userId: 108, fullName: 'Ngô Hải Yến', progress: 25, tasksCompleted: 1, role: 'member' },
      { userId: 109, fullName: 'Lý Minh Tâm', progress: 15, tasksCompleted: 0, role: 'member' },
    ]
  },
  {
    groupId: 4, groupName: 'Nhóm 1', className: 'Cơ sở dữ liệu',
    topicName: 'Thiết kế CSDL bệnh viện', overallProgress: 88,
    tasks: { done: 7, inProgress: 1, overdue: 0, pending: 1 },
    members: [
      { userId: 201, fullName: 'Đỗ Quang Khải', progress: 95, tasksCompleted: 4, role: 'leader' },
      { userId: 202, fullName: 'Bùi Anh Tuấn', progress: 82, tasksCompleted: 3, role: 'member' },
      { userId: 203, fullName: 'Trịnh Thu Hà', progress: 78, tasksCompleted: 2, role: 'member' },
      { userId: 204, fullName: 'Mai Đức Thịnh', progress: 90, tasksCompleted: 3, role: 'member' },
    ]
  },
];

const mockMessages = {
  1: [
    { messageId: 1, senderId: 101, senderName: 'Nguyễn Văn An', content: 'Mọi người ơi, mình chia công việc tuần này nhé. Bình làm trang sản phẩm, Cường làm giỏ hàng, Đức làm phần thanh toán.', sendTime: '2026-04-15 09:30', attachment: null },
    { messageId: 2, senderId: 102, senderName: 'Trần Thị Bình', content: 'Ok anh, em nhận phần trang sản phẩm. Em sẽ hoàn thành trước thứ 6.', sendTime: '2026-04-15 09:35', attachment: null },
    { messageId: 3, senderId: 103, senderName: 'Lê Hoàng Cường', content: 'Em đã push code phần giỏ hàng lên repo rồi. Mọi người review giúp em nhé!', sendTime: '2026-04-15 14:20', attachment: 'cart_feature.zip' },
    { messageId: 4, senderId: 104, senderName: 'Phạm Minh Đức', content: 'Phần thanh toán em gặp vấn đề với API payment. Anh An xem giúp em được không?', sendTime: '2026-04-16 08:15', attachment: null },
    { messageId: 5, senderId: 101, senderName: 'Nguyễn Văn An', content: 'Đức gửi em link API document, để anh xem lại. Cả nhóm nhớ commit code thường xuyên nhé.', sendTime: '2026-04-16 10:00', attachment: null },
    { messageId: 6, senderId: 102, senderName: 'Trần Thị Bình', content: 'Em gửi file thiết kế trang sản phẩm nha cả nhóm.', sendTime: '2026-04-17 08:45', attachment: 'product_page_design.pdf' },
  ],
  2: [
    { messageId: 7, senderId: 105, senderName: 'Hoàng Thị Hoa', content: 'Nhóm mình cần đẩy nhanh tiến độ hơn. Deadline còn 3 tuần thôi.', sendTime: '2026-04-16 09:00', attachment: null },
    { messageId: 8, senderId: 106, senderName: 'Võ Thanh Hùng', content: 'Em đang gặp khó khăn với phần search. Có ai giúp em không?', sendTime: '2026-04-16 11:30', attachment: null },
  ],
  3: [],
  4: [
    { messageId: 9, senderId: 201, senderName: 'Đỗ Quang Khải', content: 'Nhóm mình đã hoàn thành ERD diagram. Mọi người xem và góp ý nhé!', sendTime: '2026-04-14 15:00', attachment: 'hospital_erd.png' },
    { messageId: 10, senderId: 202, senderName: 'Bùi Anh Tuấn', content: 'ERD trông ổn rồi anh. Em sẽ viết SQL script tạo bảng.', sendTime: '2026-04-14 16:30', attachment: null },
    { messageId: 11, senderId: 203, senderName: 'Trịnh Thu Hà', content: 'Em đã insert dữ liệu mẫu cho 5 bảng chính.', sendTime: '2026-04-15 09:15', attachment: 'sample_data.sql' },
    { messageId: 12, senderId: 204, senderName: 'Mai Đức Thịnh', content: 'Em viết xong report phần mô tả thực thể. File đính kèm ạ.', sendTime: '2026-04-16 14:00', attachment: 'entity_description.docx' },
  ]
};

const Tracking = () => {
  const [activeTab, setActiveTab] = useState('progress');
  const [filterClass, setFilterClass] = useState('all');

  // Discussion state
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);

  // Evaluation state
  const [selectedGroupEval, setSelectedGroupEval] = useState(1);
  const [groupScore, setGroupScore] = useState(8);
  const [memberScores, setMemberScores] = useState({});
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Filter groups
  const filteredGroups = mockGroupProgress.filter(g => {
    if (filterClass === 'all') return true;
    return g.className === filterClass;
  });

  // Stats
  const totalTasks = filteredGroups.reduce((sum, g) => sum + g.tasks.done + g.tasks.inProgress + g.tasks.overdue + g.tasks.pending, 0);
  const completedTasks = filteredGroups.reduce((sum, g) => sum + g.tasks.done, 0);
  const overdueTasks = filteredGroups.reduce((sum, g) => sum + g.tasks.overdue, 0);
  const avgProgress = filteredGroups.length > 0
    ? Math.round(filteredGroups.reduce((sum, g) => sum + g.overallProgress, 0) / filteredGroups.length)
    : 0;

  const getProgressClass = (percent) => {
    if (percent >= 70) return 'high';
    if (percent >= 40) return 'medium';
    return 'low';
  };

  const getInitials = (name) => {
    return name.split(' ').slice(-1)[0]?.charAt(0) || '?';
  };

  const handleSaveScores = () => {
    alert('Đã lưu điểm đánh giá thành công!');
    setIsScoreModalOpen(false);
  };

  const evalGroup = mockGroupProgress.find(g => g.groupId === selectedGroupEval);

  return (
    <div className="tracking-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Giám sát & Đánh giá</h2>
          <p className="page-subtitle">Theo dõi tiến độ, giám sát thảo luận và đánh giá đóng góp của từng nhóm</p>
        </div>
      </div>

      {/* THỐNG KÊ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FaTasks /></div>
          <div className="stat-info">
            <h4>Tổng nhiệm vụ</h4>
            <span className="stat-number">{totalTasks}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaCheckCircle /></div>
          <div className="stat-info">
            <h4>Hoàn thành</h4>
            <span className="stat-number">{completedTasks}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FaExclamationTriangle /></div>
          <div className="stat-info">
            <h4>Trễ hạn</h4>
            <span className="stat-number">{overdueTasks}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaChartLine /></div>
          <div className="stat-info">
            <h4>Tiến độ TB</h4>
            <span className="stat-number">{avgProgress}%</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="toolbar-row">
        <div className="tabs-bar">
          <button className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
            <FaChartLine /> Tiến độ nhóm
          </button>
          <button className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
            <FaComments /> Giám sát thảo luận
          </button>
          <button className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`} onClick={() => setActiveTab('evaluation')}>
            <FaStar /> Đánh giá & Chấm điểm
          </button>
        </div>
        <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="all">Tất cả lớp</option>
          <option value="Lập trình Web">Lập trình Web</option>
          <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
        </select>
      </div>

      {/* ======= TAB 1: TIẾN ĐỘ NHÓM ======= */}
      {activeTab === 'progress' && (
        <div className="progress-grid">
          {filteredGroups.map(group => (
            <div className="progress-card" key={group.groupId}>
              <div className="progress-card-header">
                <h3>{group.groupName} - {group.className}</h3>
                <span className="topic-badge">{group.topicName}</span>
              </div>
              <div className="progress-card-body">
                {/* Thanh tiến độ tổng */}
                <div className="overall-progress">
                  <div className="overall-progress-label">
                    <span>Tiến độ tổng thể</span>
                    <strong>{group.overallProgress}%</strong>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${getProgressClass(group.overallProgress)}`}
                      style={{ width: `${group.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Tóm tắt trạng thái task */}
                <div className="task-status-row">
                  <div className="task-status-item done">
                    <span className="status-count">{group.tasks.done}</span>
                    Hoàn thành
                  </div>
                  <div className="task-status-item in-progress">
                    <span className="status-count">{group.tasks.inProgress}</span>
                    Đang làm
                  </div>
                  <div className="task-status-item overdue">
                    <span className="status-count">{group.tasks.overdue}</span>
                    Trễ hạn
                  </div>
                  <div className="task-status-item pending">
                    <span className="status-count">{group.tasks.pending}</span>
                    Chờ làm
                  </div>
                </div>

                {/* Tiến độ từng thành viên */}
                <div className="member-progress-list">
                  <h4>Tiến độ thành viên</h4>
                  {group.members.map(member => (
                    <div className="member-progress-item" key={member.userId}>
                      <span className="member-name">
                        {member.role === 'leader' ? '👑 ' : ''}{member.fullName}
                      </span>
                      <div className="mini-progress-track">
                        <div
                          className={`mini-progress-fill progress-bar-fill ${getProgressClass(member.progress)}`}
                          style={{ width: `${member.progress}%` }}
                        />
                      </div>
                      <span className="progress-percent">{member.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======= TAB 2: GIÁM SÁT THẢO LUẬN ======= */}
      {activeTab === 'discussion' && (
        <div className="discussion-section">
          {/* Sidebar danh sách nhóm */}
          <div className="group-list-panel">
            <h4>Nhóm học tập</h4>
            {filteredGroups.map(group => (
              <div
                key={group.groupId}
                className={`group-list-item ${selectedGroupChat === group.groupId ? 'active' : ''}`}
                onClick={() => setSelectedGroupChat(group.groupId)}
              >
                <div className="group-avatar">{group.groupName.replace('Nhóm ', '')}</div>
                <div className="group-label">
                  <h5>{group.groupName}</h5>
                  <p>{group.className}</p>
                </div>
                <span className="msg-count">{(mockMessages[group.groupId] || []).length}</span>
              </div>
            ))}
          </div>

          {/* Panel chat */}
          <div className="chat-panel">
            {selectedGroupChat ? (
              <>
                <div className="chat-panel-header">
                  <h4>{filteredGroups.find(g => g.groupId === selectedGroupChat)?.groupName || 'Nhóm'} - Lịch sử thảo luận</h4>
                  <span className="msg-info">{(mockMessages[selectedGroupChat] || []).length} tin nhắn</span>
                </div>
                <div className="chat-messages">
                  {(mockMessages[selectedGroupChat] || []).length === 0 ? (
                    <div className="no-chat-selected">
                      <div className="no-chat-icon">💬</div>
                      <p>Nhóm chưa có tin nhắn trao đổi</p>
                    </div>
                  ) : (
                    (mockMessages[selectedGroupChat] || []).map(msg => (
                      <div className="chat-message" key={msg.messageId}>
                        <div className="chat-msg-avatar">{getInitials(msg.senderName)}</div>
                        <div className="chat-msg-body">
                          <div className="chat-msg-header">
                            <span className="sender-name">{msg.senderName}</span>
                            <span className="send-time">{msg.sendTime}</span>
                          </div>
                          <div className="chat-msg-text">{msg.content}</div>
                          {msg.attachment && (
                            <div className="chat-msg-attachment">
                              <FaPaperclip /> {msg.attachment}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💬</div>
                <p>Chọn một nhóm để xem lịch sử thảo luận</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======= TAB 3: ĐÁNH GIÁ & CHẤM ĐIỂM ======= */}
      {activeTab === 'evaluation' && (
        <div>
          <div className="toolbar-row" style={{ marginBottom: 16 }}>
            <select
              className="filter-select"
              value={selectedGroupEval}
              onChange={(e) => setSelectedGroupEval(parseInt(e.target.value))}
            >
              {filteredGroups.map(g => (
                <option key={g.groupId} value={g.groupId}>{g.groupName} - {g.className}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => setIsScoreModalOpen(true)}>
              <FaStar /> Chấm điểm
            </button>
          </div>

          {evalGroup && (
            <div className="evaluation-section">
              <div className="evaluation-header">
                <h3>{evalGroup.groupName} - {evalGroup.topicName}</h3>
                <span className={`badge-status ${evalGroup.overallProgress >= 70 ? 'active' : evalGroup.overallProgress >= 40 ? 'warning' : 'danger'}`}>
                  Tiến độ: {evalGroup.overallProgress}%
                </span>
              </div>

              <table className="evaluation-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Vai trò</th>
                    <th>Task hoàn thành</th>
                    <th>Tiến độ cá nhân</th>
                    <th>Mức đóng góp</th>
                    <th>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {evalGroup.members.map(member => {
                    const contribution = member.progress;
                    const level = contribution >= 70 ? 'Tích cực' : contribution >= 40 ? 'Trung bình' : 'Thấp';
                    return (
                      <tr key={member.userId}>
                        <td><strong>{member.fullName}</strong></td>
                        <td>{member.role === 'leader' ? '👑 Nhóm trưởng' : 'Thành viên'}</td>
                        <td style={{ textAlign: 'center' }}>{member.tasksCompleted}</td>
                        <td>
                          <div className="contribution-bar">
                            <div className="bar-track">
                              <div className={`bar-fill ${getProgressClass(member.progress)}`} style={{ width: `${member.progress}%` }} />
                            </div>
                            <span className="bar-value">{member.progress}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="contribution-bar">
                            <div className="bar-track">
                              <div className={`bar-fill ${getProgressClass(contribution)}`} style={{ width: `${contribution}%` }} />
                            </div>
                            <span className="bar-value">{contribution}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-status ${contribution >= 70 ? 'active' : contribution >= 40 ? 'warning' : 'danger'}`}>
                            {level}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL CHẤM ĐIỂM */}
      {isScoreModalOpen && evalGroup && (
        <div className="modal-overlay" onClick={() => setIsScoreModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chấm điểm - {evalGroup.groupName}</h3>
              <button className="close-btn" onClick={() => setIsScoreModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="group-score-row" style={{ borderRadius: 10, marginBottom: 20 }}>
                <label>Điểm tổng nhóm (0-10):</label>
                <input
                  type="number" className="score-input"
                  value={groupScore} onChange={(e) => setGroupScore(parseFloat(e.target.value))}
                  min="0" max="10" step="0.5"
                />
              </div>

              <h4 style={{ fontSize: 14, color: '#475569', marginBottom: 14 }}>Điểm thành phần từng thành viên:</h4>
              {evalGroup.members.map(member => (
                <div key={member.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 14, color: '#334155' }}>
                    {member.role === 'leader' ? '👑 ' : ''}{member.fullName}
                  </span>
                  <input
                    type="number" className="score-input"
                    value={memberScores[member.userId] || ''}
                    onChange={(e) => setMemberScores({ ...memberScores, [member.userId]: parseFloat(e.target.value) })}
                    min="0" max="10" step="0.5"
                    placeholder="0-10"
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsScoreModalOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={handleSaveScores}><FaSave style={{ marginRight: 6 }} /> Lưu điểm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracking;
