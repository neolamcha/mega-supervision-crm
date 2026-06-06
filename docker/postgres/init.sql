-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure database exists
SELECT 'CREATE DATABASE mega_supervision' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mega_supervision')\gexec

-- Note: Tables will be created by TypeORM migrations
-- This file is for any additional initialization
