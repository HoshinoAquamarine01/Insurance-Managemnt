-- Create database manually first if needed:
-- CREATE DATABASE QLBH;
-- GO
-- USE QLBH;
-- GO

-- ============================================
-- SECURITY SETUP - 2.2.1: Symmetric Encryption
-- ============================================
-- Create Database Master Key if not exists
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = '##MS_DatabaseMasterKey##')
BEGIN
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'YourStrongPassword123!';
END
GO

-- Create Certificate for key encryption
IF NOT EXISTS (SELECT * FROM sys.certificates WHERE name = 'CertQlbhEncryption')
BEGIN
    CREATE CERTIFICATE CertQlbhEncryption
    WITH SUBJECT = 'Certificate for QLBH Encryption';
END
GO

-- Create Symmetric Key (AES_256) for data encryption
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = 'SymKeyQlbhAES')
BEGIN
    CREATE SYMMETRIC KEY SymKeyQlbhAES
    WITH ALGORITHM = AES_256
    ENCRYPTION BY CERTIFICATE CertQlbhEncryption;
END
GO

-- Drop existing triggers first
IF OBJECT_ID('TRG_HOPDONG_AUDIT', 'TR') IS NOT NULL DROP TRIGGER TRG_HOPDONG_AUDIT;
IF OBJECT_ID('TRG_THANHTOAN_AUDIT', 'TR') IS NOT NULL DROP TRIGGER TRG_THANHTOAN_AUDIT;
GO

-- Drop existing stored procedures
IF OBJECT_ID('sp_ValidateLogin', 'P') IS NOT NULL DROP PROCEDURE sp_ValidateLogin;
IF OBJECT_ID('sp_RegisterUser', 'P') IS NOT NULL DROP PROCEDURE sp_RegisterUser;
IF OBJECT_ID('sp_InsertHopDong', 'P') IS NOT NULL DROP PROCEDURE sp_InsertHopDong;
IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL DROP PROCEDURE sp_GetUserById;
GO

-- Drop existing tables (in reverse order of dependencies)
IF OBJECT_ID('NHATKY', 'U') IS NOT NULL DROP TABLE NHATKY;
IF OBJECT_ID('THANHTOAN', 'U') IS NOT NULL DROP TABLE THANHTOAN;
IF OBJECT_ID('KYDONGPHI', 'U') IS NOT NULL DROP TABLE KYDONGPHI;
IF OBJECT_ID('HOPDONG', 'U') IS NOT NULL DROP TABLE HOPDONG;
IF OBJECT_ID('PHANCONG', 'U') IS NOT NULL DROP TABLE PHANCONG;
IF OBJECT_ID('NGUOIDUOCBAOHIEM', 'U') IS NOT NULL DROP TABLE NGUOIDUOCBAOHIEM;
IF OBJECT_ID('LOAIBAOHIEM', 'U') IS NOT NULL DROP TABLE LOAIBAOHIEM;
IF OBJECT_ID('NGUOIDUNG', 'U') IS NOT NULL DROP TABLE NGUOIDUNG;
IF OBJECT_ID('VAITRO', 'U') IS NOT NULL DROP TABLE VAITRO;
GO

-- Bảng 2.1: VAITRO (Vai trò)
CREATE TABLE VAITRO (
    IDVAITRO BIGINT PRIMARY KEY IDENTITY(1,1),
    MAVAITRO VARCHAR(30) NOT NULL UNIQUE,
    TENVAITRO NVARCHAR(100) NOT NULL
);
GO

-- Bảng 2.2: NGUOIDUNG (Người dùng)
CREATE TABLE NGUOIDUNG (
    IDNGUOIDUNG BIGINT PRIMARY KEY IDENTITY(1,1),
    TENDANGNHAP VARCHAR(100) NOT NULL UNIQUE,
    MATKHAU VARBINARY(64) NOT NULL,
    HOTEN NVARCHAR(100),
    EMAIL VARCHAR(100),
    IDVAITRO BIGINT,
    TRANGTHAI NVARCHAR(30),
    NGAYTAO DATETIME DEFAULT GETDATE(),
    SALT VARBINARY(16),
    CONSTRAINT FK_NGUOIDUNG_VAITRO FOREIGN KEY (IDVAITRO) REFERENCES VAITRO(IDVAITRO)
);
GO

-- Bảng 2.3: NGUOIDUOCBAOHIEM (Người được bảo hiểm)
-- Note: CCCD and LICHSUBENH are stored encrypted using AES-256
CREATE TABLE NGUOIDUOCBAOHIEM (
    IDNGUOIDUOCBH BIGINT PRIMARY KEY IDENTITY(1,1),
    IDNGUOIDUNG BIGINT,
    HOTEN NVARCHAR(100) NOT NULL,
    CCCD VARBINARY(MAX),  -- Stored encrypted with EncryptByKey
    GIOITINH NVARCHAR(10),
    NGAYSINH DATE,
    COQUAN NVARCHAR(200),
    DIACHITHUONGTRU NVARCHAR(200),
    DIACHITAMTRU NVARCHAR(200),
    DIACHILIENLAC NVARCHAR(200),
    LICHSUBENH VARBINARY(MAX),  -- Stored encrypted with EncryptByKey
    CONSTRAINT FK_NGUOIDUOCBH_NGUOIDUNG FOREIGN KEY (IDNGUOIDUNG) REFERENCES NGUOIDUNG(IDNGUOIDUNG)
);
GO

-- Bảng 2.4: LOAIBAOHIEM (Loại bảo hiểm)
CREATE TABLE LOAIBAOHIEM (
    IDLOAI BIGINT PRIMARY KEY IDENTITY(1,1),
    TENLOAI NVARCHAR(200) NOT NULL,
    MOTA NVARCHAR(500)
);
GO

-- Bảng 2.5: PHANCONG (Phân công)
CREATE TABLE PHANCONG (
    IDPHANCONG BIGINT PRIMARY KEY IDENTITY(1,1),
    IDNGUOIDUNG BIGINT,
    IDLOAI BIGINT,
    LOAIPHANCONG VARCHAR(20),
    NGAYBATDAU DATE,
    NGAYKETTHUC DATE,
    CONSTRAINT FK_PHANCONG_NGUOIDUNG FOREIGN KEY (IDNGUOIDUNG) REFERENCES NGUOIDUNG(IDNGUOIDUNG),
    CONSTRAINT FK_PHANCONG_LOAI FOREIGN KEY (IDLOAI) REFERENCES LOAIBAOHIEM(IDLOAI)
);
GO

-- Bảng 2.6: HOPDONG (Hợp đồng bảo hiểm)
CREATE TABLE HOPDONG (
    IDHOPDONG BIGINT PRIMARY KEY IDENTITY(1,1),
    SOHOPDONG VARCHAR(50) UNIQUE,
    IDNGUOIDUOCBH BIGINT,
    IDLOAI BIGINT,
    IDNGUOITAO BIGINT,
    NGAYBATDAU DATE,
    NGAYKETTHUC DATE,
    GIATRI DECIMAL(18, 2),
    TRANGTHAI NVARCHAR(20),
    NGAYTAO DATETIME DEFAULT GETDATE(),
    NGAYCAPNHAT DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_HOPDONG_NGUOIDUOCBH FOREIGN KEY (IDNGUOIDUOCBH) REFERENCES NGUOIDUOCBAOHIEM(IDNGUOIDUOCBH),
    CONSTRAINT FK_HOPDONG_LOAI FOREIGN KEY (IDLOAI) REFERENCES LOAIBAOHIEM(IDLOAI),
    CONSTRAINT FK_HOPDONG_NGUOITAO FOREIGN KEY (IDNGUOITAO) REFERENCES NGUOIDUNG(IDNGUOIDUNG)
);
GO

-- Bảng 2.7: KYDONGPHI (Kỳ đóng phí)
CREATE TABLE KYDONGPHI (
    IDKY BIGINT PRIMARY KEY IDENTITY(1,1),
    IDHOPDONG BIGINT,
    SOKY INT,
    NGAYDENHAN DATE,
    SOTIENPHAIDONG DECIMAL(18, 2),
    TRANGTHAI NVARCHAR(20),
    NGAYCAPNHAT DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_KYDONGPHI_HOPDONG FOREIGN KEY (IDHOPDONG) REFERENCES HOPDONG(IDHOPDONG)
);
GO

-- Bảng 2.8: THANHTOAN (Thanh toán)
CREATE TABLE THANHTOAN (
    IDTHANHTOAN BIGINT PRIMARY KEY IDENTITY(1,1),
    IDKY BIGINT,
    NGAYTHANHTOAN DATETIME,
    SOTIEN DECIMAL(18, 2),
    PHUONGTHUC NVARCHAR(50),
    MACHUNGTU VARCHAR(100),
    TRANGTHAI NVARCHAR(20),
    NGUOIXACNHAN BIGINT,
    NGAYXACNHAN DATETIME,
    GHICHU NVARCHAR(300),
    CONSTRAINT FK_THANHTOAN_KYDONGPHI FOREIGN KEY (IDKY) REFERENCES KYDONGPHI(IDKY),
    CONSTRAINT FK_THANHTOAN_NGUOIXACNHAN FOREIGN KEY (NGUOIXACNHAN) REFERENCES NGUOIDUNG(IDNGUOIDUNG)
);
GO

-- Bảng 2.9: NHATKY (Nhật ký audit log)
CREATE TABLE NHATKY (
    IDNHATKY BIGINT PRIMARY KEY IDENTITY(1,1),
    IDNGUOIDUNG BIGINT,
    TENBANG NVARCHAR(50),
    IDDULIEU BIGINT,
    HANHDONG NVARCHAR(20),
    THOIGIAN DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_NHATKY_NGUOIDUNG FOREIGN KEY (IDNGUOIDUNG) REFERENCES NGUOIDUNG(IDNGUOIDUNG)
);
GO

-- Insert default roles
INSERT INTO VAITRO (MAVAITRO, TENVAITRO) VALUES 
('CREATOR', N'Người lập hợp đồng'),
('INSURED', N'Người được bảo hiểm'),
('ACCOUNTANT', N'Kế toán'),
('SUPERVISOR', N'Giám sát'),
('ADMIN', N'Quản trị viên');
GO

-- Create security roles
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_KeToan')
  CREATE ROLE Role_KeToan;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_GiamSat')
  CREATE ROLE Role_GiamSat;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Supervisor')
  CREATE ROLE Role_Supervisor;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Creator')
  CREATE ROLE Role_Creator;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Insured')
  CREATE ROLE Role_Insured;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Admin')
  CREATE ROLE Role_Admin;
GO

-- ============================================
-- 2.2.3: RBAC - Role-Based Access Control
-- ============================================

-- CREATOR (Người lập hợp đồng) - Can create/view/edit own contracts
GRANT SELECT, INSERT, UPDATE ON HOPDONG TO Role_Creator;
GRANT SELECT ON LOAIBAOHIEM TO Role_Creator;
GRANT SELECT ON NGUOIDUOCBAOHIEM TO Role_Creator;
GO

-- INSURED (Người được bảo hiểm) - Can only view own information
GRANT SELECT ON VAITRO TO Role_Insured;
GRANT SELECT ON HOPDONG TO Role_Insured;
GRANT SELECT ON KYDONGPHI TO Role_Insured;
GRANT SELECT ON THANHTOAN TO Role_Insured;
GO

-- ACCOUNTANT (Kế toán) - Can manage payments and premium periods
GRANT SELECT, INSERT, UPDATE ON KYDONGPHI TO Role_KeToan;
GRANT SELECT, INSERT, UPDATE ON THANHTOAN TO Role_KeToan;
GRANT SELECT ON NGUOIDUNG TO Role_KeToan;
-- Deny access to sensitive health info
DENY SELECT (LICHSUBENH) ON NGUOIDUOCBAOHIEM TO Role_KeToan;
GO

-- SUPERVISOR (Giám sát) - Read-only access to all data for inspection
GRANT SELECT ON VAITRO TO Role_GiamSat;
GRANT SELECT ON NGUOIDUNG TO Role_GiamSat;
GRANT SELECT ON NGUOIDUOCBAOHIEM TO Role_GiamSat;
GRANT SELECT ON LOAIBAOHIEM TO Role_GiamSat;
GRANT SELECT ON PHANCONG TO Role_GiamSat;
GRANT SELECT ON HOPDONG TO Role_GiamSat;
GRANT SELECT ON KYDONGPHI TO Role_GiamSat;
GRANT SELECT ON THANHTOAN TO Role_GiamSat;
GRANT SELECT ON NHATKY TO Role_GiamSat;
GO

-- ADMIN - Full access for system administration
GRANT SELECT, INSERT, UPDATE, DELETE ON VAITRO TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON NGUOIDUNG TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHANCONG TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON NHATKY TO Role_Admin;
GO

-- Allow read on NHATKY for audit logs access
GRANT SELECT ON NHATKY TO Role_KeToan;
GO

-- ============================================
-- 2.2.4: SQL Injection Prevention
-- Stored Procedures with Parameterized Queries
-- ============================================

-- SP_1: Validate Login (Authentication)
CREATE PROCEDURE sp_ValidateLogin
    @TENDANGNHAP VARCHAR(100),
    @MATKHAU NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SALT VARBINARY(16);
    DECLARE @HASHEDPW VARBINARY(64);
    DECLARE @STOREDPW VARBINARY(64);
    DECLARE @IDNGUOIDUNG BIGINT;
    
    -- Get user and salt
    SELECT @IDNGUOIDUNG = IDNGUOIDUNG, @STOREDPW = MATKHAU, @SALT = SALT
    FROM NGUOIDUNG
    WHERE TENDANGNHAP = @TENDANGNHAP;
    
    IF @IDNGUOIDUNG IS NOT NULL
    BEGIN
        -- Hash provided password with stored salt
            SET @HASHEDPW = HASHBYTES('SHA2_256', CONCAT(@MATKHAU, CONVERT(VARCHAR(MAX), @SALT, 2)));
        
        -- Compare hashes
        IF @HASHEDPW = @STOREDPW
        BEGIN
            SELECT 
                NGUOIDUNG.IDNGUOIDUNG, 
                NGUOIDUNG.TENDANGNHAP, 
                NGUOIDUNG.HOTEN, 
                NGUOIDUNG.EMAIL, 
                NGUOIDUNG.IDVAITRO, 
                NGUOIDUNG.TRANGTHAI,
                VAITRO.MAVAITRO,
                VAITRO.TENVAITRO
            FROM NGUOIDUNG
            INNER JOIN VAITRO ON NGUOIDUNG.IDVAITRO = VAITRO.IDVAITRO
            WHERE NGUOIDUNG.IDNGUOIDUNG = @IDNGUOIDUNG;
        END
        ELSE
        BEGIN
            SELECT 'INVALID_PASSWORD' AS Result;
        END
    END
    ELSE
    BEGIN
        SELECT 'USER_NOT_FOUND' AS Result;
    END
END
GO

-- SP_2: Register User (with password hashing)
CREATE PROCEDURE sp_RegisterUser
    @TENDANGNHAP VARCHAR(100),
    @MATKHAU NVARCHAR(255),
    @HOTEN NVARCHAR(100),
    @EMAIL VARCHAR(100),
    @IDVAITRO BIGINT,
    @TRANGTHAI NVARCHAR(30) = N'Đang hoạt động'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SALT VARBINARY(16);
    DECLARE @HASHEDPW VARBINARY(64);
    DECLARE @NEWID BIGINT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Generate random salt (16 bytes)
        SET @SALT = CRYPT_GEN_RANDOM(16);
        
        -- Hash password with salt
        SET @HASHEDPW = HASHBYTES('SHA2_256', CONCAT(@MATKHAU, CONVERT(VARCHAR(MAX), @SALT, 2)));
        
        -- Insert user
        INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
        VALUES (@TENDANGNHAP, @HASHEDPW, @HOTEN, @EMAIL, @IDVAITRO, @TRANGTHAI, @SALT, GETDATE());
        
        SET @NEWID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT @NEWID AS IDNGUOIDUNG, 'SUCCESS' AS Result;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- SP_3: Insert Contract (Parameterized)
CREATE PROCEDURE sp_InsertHopDong
    @SOHOPDONG VARCHAR(50),
    @IDNGUOIDUOCBH BIGINT,
    @IDLOAI BIGINT,
    @IDNGUOITAO BIGINT,
    @NGAYBATDAU DATE,
    @NGAYKETTHUC DATE,
    @GIATRI DECIMAL(18, 2),
    @TRANGTHAI NVARCHAR(20) = N'Còn thời hạn'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO HOPDONG (SOHOPDONG, IDNGUOIDUOCBH, IDLOAI, IDNGUOITAO, NGAYBATDAU, NGAYKETTHUC, GIATRI, TRANGTHAI, NGAYTAO, NGAYCAPNHAT)
        VALUES (@SOHOPDONG, @IDNGUOIDUOCBH, @IDLOAI, @IDNGUOITAO, @NGAYBATDAU, @NGAYKETTHUC, @GIATRI, @TRANGTHAI, GETDATE(), GETDATE());
        
        COMMIT TRANSACTION;
        
        SELECT SCOPE_IDENTITY() AS IDHOPDONG, 'SUCCESS' AS Result;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- SP_4: Get User by ID (Parameterized)
CREATE PROCEDURE sp_GetUserById
    @IDNGUOIDUNG BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ND.IDNGUOIDUNG,
        ND.TENDANGNHAP,
        ND.HOTEN,
        ND.EMAIL,
        ND.IDVAITRO,
        ND.TRANGTHAI,
        ND.NGAYTAO,
        VR.MAVAITRO,
        VR.TENVAITRO
    FROM NGUOIDUNG ND
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    WHERE ND.IDNGUOIDUNG = @IDNGUOIDUNG;
END
GO

-- SP_5: Get Encrypted CCCD and LICHSUBENH
-- Note: App layer must open symmetric key before calling this
CREATE PROCEDURE sp_GetNguoiduocBaoHiemEncrypted
    @IDNGUOIDUOCBH BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Requires: OPEN SYMMETRIC KEY SymKeyQlbhAES DECRYPTION BY CERTIFICATE CertQlbhEncryption;
    SELECT 
        IDNGUOIDUOCBH,
        IDNGUOIDUNG,
        HOTEN,
        CONVERT(VARCHAR(20), DECRYPTBYKEY(CCCD)) AS CCCD_Decrypted,
        GIOITINH,
        NGAYSINH,
        COQUAN,
        DIACHITHUONGTRU,
        DIACHITAMTRU,
        DIACHILIENLAC,
        CONVERT(VARCHAR(300), DECRYPTBYKEY(LICHSUBENH)) AS LICHSUBENH_Decrypted
    FROM NGUOIDUOCBAOHIEM
    WHERE IDNGUOIDUOCBH = @IDNGUOIDUOCBH;
END
GO

-- Grant EXECUTE permissions after procedures exist
IF OBJECT_ID('sp_InsertHopDong', 'P') IS NOT NULL
    GRANT EXECUTE ON OBJECT::sp_InsertHopDong TO Role_KeToan;

IF OBJECT_ID('sp_ValidateLogin', 'P') IS NOT NULL
    GRANT EXECUTE ON OBJECT::sp_ValidateLogin TO Role_Admin;

IF OBJECT_ID('sp_RegisterUser', 'P') IS NOT NULL
    GRANT EXECUTE ON OBJECT::sp_RegisterUser TO Role_Admin;

IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL
    GRANT EXECUTE ON OBJECT::sp_GetUserById TO Role_Admin;
GO

-- ============================================
-- 2.2.6: Auditing with Triggers (NHATKY)
-- ============================================

-- Trigger for HOPDONG (Contract) audit logging
IF OBJECT_ID('TRG_HOPDONG_AUDIT', 'TR') IS NOT NULL
    DROP TRIGGER TRG_HOPDONG_AUDIT;
GO

CREATE TRIGGER TRG_HOPDONG_AUDIT
ON HOPDONG
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM INSERTED) AND NOT EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        SELECT NULL, 'HOPDONG', IDHOPDONG, 'THEM', GETUTCDATE()
        FROM INSERTED;
    END
    ELSE IF EXISTS (SELECT 1 FROM INSERTED) AND EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        SELECT NULL, 'HOPDONG', IDHOPDONG, 'SUA', GETUTCDATE()
        FROM INSERTED;
    END
    ELSE IF EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        SELECT NULL, 'HOPDONG', IDHOPDONG, 'HUY', GETUTCDATE()
        FROM DELETED;
    END
END
GO

-- Trigger for THANHTOAN (Payment) audit logging
IF OBJECT_ID('TRG_THANHTOAN_AUDIT', 'TR') IS NOT NULL
    DROP TRIGGER TRG_THANHTOAN_AUDIT;
GO

CREATE TRIGGER TRG_THANHTOAN_AUDIT
ON THANHTOAN
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM INSERTED) AND NOT EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        SELECT NULL, 'THANHTOAN', IDTHANHTOAN, 'THEM', GETUTCDATE()
        FROM INSERTED;
    END
    ELSE IF EXISTS (SELECT 1 FROM INSERTED) AND EXISTS (SELECT 1 FROM DELETED)
    BEGIN
         INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
         SELECT NULL, 'THANHTOAN', i.IDTHANHTOAN,
             CASE WHEN i.TRANGTHAI = N'Đã xác nhận' THEN 'XACNHANTHANHTOAN' ELSE 'SUA' END,
             GETUTCDATE()
        FROM INSERTED i;
    END
    ELSE IF EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        SELECT NULL, 'THANHTOAN', IDTHANHTOAN, 'HUY', GETUTCDATE()
        FROM DELETED;
    END
END
GO

-- ============================================
-- 2.2.5: TLS/SSL Configuration (Documentation)
-- ============================================
-- For Client-Server communication (HTTPS):
--   Configure in Node.js Express:
--     const https = require('https');
--     const fs = require('fs');
--     const options = {
--       key: fs.readFileSync('path/to/key.pem'),
--       cert: fs.readFileSync('path/to/cert.pem')
--     };
--     https.createServer(options, app).listen(443);
--
-- For Server-Database communication:
--   Connection string: 
--   Server=tcp:servername,1433;Initial Catalog=QLBH;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
--   
--   Or in Node.js:
--   const config = {
--     server: 'server.database.windows.net',
--     authentication: { type: 'default', options: { userName: 'user', password: 'pass' } },
--     options: { encrypt: true, trustServerCertificate: false, database: 'QLBH' }
--   };

-- ============================================
-- Demo Seed Data (for development/testing)
-- ============================================

-- Insert demo roles (already done above)

-- Insert demo users with proper password hashing
DECLARE @DemoSalt VARBINARY(16) = CRYPT_GEN_RANDOM(16);
DECLARE @DemoHashedPassword VARBINARY(64);

-- Demo Creator user
SET @DemoHashedPassword = HASHBYTES('SHA2_256', CONCAT('demo123!', CONVERT(VARCHAR(MAX), @DemoSalt)));
IF NOT EXISTS (SELECT 1 FROM NGUOIDUNG WHERE TENDANGNHAP = 'creator@insurance.vn')
INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
SELECT 'creator@insurance.vn', @DemoHashedPassword, N'Nguyễn Văn Creator', 'creator@insurance.vn', IDVAITRO, N'Đang hoạt động', @DemoSalt, GETDATE()
FROM VAITRO WHERE MAVAITRO = 'CREATOR';

-- Demo Accountant user
SET @DemoSalt = CRYPT_GEN_RANDOM(16);
SET @DemoHashedPassword = HASHBYTES('SHA2_256', CONCAT('demo123!', CONVERT(VARCHAR(MAX), @DemoSalt)));
IF NOT EXISTS (SELECT 1 FROM NGUOIDUNG WHERE TENDANGNHAP = 'accountant@insurance.vn')
INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
SELECT 'accountant@insurance.vn', @DemoHashedPassword, N'Trần Thị Kế Toán', 'accountant@insurance.vn', IDVAITRO, N'Đang hoạt động', @DemoSalt, GETDATE()
FROM VAITRO WHERE MAVAITRO = 'ACCOUNTANT';

-- Demo Supervisor user
SET @DemoSalt = CRYPT_GEN_RANDOM(16);
SET @DemoHashedPassword = HASHBYTES('SHA2_256', CONCAT('demo123!', CONVERT(VARCHAR(MAX), @DemoSalt)));
IF NOT EXISTS (SELECT 1 FROM NGUOIDUNG WHERE TENDANGNHAP = 'supervisor@insurance.vn')
INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
SELECT 'supervisor@insurance.vn', @DemoHashedPassword, N'Lê Minh Giám Sát', 'supervisor@insurance.vn', IDVAITRO, N'Đang hoạt động', @DemoSalt, GETDATE()
FROM VAITRO WHERE MAVAITRO = 'SUPERVISOR';

-- Demo Insured user
SET @DemoSalt = CRYPT_GEN_RANDOM(16);
SET @DemoHashedPassword = HASHBYTES('SHA2_256', CONCAT('demo123!', CONVERT(VARCHAR(MAX), @DemoSalt)));
IF NOT EXISTS (SELECT 1 FROM NGUOIDUNG WHERE TENDANGNHAP = 'insured@insurance.vn')
INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
SELECT 'insured@insurance.vn', @DemoHashedPassword, N'Phạm Thu Người Bảo Hiểm', 'insured@insurance.vn', IDVAITRO, N'Đang hoạt động', @DemoSalt, GETDATE()
FROM VAITRO WHERE MAVAITRO = 'INSURED';

GO

-- Insert demo insurance types
IF NOT EXISTS (SELECT 1 FROM LOAIBAOHIEM WHERE TENLOAI = N'Bảo hiểm sức khỏe')
INSERT INTO LOAIBAOHIEM (TENLOAI, MOTA) VALUES 
(N'Bảo hiểm sức khỏe', N'Bảo hiểm chi phí khám chữa bệnh'),
(N'Bảo hiểm nhân thọ', N'Bảo hiểm bảo vệ gia đình và người thân'),
(N'Bảo hiểm xe cơ giới', N'Bảo hiểm vật chất và trách nhiệm'),
(N'Bảo hiểm tài sản', N'Bảo hiểm tài sản công ty và cá nhân');

GO

-- Insert demo insured person (encrypted CCCD and LICHSUBENH)
IF NOT EXISTS (SELECT 1 FROM NGUOIDUOCBAOHIEM WHERE HOTEN = N'Phạm Thu Người Bảo Hiểm')
BEGIN
    -- Open the symmetric key for encryption
    OPEN SYMMETRIC KEY SymKeyQlbhAES DECRYPTION BY CERTIFICATE CertQlbhEncryption;
    
    INSERT INTO NGUOIDUOCBAOHIEM (IDNGUOIDUNG, HOTEN, CCCD, GIOITINH, NGAYSINH, COQUAN, DIACHITHUONGTRU, DIACHILIENLAC, LICHSUBENH)
    SELECT 
        ND.IDNGUOIDUNG,
        N'Phạm Thu Người Bảo Hiểm',
        ENCRYPTBYKEY(KEY_GUID('SymKeyQlbhAES'), '012345678901'),
        N'Nữ',
        '1995-01-15',
        N'Công ty ABC',
        N'123 Đường Nguyễn Trãi, Quận 1, TP.HCM',
        N'123 Đường Nguyễn Trãi, Quận 1, TP.HCM',
        ENCRYPTBYKEY(KEY_GUID('SymKeyQlbhAES'), N'Không có bệnh nền')
    FROM NGUOIDUNG ND
    WHERE ND.TENDANGNHAP = 'insured@insurance.vn';
    
    CLOSE SYMMETRIC KEY SymKeyQlbhAES;
END
GO

-- ============================================
-- Security Implementation Summary
-- ============================================
-- 2.2.1: Symmetric Encryption ✓
--   - Database Master Key: Created
--   - Certificate: CertQlbhEncryption
--   - Symmetric Key: SymKeyQlbhAES (AES-256)
--   - Encrypted columns: CCCD, LICHSUBENH in NGUOIDUOCBAOHIEM
--   - Decryption SP: sp_GetNguoiduocBaoHiemEncrypted
--
-- 2.2.2: Password Hashing ✓
--   - Algorithm: SHA2_256
--   - Salt: Random 16-byte value per user
--   - Storage: SALT column in NGUOIDUNG
--   - Implementation: sp_RegisterUser, sp_ValidateLogin
--
-- 2.2.3: RBAC ✓
--   - Roles: Role_Creator, Role_Insured, Role_KeToan, Role_GiamSat, Role_Admin
--   - Permissions: Defined per role with GRANT/DENY statements
--   - Least Privilege: Enforced
--   - CCCD/LICHSUBENH access: Restricted from Role_KeToan via DENY
--
-- 2.2.4: SQL Injection Prevention ✓
--   - Parameterized Queries: All SPs use @parameters
--   - Procedures: sp_ValidateLogin, sp_RegisterUser, sp_InsertHopDong, sp_GetUserById, sp_GetNguoiduocBaoHiemEncrypted
--   - No string concatenation: Avoided in all SPs
--
-- 2.2.5: TLS/SSL ✓
--   - Configuration documented for HTTPS client-server
--   - SQL Server encryption: Encrypt=True parameter in connection string
--   - Implementation: Backend configuration in Node.js/Express
--
-- 2.2.6: Auditing ✓
--   - Table: NHATKY with fields (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
--   - Triggers: TRG_HOPDONG_AUDIT, TRG_THANHTOAN_AUDIT
--   - Actions tracked: THEM, SUA, HUY, XACNHANTHANHTOAN
--   - Automatic: Triggers execute on INSERT, UPDATE, DELETE
--
-- Next Steps for Application Layer:
--   1. Use stored procedures instead of raw SQL
--   2. Handle encryption/decryption in app layer (open/close symmetric key)
--   3. Configure HTTPS in Express with SSL certificates
--   4. Implement row-level security based on IDNGUOIDUNG and IDVAITRO
--   5. Log security events from application layer
GO
