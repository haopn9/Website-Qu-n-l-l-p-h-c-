
CREATE DATABASE QuanLyLopHocDB;
GO

USE QuanLyLopHocDB;
GO

-- ==========================================
-- CỤM 1: QUẢN LÝ NGƯỜI DÙNG & LỚP HỌC
-- ==========================================

-- 1. Bảng Quyền truy cập (Dựa trên các vai trò: Quản trị viên : 1, Giảng viên : 2, Sinh viên : 3)
CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL -- Admin, Teacher, Student
);

-- 2. Bảng Người dùng (Quản lý tài khoản người dùng)
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    UserCode VARCHAR(20) UNIQUE, -- Ví dụ: AD1 => admin, SV1 => sinh viên, GV1 => giảng viên
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    BirthDay DATE,
    Address NVARCHAR(255),
    Sex BIT, -- Quy ước: 1 là Nam, 0 là Nữ
    NumberPhone VARCHAR(20) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    AvatarUrl NVARCHAR(MAX) NULL,
    RoleId INT NOT NULL,
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);

-- 3. Bảng Lớp học (Quản lý dữ liệu lớp học)
CREATE TABLE Classes (
    ClassId INT IDENTITY(1,1) PRIMARY KEY,
    ClassCode VARCHAR(20) UNIQUE,
    ClassName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    TeacherId INT NOT NULL, -- Giảng viên phụ trách
    FOREIGN KEY (TeacherId) REFERENCES Users(UserId)
);

-- 4. Bảng Danh sách Sinh viên trong Lớp
CREATE TABLE ClassStudents (
    ClassId INT NOT NULL,
    StudentId INT NOT NULL,
    PRIMARY KEY (ClassId, StudentId),
    FOREIGN KEY (ClassId) REFERENCES Classes(ClassId),
    FOREIGN KEY (StudentId) REFERENCES Users(UserId)
);

-- ==========================================
-- CỤM 2: QUẢN LÝ NHÓM HỌC TẬP
-- ==========================================

-- 5. Bảng Nhóm học tập
CREATE TABLE Groups (
    GroupId INT IDENTITY(1,1) PRIMARY KEY,
    GroupName NVARCHAR(100) NOT NULL,
    MaxMembers INT NOT NULL, -- Giới hạn số lượng thành viên mỗi nhóm
    ClassId INT NOT NULL,
    LeaderId INT NULL, -- Chỉ định nhóm trưởng
    FOREIGN KEY (ClassId) REFERENCES Classes(ClassId),
    FOREIGN KEY (LeaderId) REFERENCES Users(UserId)
);

-- 6. Bảng Thành viên Nhóm
CREATE TABLE GroupMembers (
    GroupId INT NOT NULL,
    StudentId INT NOT NULL,
    PRIMARY KEY (GroupId, StudentId),
    FOREIGN KEY (GroupId) REFERENCES Groups(GroupId),
    FOREIGN KEY (StudentId) REFERENCES Users(UserId)
);

-- ==========================================
-- CỤM 3: QUẢN LÝ CÔNG VIỆC & TIẾN ĐỘ
-- ==========================================

-- 7. Bảng Nhiệm vụ được phân công
CREATE TABLE Tasks (
    TaskId INT IDENTITY(1,1) PRIMARY KEY,
    GroupId INT NOT NULL,
    TaskName NVARCHAR(255) NOT NULL, -- Tên công việc
    Description NVARCHAR(MAX), -- Mô tả công việc
    AssigneeId INT NULL, -- Người phụ trách
    StartDate DATETIME NULL, -- Ngày bắt đầu
    DueDate DATETIME NULL, -- Hạn hoàn thành
    Priority NVARCHAR(50) NULL, -- Mức độ ưu tiên (Cao, Trung bình, Thấp)
    Status NVARCHAR(50) DEFAULT N'chưa bắt đầu', -- Trạng thái công việc
    CompletionPercent INT DEFAULT 0, -- Cập nhật phần trăm hoàn thành công việc
    FOREIGN KEY (GroupId) REFERENCES Groups(GroupId),
    FOREIGN KEY (AssigneeId) REFERENCES Users(UserId)
);

-- 8. Bảng Lịch sử cập nhật / Tiến độ công việc
CREATE TABLE TaskHistory (
    HistoryId INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    UpdatedById INT NOT NULL, -- Người thực hiện cập nhật
    UpdateDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50),
    CompletionPercent INT,
    Note NVARCHAR(MAX), -- Ghi chú tình trạng thực hiện
    FOREIGN KEY (TaskId) REFERENCES Tasks(TaskId),
    FOREIGN KEY (UpdatedById) REFERENCES Users(UserId)
);

-- ==========================================
-- CỤM 4: QUẢN LÝ THẢO LUẬN (MODULE CHAT)
-- ==========================================

-- 9. Bảng Tin nhắn thảo luận
CREATE TABLE Messages (
    MessageId INT IDENTITY(1,1) PRIMARY KEY,
    GroupId INT NOT NULL,
    SenderId INT NOT NULL, -- Ghi nhận người gửi
    Content NVARCHAR(MAX) NOT NULL,
    SendTime DATETIME DEFAULT GETDATE(), -- Ghi nhận thời gian gửi
    ParentMessageId INT NULL, -- Hỗ trợ trả lời theo chuỗi chủ đề
    FOREIGN KEY (GroupId) REFERENCES Groups(GroupId),
    FOREIGN KEY (SenderId) REFERENCES Users(UserId),
    FOREIGN KEY (ParentMessageId) REFERENCES Messages(MessageId)
);

-- 10. Bảng Tập tin đính kèm
CREATE TABLE Attachments (
    AttachmentId INT IDENTITY(1,1) PRIMARY KEY,
    MessageId INT NOT NULL, -- Liên kết với tin nhắn để đính kèm tập tin hoặc hình ảnh
    FileName NVARCHAR(255) NOT NULL,
    FilePath VARCHAR(MAX) NOT NULL, -- Đường dẫn lưu file trên server
    FileType VARCHAR(50) NULL,
    FOREIGN KEY (MessageId) REFERENCES Messages(MessageId)
);
GO

PRINT N'Tạo Cơ sở dữ liệu QuanLyLopHocDB thành công!';

-- Thêm dữ liệu
INSERT INTO Roles (RoleName) 
VALUES (N'Admin'),      
(N'Giảng viên'),
(N'Sinh viên');    
GO

-- Kiểm tra lại dữ liệu đã chèn
SELECT * FROM Roles;

-- thêm cột AvatarUrl vào bảng Users để lưu trữ đường dẫn hình ảnh đại diện của người dùng
ALTER TABLE Users
ADD AvatarUrl NVARCHAR(MAX) NULL;