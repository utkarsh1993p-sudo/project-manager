-- Migration: deadline_responses table for AI extension audit trail
-- Run in Supabase Dashboard → SQL Editor

create table if not exists deadline_responses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  stakeholder_email text not null,
  action text not null check (action in ('confirm', 'blocked', 'extend_approved', 'extend_rejected')),
  reason text,
  proposed_date date,
  ai_reasoning text,
  ai_approved boolean,
  created_at timestamptz default now()
);

create index if not exists deadline_responses_task_id_idx on deadline_responses(task_id);
create index if not exists deadline_responses_project_id_idx on deadline_responses(project_id);
