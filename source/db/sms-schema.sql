-- Run explicitly against the application database before enabling SMS.
-- These tables do not modify or delete existing registrants or guardians.
CREATE TABLE IF NOT EXISTS sms_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sms_consent (
  phone VARCHAR(16) PRIMARY KEY,
  consented BOOLEAN NOT NULL DEFAULT FALSE,
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  consented_at DATETIME NULL,
  disclosure VARCHAR(500) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sms_enrollments (
  event_id INT NOT NULL,
  registrant_id INT NOT NULL,
  guardian_id INT NOT NULL,
  PRIMARY KEY (event_id, registrant_id),
  INDEX (registrant_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sms_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id INT NULL,
  registrant_id INT NOT NULL,
  guardian_id INT NOT NULL,
  phone VARCHAR(16) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'queued',
  provider_sid VARCHAR(64) NULL UNIQUE,
  error_detail VARCHAR(255) NULL,
  automatic_key VARCHAR(100) NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status, scheduled_at),
  INDEX (registrant_id, created_at)
) ENGINE=InnoDB;