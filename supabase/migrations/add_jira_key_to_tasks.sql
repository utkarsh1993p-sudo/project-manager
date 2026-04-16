-- Migration: add jira_key column to tasks
-- Run this in Supabase: Dashboard → SQL Editor → paste and run
alter table tasks add column if not exists jira_key text;
