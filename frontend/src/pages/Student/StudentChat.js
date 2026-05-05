import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaQrcode, FaUserPlus, FaUsers } from 'react-icons/fa';
import './StudentChat.css';

// ============================================================
// DỮ LIỆU MẪU (thay bằng API / WebSocket sau)
// ============================================================
const CURRENT_USER = { id: 'VA', name: 'Nguyễn Văn A', bg: '#e6f1fb', color: '#185fa5' };

const mockRooms = [
  {
    id: 1,
    initials: 'N1',
    name: 'Nhóm 1 — LT Web',
    fullName: 'Nhóm 1 — Lập trình Web',
    meta: '4 thành viên · Đề tài: Website QL lớp học',
    bg: '#e6f1fb',
    color: '#185fa5',
    lastMsg: 'TB: API login xong rồi nhé!',
    time: '5p',
    unread: 3,
  },
  {
    id: 2,
    initials: 'N3',
    name: 'Nhóm 3 — CSDL',
    fullName: 'Nhóm 3 — Cơ sở dữ liệu',
    meta: '5 thành viên · Đề tài: Hệ thống quản lý thư viện',
    bg: '#e1f5ee',
    color: '#0f6e56',
    lastMsg: 'HT: Ai làm slide chưa?',
    time: '2g',
    unread: 0,
  },
  {
    id: 3,
    initials: 'N5',
    name: 'Nhóm 5 — MMT',
    fullName: 'Nhóm 5 — Mạng máy tính',
    meta: '3 thành viên · Đề tài: Thiết kế mạng LAN doanh nghiệp',
    bg: '#faeeda',
    color: '#854f0b',
    lastMsg: 'MT: Họp online 8h tối nha',
    time: '5g',
    unread: 0,
  },
];

const mockPinnedMessage = "📌 Tin nhắn ghim: Chiều thứ 6 tuần này nhóm mình họp online lúc 20h nhé mọi người!";

const mockMessages = {
  1: [
    {
      id: 1, senderId: 'TB', senderName: 'Trần Thị B (Nhóm trưởng)',
      senderBg: '#faeeda', senderColor: '#854f0b',
      content: 'Mọi người ơi, task thiết kế giao diện Login đang trễ hạn rồi, ai đang làm vậy?',
      time: '17/04  10:32', isMe: false, replyTo: null, file: null,
    },
    {
      id: 2, senderId: 'VA', senderName: 'Nguyễn Văn A',
      senderBg: '#e6f1fb', senderColor: '#185fa5',
      content: 'Mình đang làm, còn khoảng 40% nữa. Chiều nay xong ạ!',
      time: '17/04  10:35', isMe: true,
      replyTo: 'TB: task thiết kế giao diện Login...', file: null,
    },
    {
      id: 3, senderId: 'LC', senderName: 'Lê Văn C',
      senderBg: '#e1f5ee', senderColor: '#0f6e56',
      content: 'Mình hỗ trợ phần CSS được, gửi file Figma cho mình với!',
      time: '17/04  10:38', isMe: false, replyTo: null, file: null,
    },
    {
      id: 4, senderId: 'VA', senderName: 'Nguyễn Văn A',
      senderBg: '#e6f1fb', senderColor: '#185fa5',
      content: null, time: '17/04  10:41', isMe: true, replyTo: null,
      file: { name: 'Login_UI_v2.fig', size: '2.4 MB' },
    },
    {
      id: 5, senderId: 'TB', senderName: 'Trần Thị B (Nhóm trưởng)',
      senderBg: '#faeeda', senderColor: '#854f0b',
      content: 'OK, chiều nay mình sẽ review và duyệt task nhé. Cố lên cả nhóm!',
      time: '17/04  10:45', isMe: false, replyTo: null, file: null,
    },
  ],
  2: [
    {
      id: 1, senderId: 'HT', senderName: 'Hoàng Thị T (Nhóm trưởng)',
      senderBg: '#e1f5ee', senderColor: '#0f6e56',
      content: 'Ai làm slide chưa? Deadline ngày mai rồi!',
      time: '18/04  08:10', isMe: false, replyTo: null, file: null,
    },
  ],
  3: [
    {
      id: 1, senderId: 'MT', senderName: 'Minh Tuấn',
      senderBg: '#fbeaf0', senderColor: '#993556',
      content: 'Họp online 8h tối nha mọi người!',
      time: '18/04  07:55', isMe: false, replyTo: null, file: null,
    },
  ],
};

// ============================================================
// COMPONENT: RoomItem (sidebar)
// ============================================================
function RoomItem({ room, isActive, onClick }) {
  return (
    <div className={`room-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="room-av" style={{ background: room.bg, color: room.color }}>
        {room.initials}
      </div>
      <div className="room-info">
        <div className="room-name">{room.name}</div>
        <div className="room-last">{room.lastMsg}</div>
      </div>
      <div className="room-right">
        <span className="room-time">{room.time}</span>
        {room.unread > 0 && <span className="unread-badge">{room.unread}</span>}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Message bubble
// ============================================================
function renderTextWithLinks(text) {
  if (!text) return null;
  // RegEx to match http/https URLs safely
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageBubble({ msg }) {
  return (
    <div className={`msg-row ${msg.isMe ? 'me' : ''}`}>
      {/* Avatar */}
      <div className="msg-av" style={{ background: msg.senderBg, color: msg.senderColor }}>
        {msg.senderId}
      </div>

      <div className="msg-content">
        {/* Tên người gửi (chỉ hiện khi không phải mình) */}
        {!msg.isMe && <div className="msg-name">{msg.senderName}</div>}

        <div className={`bubble ${msg.isMe ? 'me' : ''}`}>
          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`reply-preview ${msg.isMe ? 'reply-me' : ''}`}>
              {msg.replyTo}
            </div>
          )}

          {/* Nội dung text */}
          {msg.content && <div>{renderTextWithLinks(msg.content)}</div>}

          {/* File đính kèm */}
          {msg.file && (
            <div className={`file-attach ${msg.isMe ? 'file-me' : ''}`}>
              📄 {msg.file.name} &nbsp;·&nbsp; {msg.file.size}
            </div>
          )}
        </div>

        <div className={`msg-time ${msg.isMe ? '' : 'left'}`}>{msg.time}</div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Modal Thành viên Nhóm Chat
// ============================================================
function ChatMembersModal({ room, onClose }) {
  const [tab, setTab] = useState('members');
  const admins = [{ id: 'VA', name: 'Nguyễn Văn A', bg: '#e6f1fb', color: '#185fa5' }];
  const members = [
    { id: 'LC', name: 'Lê Văn C', bg: '#e1f5ee', color: '#0f6e56' },
    { id: 'PD', name: 'Phạm Thị D', bg: '#fbeaf0', color: '#993556' }
  ];

  const list = tab === 'admins' ? admins : members;

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="sc-modal-header">
          <h3>Thành viên nhóm chat</h3>
          <button className="sc-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="sc-invite-tabs" style={{ padding: '0 20px' }}>
          <div className={`sc-invite-tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Thành viên ({members.length + admins.length})</div>
          <div className={`sc-invite-tab ${tab === 'admins' ? 'active' : ''}`} onClick={() => setTab('admins')}>Quản trị viên ({admins.length})</div>
        </div>
        <div className="sc-modal-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
          {list.map(m => (
            <div key={m.id} className="sc-member-item" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 10 }}>
              <div className="sc-member-av" style={{ background: m.bg, color: m.color }}>{m.id}</div>
              <span className="sc-member-name">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Modal Chi tiết Phòng Chat
// ============================================================
function ChatDetailsModal({ room, onClose }) {
  const options = [
    { icon: '🔍', label: 'Tìm kiếm trong đoạn chat' },
    { icon: '📌', label: 'Xem tin nhắn ghim' },
    { icon: '📁', label: 'Xem file phương tiện & tệp' },
    { icon: '🔗', label: 'Xem liên kết đã chia sẻ' },
  ];

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 350 }}>
        <div className="sc-modal-header">
          <h3>Chi tiết phòng chat</h3>
          <button className="sc-close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="sc-modal-body" style={{ textAlign: 'center' }}>
          <div className="room-av" style={{ background: room.bg, color: room.color, width: 80, height: 80, fontSize: 24, margin: '0 auto 10px' }}>
            {room.initials}
          </div>
          <h3 style={{ margin: '0 0 5px 0' }}>{room.fullName}</h3>
          <p style={{ color: '#666', fontSize: 13, margin: '0 0 20px 0' }}>{room.meta}</p>
          
          <div style={{ textAlign: 'left' }}>
            {options.map((opt, i) => (
              <div key={i} className="sc-chat-detail-opt" onClick={() => { alert(`Tính năng: ${opt.label}`); onClose(); }}>
                <span style={{ marginRight: 10 }}>{opt.icon}</span> {opt.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function StudentChat() {
  const isLeader = true; // Mock: chỉ trưởng nhóm mới thấy nút tạo nhóm chat
  const [activeRoomId, setActiveRoomId]   = useState(1);
  const [messages, setMessages]           = useState(mockMessages);
  const [rooms, setRooms]                 = useState(mockRooms);
  const [inputText, setInputText]         = useState('');
  const [search, setSearch]               = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const chatBodyRef                        = useRef(null);
  const fileInputRef                       = useRef(null);

  const activeRoom     = rooms.find(r => r.id === activeRoomId);
  const currentMsgs    = messages[activeRoomId] || [];
  const filteredRooms  = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, activeRoomId]);

  // Đổi phòng → xoá badge unread
  const handleSelectRoom = (roomId) => {
    setActiveRoomId(roomId);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread: 0 } : r));
  };

  // Gửi tin nhắn
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg = {
      id: Date.now(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderBg: CURRENT_USER.bg,
      senderColor: CURRENT_USER.color,
      content: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      replyTo: null,
      file: null,
    };

    setMessages(prev => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));

    // Cập nhật lastMsg trong sidebar
    setRooms(prev => prev.map(r =>
      r.id === activeRoomId ? { ...r, lastMsg: `Bạn: ${text}`, time: 'Vừa xong' } : r
    ));

    setInputText('');
  };

  // Gửi bằng Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Đính kèm file (demo)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newMsg = {
      id: Date.now(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderBg: CURRENT_USER.bg,
      senderColor: CURRENT_USER.color,
      content: null,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      replyTo: null,
      file: {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      },
    };

    setMessages(prev => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));

    setRooms(prev => prev.map(r =>
      r.id === activeRoomId ? { ...r, lastMsg: `Bạn: 📎 ${file.name}`, time: 'Vừa xong' } : r
    ));

    // Reset input file để có thể chọn lại cùng file
    e.target.value = '';
  };

  return (
    <div className="chat-wrap">
      <div className="chat-top">
        <h1>Không gian thảo luận</h1>
      </div>

      <div className="chat-shell">
        {/* ── SIDEBAR: DANH SÁCH PHÒNG ── */}
        <aside className="room-list">
          <div className="room-search">
            <input
              placeholder="Tìm nhóm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filteredRooms.map(room => (
            <RoomItem
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              onClick={() => handleSelectRoom(room.id)}
            />
          ))}
        </aside>

        {/* ── MAIN: KHU VỰC CHAT ── */}
        <div className="chat-main">
          {/* Header phòng chat */}
          <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowMembersModal(true)}>
              <div className="chat-header-av" style={{ background: activeRoom?.bg, color: activeRoom?.color }}>
                {activeRoom?.initials}
              </div>
              <div>
                <div className="chat-hname">{activeRoom?.fullName}</div>
                <div className="chat-hmeta">{activeRoom?.meta}</div>
              </div>
            </div>
            <div style={{ cursor: 'pointer', padding: '10px', fontSize: '20px', color: '#185fa5' }} onClick={() => setShowDetailsModal(true)}>
              ⋮
            </div>
          </div>

          {/* Tin nhắn ghim */}
          {mockPinnedMessage && (
            <div className="pinned-message" style={{ background: '#f8f9fa', padding: '10px 20px', borderBottom: '1px solid #e1e4e8', fontSize: '13px', color: '#333' }}>
              {mockPinnedMessage}
            </div>
          )}

          {/* Danh sách tin nhắn */}
          <div className="chat-body" ref={chatBodyRef}>
            {currentMsgs.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="chat-input-area">
            {/* Nút đính kèm file */}
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Đính kèm file">
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <input
              className="chat-input"
              placeholder="Nhập tin nhắn... (Enter để gửi)"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button className="send-btn" onClick={handleSend}>
              Gửi
            </button>
          </div>
        </div>
      </div>

      {showMembersModal && (
        <ChatMembersModal room={activeRoom} onClose={() => setShowMembersModal(false)} />
      )}
      {showDetailsModal && (
        <ChatDetailsModal room={activeRoom} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
}
