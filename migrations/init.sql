-- ERP.AERO Database Initialization Script
-- This script creates the database and all required tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS erp_aero
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE erp_aero;

-- ============================================================================
-- Table 1: users
-- Stores user credentials (email or phone as ID)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Email or phone number',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hash with cost factor 10',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='User authentication table';

-- ============================================================================
-- Table 2: sessions
-- Stores user sessions with JWT token hashes (supports multi-device login)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(36) PRIMARY KEY COMMENT 'UUID v4 - unique per device/login',
  user_id VARCHAR(255) NOT NULL COMMENT 'References users.id',
  access_token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of JWT access token',
  refresh_token_hash VARCHAR(64) NOT NULL UNIQUE COMMENT 'SHA-256 hash of refresh token',
  device_info VARCHAR(500) DEFAULT NULL COMMENT 'User-Agent header for audit',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP address (supports IPv4 and IPv6)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  access_expires_at TIMESTAMP NOT NULL COMMENT 'Access token expiration (NOW + 10 min)',
  refresh_expires_at TIMESTAMP NOT NULL COMMENT 'Refresh token expiration (NOW + 7 days)',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'FALSE = session invalidated',

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_active (user_id, is_active) COMMENT 'Fast lookup of active sessions',
  INDEX idx_refresh_token (refresh_token_hash) COMMENT 'Fast lookup for token refresh',
  INDEX idx_expires (refresh_expires_at) COMMENT 'Cleanup expired sessions'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Multi-device session management';

-- ============================================================================
-- Table 3: files
-- Stores file metadata with user ownership (files isolated per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL COMMENT 'File owner - references users.id',
  filename VARCHAR(255) NOT NULL COMMENT 'Unique filename on disk (timestamp_random.ext)',
  original_name VARCHAR(255) NOT NULL COMMENT 'Original filename from user upload',
  extension VARCHAR(50) NOT NULL COMMENT 'File extension (.pdf, .docx, etc)',
  mime_type VARCHAR(100) NOT NULL COMMENT 'MIME type (application/pdf, etc)',
  size_bytes BIGINT NOT NULL COMMENT 'File size in bytes',
  storage_path VARCHAR(500) NOT NULL COMMENT 'Absolute or relative path to file on disk',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_files (user_id, uploaded_at DESC) COMMENT 'Pagination with newest first'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File metadata with ownership isolation';

-- ============================================================================
-- Success message
-- ============================================================================
SELECT 'Database erp_aero initialized successfully!' AS message;
SELECT 'Tables created: users, sessions, files' AS info;
