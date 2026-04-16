-- ProjectFlow Schema
-- Run this in Supabase: Dashboard → SQL Editor → paste and run

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'on-hold', 'completed')),
  start_date date,
  end_date date,
  owner text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  goals text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  created_at timestamptz default now()
);

-- Stakeholders
create table if not exists stakeholders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  role text,
  email text,
  influence text default 'medium' check (influence in ('high', 'medium', 'low')),
  interest text default 'medium' check (interest in ('high', 'medium', 'low')),
  created_at timestamptz default now()
);

-- Milestones
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  due_date date,
  status text default 'upcoming' check (status in ('upcoming', 'in-progress', 'completed', 'delayed')),
  created_at timestamptz default now()
);

-- Risks
create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  level text not null default 'medium' check (level in ('low', 'medium', 'high', 'critical')),
  probability text default 'medium' check (probability in ('low', 'medium', 'high')),
  impact text default 'medium' check (impact in ('low', 'medium', 'high')),
  mitigation text,
  owner text,
  status text default 'open' check (status in ('open', 'mitigated', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'done', 'blocked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee text,
  due_date date,
  tags text[] default '{}',
  jira_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspace docs
create table if not exists workspace_docs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text not null check (type in ('project-overview', 'stakeholder-map', 'risk-log', 'action-plan')),
  title text not null,
  content text default '',
  last_updated timestamptz default now()
);

-- Dependencies
create table if not exists dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  type text default 'internal' check (type in ('internal', 'external')),
  status text default 'pending' check (status in ('pending', 'resolved', 'blocked')),
  created_at timestamptz default now()
);

-- Iterations
create table if not exists iterations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  number integer not null,
  title text not null,
  start_date date,
  end_date date,
  status text default 'planning' check (status in ('planning', 'active', 'completed')),
  what_is_off text[] default '{}',
  refinements text[] default '{}',
  improvements text[] default '{}',
  created_at timestamptz default now()
);

-- Templates
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('stakeholder', 'planning', 'risk', 'communication', 'review')),
  prompt text not null,
  created_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

create trigger risks_updated_at before update on risks
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

-- Disable RLS for now (enable and add policies when you add auth)
alter table projects disable row level security;
alter table team_members disable row level security;
alter table stakeholders disable row level security;
alter table milestones disable row level security;
alter table risks disable row level security;
alter table tasks disable row level security;
alter table workspace_docs disable row level security;
alter table dependencies disable row level security;
alter table iterations disable row level security;
alter table templates disable row level security;
