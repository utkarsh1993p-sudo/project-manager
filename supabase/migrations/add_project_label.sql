-- Add project_label column to projects table
-- Run this in the Supabase SQL editor

alter table projects
  add column if not exists project_label text;

-- Unique constraint (partial — only on non-null values)
create unique index if not exists projects_project_label_unique
  on projects (project_label)
  where project_label is not null;
