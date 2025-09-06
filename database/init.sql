-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE
    ON notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some initial data
INSERT INTO notes (title, content) VALUES 
    ('Welcome Note', 'Welcome to the Dockerized Notes App with PostgreSQL!'),
    ('Docker Compose', 'Successfully connected to PostgreSQL via Docker Compose'),
    ('Database Persistence', 'This note demonstrates data persistence with Docker volumes'),
    ('Multi-Container', 'Backend and Database running as separate containers, communicating via Docker network');

-- Display confirmation
SELECT COUNT(*) as note_count FROM notes;