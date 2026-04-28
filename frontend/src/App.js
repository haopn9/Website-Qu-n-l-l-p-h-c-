import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Pages
import MainPage from './pages/Main/MainPage';
import LoginPage from './pages/Login/LoginPage';

// Import Layouts
import StudentLayout from './pages/Student/StudentLayout';
import AdminLayout from './pages/Admin/AdminLayout';
import TeacherLayout from './pages/Teacher/TeacherLayout';

// Import Profile 
import UserProfile from './pages/Profiles/UserProfile';

// Import Student Pages
import StudentDashboard from './pages/Student/StudentDashboard'; // trang chính
import StudentClasses from './pages/Student/StudentClasses'; // trang lớp học
import StudentClassDetail from './pages/Student/StudentClassDetail'; // trang chi tiết lớp học
import StudentGroups from './pages/Student/StudentGroups'; // trang nhóm học tập
import StudentTasks from './pages/Student/StudentTasks'; // trang nhiệm vụ & tiến độ
import StudentChat from './pages/Student/StudentChat'; // trang không gian thảo luận
import StudentManageGroup from './pages/Student/StudentManageGroup'; // trang điều phối nhóm

// Import các trang quản lý của ADMIN
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import ClassManagement from './pages/Admin/ClassManagement';
import GroupManagement from './pages/Admin/GroupManagement';
import MessageManagement from './pages/Admin/MessageManagement';

// Import Teacher Pages
import ManageClasses from './pages/Teacher/ManageClasses/ManageClasses';
import ManageTopics from './pages/Teacher/ManageTopics/ManageTopics';
import ManageGroups from './pages/Teacher/ManageGroups/ManageGroups';
import Tracking from './pages/Teacher/Tracking/Tracking';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Tuyến đường Sinh viên */}
        <Route path="/student" element={<StudentLayout/>}>
          <Route path="profile" element={<UserProfile role="student" />} />
         <Route path="dashboard"    element={<StudentDashboard />} /> 
          <Route path="classes"    element={<StudentClasses />} />
           <Route path="classes/:maLop" element={<StudentClassDetail />} />
          <Route path="groups"    element={<StudentGroups />} />
          <Route path="tasks"    element={<StudentTasks />} />
          <Route path="chat"    element={<StudentChat />} />
          <Route path="manage-group"    element={<StudentManageGroup />} />
          {/* Các trang khác của SV... */}
        </Route>

           {/* Tuyến đường Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="groups" element={<GroupManagement />} />
          <Route path="messages" element={<MessageManagement />} /> 
          <Route path="profile" element={<UserProfile role="admin" />} />
        </Route>

        {/* Tuyến đường Giảng viên */}
        <Route path="/teacher" element={<TeacherLayout />}>
           {/* Gọi  Profile ở đây */}
          <Route path="profile" element={<UserProfile role="teacher" />} />
          <Route path="manage-classes" element={<ManageClasses />} />
          <Route path="manage-topics" element={<ManageTopics />} />
          <Route path="manage-groups" element={<ManageGroups />} />
          <Route path="tracking" element={<Tracking />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;