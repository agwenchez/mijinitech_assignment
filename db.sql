
CREATE TABLE drones(
 serial_number VARCHAR(100) PRIMARY KEY,
 model VARCHAR(50) NOT NULL,
 weight_limit VARCHAR(10) NOT NULL,
 battery_capacity VARCHAR(10) NOT NULL,
 state VARCHAR(255) NOT NULL
);


CREATE TABLE medications(
 name VARCHAR(100) NOT NULL,
 weight VARCHAR(10) NOT NULL,
 code VARCHAR(50) PRIMARY KEY,
 image BYTEA NOT NULL,
 drone VARCHAR(100) REFERENCES drones ON DELETE CASCADE ON UPDATE CASCADE
);
