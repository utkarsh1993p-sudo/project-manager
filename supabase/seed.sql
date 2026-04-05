-- Seed data — run AFTER schema.sql
-- ProjectFlow sample data

-- Projects
insert into projects (id, name, description, status, start_date, end_date, owner, progress, goals) values
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Product Launch Q2',
  'Launch the new mobile app to market with full marketing campaign and support readiness.',
  'active',
  '2026-03-01',
  '2026-06-30',
  'Utkarsh Pandey',
  42,
  array[
    'Launch app on iOS and Android by June 30',
    'Achieve 10,000 downloads in first month',
    'Onboard 3 enterprise pilot customers',
    'Achieve 4.5+ App Store rating'
  ]
),
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Infrastructure Migration',
  'Migrate all services from on-premise to AWS cloud infrastructure.',
  'planning',
  '2026-05-01',
  '2026-09-30',
  'Utkarsh Pandey',
  8,
  array[
    'Migrate 100% of services to AWS by September 30',
    'Zero downtime during migration',
    '30% reduction in infrastructure costs',
    'SOC 2 compliance maintained throughout'
  ]
);

-- Team members (Project 1)
insert into team_members (project_id, name, email, role) values
('a1b2c3d4-0001-0001-0001-000000000001', 'Utkarsh Pandey', 'utkarsh@example.com', 'admin'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Priya Sharma', 'priya@example.com', 'member'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Rahul Mehta', 'rahul@example.com', 'member'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Aisha Khan', 'aisha@example.com', 'viewer'),
-- Team members (Project 2)
('a1b2c3d4-0002-0002-0002-000000000002', 'Utkarsh Pandey', 'utkarsh@example.com', 'admin'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Rahul Mehta', 'rahul@example.com', 'member');

-- Stakeholders (Project 1)
insert into stakeholders (project_id, name, role, email, influence, interest) values
('a1b2c3d4-0001-0001-0001-000000000001', 'CEO', 'Executive Sponsor', 'ceo@example.com', 'high', 'high'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Marketing Head', 'Marketing Lead', 'marketing@example.com', 'high', 'high'),
('a1b2c3d4-0001-0001-0001-000000000001', 'CTO', 'Technical Advisor', 'cto@example.com', 'high', 'medium'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Customer Success', 'User Feedback', 'cs@example.com', 'medium', 'high'),
-- Stakeholders (Project 2)
('a1b2c3d4-0002-0002-0002-000000000002', 'CTO', 'Project Sponsor', 'cto@example.com', 'high', 'high');

-- Milestones (Project 1)
insert into milestones (project_id, title, due_date, status) values
('a1b2c3d4-0001-0001-0001-000000000001', 'Beta Release', '2026-04-15', 'completed'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Marketing Campaign Launch', '2026-05-01', 'in-progress'),
('a1b2c3d4-0001-0001-0001-000000000001', 'App Store Submission', '2026-05-20', 'upcoming'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Public Launch', '2026-06-30', 'upcoming'),
-- Milestones (Project 2)
('a1b2c3d4-0002-0002-0002-000000000002', 'Architecture Design', '2026-05-15', 'in-progress'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Non-critical Services Migrated', '2026-07-01', 'upcoming'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Full Migration Complete', '2026-09-30', 'upcoming');

-- Risks (Project 1)
insert into risks (project_id, title, description, level, probability, impact, mitigation, owner, status) values
('a1b2c3d4-0001-0001-0001-000000000001', 'App Store Rejection', 'Apple may reject the app due to compliance issues', 'high', 'medium', 'high', 'Pre-review with App Store guidelines, legal review of all permissions', 'Rahul Mehta', 'open'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Backend Scaling', 'Backend may not handle launch traffic spike', 'medium', 'medium', 'medium', 'Load testing, auto-scaling configured, CDN in place', 'Rahul Mehta', 'mitigated'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Marketing Budget Cut', 'Budget reduction could reduce campaign reach', 'low', 'low', 'medium', 'Identify organic channels and partnerships as backup', 'Priya Sharma', 'open'),
-- Risks (Project 2)
('a1b2c3d4-0002-0002-0002-000000000002', 'Data Loss During Migration', 'Risk of data corruption during transfer', 'critical', 'low', 'high', 'Full backups, staged migration, rollback plan in place', 'Rahul Mehta', 'open');

-- Tasks (Project 1)
insert into tasks (project_id, title, status, priority, assignee, due_date, tags) values
('a1b2c3d4-0001-0001-0001-000000000001', 'Finalize app icon and splash screen', 'done', 'high', 'Priya Sharma', '2026-04-10', array['design']),
('a1b2c3d4-0001-0001-0001-000000000001', 'Write App Store description', 'in-progress', 'high', 'Priya Sharma', '2026-04-20', array['marketing']),
('a1b2c3d4-0001-0001-0001-000000000001', 'Fix crash on Android 12', 'in-progress', 'urgent', 'Rahul Mehta', '2026-04-12', array['bug', 'android']),
('a1b2c3d4-0001-0001-0001-000000000001', 'Set up analytics dashboard', 'todo', 'medium', 'Rahul Mehta', '2026-05-01', array['analytics']),
('a1b2c3d4-0001-0001-0001-000000000001', 'Prepare press kit', 'review', 'medium', 'Priya Sharma', '2026-04-25', array['marketing']),
('a1b2c3d4-0001-0001-0001-000000000001', 'Create onboarding tutorial', 'todo', 'high', 'Aisha Khan', '2026-05-10', array['ux']),
-- Tasks (Project 2)
('a1b2c3d4-0002-0002-0002-000000000002', 'Inventory all services', 'done', 'high', 'Rahul Mehta', '2026-05-05', array[]::text[]),
('a1b2c3d4-0002-0002-0002-000000000002', 'Design AWS architecture', 'in-progress', 'urgent', 'Rahul Mehta', '2026-05-15', array[]::text[]);

-- Workspace docs (Project 1)
insert into workspace_docs (project_id, type, title, content, last_updated) values
('a1b2c3d4-0001-0001-0001-000000000001', 'project-overview', 'Project Overview',
'# Product Launch Q2 — Project Overview

## Objective
Launch the new mobile app to market with a complete marketing campaign and support readiness by June 30, 2026.

## Scope
- iOS and Android app release
- Marketing campaign (social, PR, email)
- Enterprise pilot onboarding (3 customers)
- Customer support training

## Out of Scope
- Web app version
- International markets (Phase 2)

## Success Criteria
- 10,000 downloads in 30 days
- 4.5+ App Store rating
- 3 enterprise pilots live
- Zero P0 bugs at launch',
'2026-04-01'),
('a1b2c3d4-0001-0001-0001-000000000001', 'stakeholder-map', 'Stakeholder Map',
'# Stakeholder Map

## High Influence / High Interest
- **CEO** — Executive sponsor, weekly updates required
- **Marketing Head** — Owns campaign, daily sync needed

## High Influence / Medium Interest
- **CTO** — Technical sign-off required for launch

## Medium Influence / High Interest
- **Customer Success** — Needs training materials by May 15',
'2026-03-28'),
('a1b2c3d4-0001-0001-0001-000000000001', 'risk-log', 'Risk Log',
'# Risk Log

## R1: App Store Rejection — HIGH
- **Probability**: Medium | **Impact**: High
- **Mitigation**: Pre-review against App Store guidelines, legal review
- **Owner**: Rahul Mehta | **Status**: Open

## R2: Backend Scaling — MEDIUM
- **Mitigation**: Load testing done, auto-scaling configured
- **Owner**: Rahul Mehta | **Status**: Mitigated',
'2026-04-02'),
('a1b2c3d4-0001-0001-0001-000000000001', 'action-plan', 'Action Plan',
'# Action Plan

## April 2026
- [ ] Fix Android 12 crash (due Apr 12) — Rahul
- [ ] Finalize App Store description (due Apr 20) — Priya
- [ ] Complete press kit review (due Apr 25) — Priya

## May 2026
- [ ] Launch marketing campaign (May 1)
- [ ] App store submission (May 20) — Rahul
- [ ] Create onboarding tutorial (May 10) — Aisha

## June 2026
- [ ] Final QA pass (Jun 1–14)
- [ ] Public launch (Jun 30)',
'2026-04-03');

-- Templates (shared across projects)
insert into templates (project_id, name, description, category, prompt) values
('a1b2c3d4-0001-0001-0001-000000000001', 'Stakeholder Update Email', 'Draft a stakeholder update for project milestones', 'stakeholder', 'Draft a stakeholder update email for [PROJECT NAME]. We completed [MILESTONE] on [DATE]. Next steps include [NEXT STEPS]. Key risks are [RISKS].'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Executive Summary', 'Prepare a concise executive summary', 'planning', 'Prepare an executive summary for [PROJECT]. Status: [STATUS]. Budget: [BUDGET]. Timeline: [TIMELINE]. Key decisions needed: [DECISIONS].'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Risk Assessment', 'Evaluate and document project risks', 'risk', 'Assess risks for [PROJECT PHASE]. Consider technical, resource, timeline, and external risks. Rate each by probability and impact. Suggest mitigations.'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Scope Breakdown', 'Break down project scope into deliverables', 'planning', 'Break down the scope for [FEATURE/PHASE] into deliverables. Define acceptance criteria, dependencies, and effort estimates for each.'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Pushback Simulator', 'Simulate stakeholder objections to prepare responses', 'communication', 'Simulate pushback from [STAKEHOLDER TYPE] on [PROPOSAL]. What are their likely concerns? How should I respond to each objection?'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Retrospective Analysis', 'Identify what''s off and how to improve', 'review', 'Analyze our progress on [PROJECT/PHASE]. What''s off track? What caused it? What should we refine? What direction changes are needed?');
