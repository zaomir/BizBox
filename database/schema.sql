-- BizBox Database Schema

CREATE DATABASE IF NOT EXISTS direco_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE direco_com;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_ru VARCHAR(255),
  name_uk VARCHAR(255),
  name_en VARCHAR(255),
  name_es VARCHAR(255),
  description_ru TEXT,
  description_uk TEXT,
  description_en TEXT,
  description_es TEXT,
  niche VARCHAR(100),
  price_usd INT,
  average_monthly_income INT,
  roi_percentage INT,
  setup_time_days INT,
  image_url VARCHAR(500),
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  country VARCHAR(100),
  language VARCHAR(10),
  readiness_score INT,
  stage_category VARCHAR(50),
  recommended_product_id INT,
  business_experience ENUM('none', 'some', 'experienced'),
  budget_range VARCHAR(50),
  urgency ENUM('high', 'medium', 'low'),
  conversation_json LONGTEXT,
  status ENUM('new', 'contacted', 'qualified', 'demo_scheduled', 'converted'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  company_name VARCHAR(255),
  country VARCHAR(100),
  language VARCHAR(10),
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  price_paid INT,
  currency VARCHAR(10),
  payment_date DATETIME,
  stripe_customer_id VARCHAR(255),
  stripe_payment_id VARCHAR(255),
  status ENUM('active', 'inactive', 'churned'),
  onboarding_status ENUM('started', 'in_progress', '30_day_check', 'completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title_ru VARCHAR(255),
  title_uk VARCHAR(255),
  title_en VARCHAR(255),
  title_es VARCHAR(255),
  client_name VARCHAR(255),
  niche VARCHAR(100),
  initial_investment INT,
  revenue_month_6 INT,
  profit_monthly INT,
  roi_percentage INT,
  testimonial_ru TEXT,
  testimonial_uk TEXT,
  testimonial_en TEXT,
  testimonial_es TEXT,
  rating INT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_featured (featured)
);

-- Create Indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_cases_niche ON cases(niche);
