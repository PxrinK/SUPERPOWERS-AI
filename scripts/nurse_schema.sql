-- ==========================================
-- ระบบจัดการข้อมูลพยาบาล (Nurse Management System)
-- ==========================================

CREATE TABLE hospital_departments (
    department_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(50),
    floor INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nurses (
    nurse_id VARCHAR(20) PRIMARY KEY,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(20) REFERENCES hospital_departments(department_id),
    position VARCHAR(50) DEFAULT 'Staff Nurse',
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nurse_shifts (
    shift_id SERIAL PRIMARY KEY,
    nurse_id VARCHAR(20) REFERENCES nurses(nurse_id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT')),
    ward_room VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nurses_department ON nurses(department_id);
CREATE INDEX idx_nurse_shifts_date ON nurse_shifts(shift_date, nurse_id);