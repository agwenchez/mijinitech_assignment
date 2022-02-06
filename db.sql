CREATE TABLE drones(
 serial_number VARCHAR(100) PRIMARY KEY,
 model VARCHAR(50) NOT NULL,
 weight_limit VARCHAR(5) NOT NULL,
 battery_capacity VARCHAR(5) NOT NULL,
 state VARCHAR(255) NOT NULL
);
