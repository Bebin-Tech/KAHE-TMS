-- KAHE Task Management System - MySQL helper script
--
-- Django owns the application schema through migrations.
-- Use this file only to create/select the MySQL database and optionally seed
-- departments after migrations have created the tables.

CREATE DATABASE IF NOT EXISTS tms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tms_db;

-- Required Django setup after creating the database:
--
--   cd backend
--   set DB_ENGINE=mysql
--   set MYSQL_DATABASE=tms_db
--   set MYSQL_USER=root
--   set MYSQL_PASSWORD=your_mysql_password
--   set MYSQL_HOST=127.0.0.1
--   set MYSQL_PORT=3306
--   python manage.py migrate
--
-- Run this script again after migrations if you want the optional seed data.

SET @core_department_exists = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'core_department'
);

SET @seed_computer_science_sql = IF(
  @core_department_exists > 0,
  "INSERT INTO core_department (name, block_name, description, is_active)
   SELECT 'Computer Science', 'S-Block', 'Dept of CS', 1
   WHERE NOT EXISTS (
     SELECT 1 FROM core_department WHERE name = 'Computer Science'
   )",
  "SELECT 'core_department table does not exist yet. Run Django migrations first, then rerun this script for seed data.' AS message"
);

PREPARE seed_computer_science_stmt FROM @seed_computer_science_sql;
EXECUTE seed_computer_science_stmt;
DEALLOCATE PREPARE seed_computer_science_stmt;

SET @seed_information_technology_sql = IF(
  @core_department_exists > 0,
  "INSERT INTO core_department (name, block_name, description, is_active)
   SELECT 'Information Technology', 'S-Block', 'Dept of IT', 1
   WHERE NOT EXISTS (
     SELECT 1 FROM core_department WHERE name = 'Information Technology'
   )",
  "SELECT 'Seed skipped until migrations are complete.' AS message"
);

PREPARE seed_information_technology_stmt FROM @seed_information_technology_sql;
EXECUTE seed_information_technology_stmt;
DEALLOCATE PREPARE seed_information_technology_stmt;

-- Passwords must be created through Django so they are hashed correctly:
--
--   python manage.py createsuperuser
--
-- Or create users from the Admin User Management screen.
