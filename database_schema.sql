-- Active: 1779794660115@@127.0.0.1@3306@tms_db
-- Database Schema for KAHE Task Management System

CREATE DATABASE IF NOT EXISTS tms_db;
USE tms_db;

-- Core tables are managed by Django Migrations, but here is a representation

-- Users table
-- id, username, password, email, role, department_id, ...

-- Roles: ADMIN, DEAN, HOD, FACULTY

-- Departments
-- id, name, description

-- Tasks (Created by Dean)
-- id, title, description, created_by_id, assigned_to_hod_id, deadline, priority, status, created_at, updated_at

-- SubTasks (Created by HOD)
-- id, task_id, title, description, assigned_to_id, status, progress, deadline

-- Submissions
-- id, task_id, subtask_id, submitted_by_id, content, attachment, submitted_at, feedback, is_approved

-- Notifications
-- id, user_id, message, is_read, created_at

-- Seed Initial Data (Conceptual)
INSERT INTO core_department (name, description) VALUES ('Computer Science', 'Dept of CS');
INSERT INTO core_department (name, description) VALUES ('Information Technology', 'Dept of IT');

-- Note: Passwords must be hashed using Django's PBKDF2
-- Dean: dean@kahe.edu / admin123
-- HOD: hod@kahe.edu / admin123
-- Faculty: faculty@kahe.edu / admin123
