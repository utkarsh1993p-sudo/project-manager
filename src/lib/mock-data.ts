import type { Project, WorkflowTemplate } from "@/types";

export const MOCK_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "t1",
    name: "Stakeholder Update Email",
    description: "Draft a stakeholder update for project milestones",
    category: "stakeholder",
    prompt:
      "Draft a stakeholder update email for [PROJECT NAME]. We completed [MILESTONE] on [DATE]. Next steps include [NEXT STEPS]. Key risks are [RISKS].",
  },
  {
    id: "t2",
    name: "Executive Summary",
    description: "Prepare a concise executive summary",
    category: "planning",
    prompt:
      "Prepare an executive summary for [PROJECT]. Status: [STATUS]. Budget: [BUDGET]. Timeline: [TIMELINE]. Key decisions needed: [DECISIONS].",
  },
  {
    id: "t3",
    name: "Risk Assessment",
    description: "Evaluate and document project risks",
    category: "risk",
    prompt:
      "Assess risks for [PROJECT PHASE]. Consider technical, resource, timeline, and external risks. Rate each by probability and impact. Suggest mitigations.",
  },
  {
    id: "t4",
    name: "Scope Breakdown",
    description: "Break down project scope into deliverables",
    category: "planning",
    prompt:
      "Break down the scope for [FEATURE/PHASE] into deliverables. Define acceptance criteria, dependencies, and effort estimates for each.",
  },
  {
    id: "t5",
    name: "Pushback Simulator",
    description: "Simulate stakeholder objections to prepare responses",
    category: "communication",
    prompt:
      "Simulate pushback from [STAKEHOLDER TYPE] on [PROPOSAL]. What are their likely concerns? How should I respond to each objection?",
  },
  {
    id: "t6",
    name: "Retrospective Analysis",
    description: "Identify what's off and how to improve",
    category: "review",
    prompt:
      "Analyze our progress on [PROJECT/PHASE]. What's off track? What caused it? What should we refine? What direction changes are needed?",
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Product Launch Q2",
    description:
      "Launch the new mobile app to market with full marketing campaign and support readiness.",
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    owner: "Utkarsh Pandey",
    progress: 42,
    goals: [
      "Launch app on iOS and Android by June 30",
      "Achieve 10,000 downloads in first month",
      "Onboard 3 enterprise pilot customers",
      "Achieve 4.5+ App Store rating",
    ],
    team: [
      {
        id: "u1",
        name: "Utkarsh Pandey",
        email: "utkarsh@example.com",
        role: "admin",
      },
      {
        id: "u2",
        name: "Priya Sharma",
        email: "priya@example.com",
        role: "member",
      },
      {
        id: "u3",
        name: "Rahul Mehta",
        email: "rahul@example.com",
        role: "member",
      },
      {
        id: "u4",
        name: "Aisha Khan",
        email: "aisha@example.com",
        role: "viewer",
      },
    ],
    stakeholders: [
      {
        id: "s1",
        name: "CEO",
        role: "Executive Sponsor",
        email: "ceo@example.com",
        influence: "high",
        interest: "high",
      },
      {
        id: "s2",
        name: "Marketing Head",
        role: "Marketing Lead",
        email: "marketing@example.com",
        influence: "high",
        interest: "high",
      },
      {
        id: "s3",
        name: "CTO",
        role: "Technical Advisor",
        email: "cto@example.com",
        influence: "high",
        interest: "medium",
      },
      {
        id: "s4",
        name: "Customer Success",
        role: "User Feedback",
        email: "cs@example.com",
        influence: "medium",
        interest: "high",
      },
    ],
    timeline: [
      {
        id: "m1",
        title: "Beta Release",
        dueDate: "2026-04-15",
        status: "completed",
      },
      {
        id: "m2",
        title: "Marketing Campaign Launch",
        dueDate: "2026-05-01",
        status: "in-progress",
      },
      {
        id: "m3",
        title: "App Store Submission",
        dueDate: "2026-05-20",
        status: "upcoming",
      },
      {
        id: "m4",
        title: "Public Launch",
        dueDate: "2026-06-30",
        status: "upcoming",
      },
    ],
    risks: [
      {
        id: "r1",
        title: "App Store Rejection",
        description: "Apple may reject the app due to compliance issues",
        level: "high",
        probability: "medium",
        impact: "high",
        mitigation:
          "Pre-review with App Store guidelines, legal review of all permissions",
        owner: "Rahul Mehta",
        status: "open",
      },
      {
        id: "r2",
        title: "Backend Scaling",
        description: "Backend may not handle launch traffic spike",
        level: "medium",
        probability: "medium",
        impact: "medium",
        mitigation: "Load testing, auto-scaling configured, CDN in place",
        owner: "Rahul Mehta",
        status: "mitigated",
      },
      {
        id: "r3",
        title: "Marketing Budget Cut",
        description: "Budget reduction could reduce campaign reach",
        level: "low",
        probability: "low",
        impact: "medium",
        mitigation: "Identify organic channels and partnerships as backup",
        owner: "Priya Sharma",
        status: "open",
      },
    ],
    tasks: [
      {
        id: "tk1",
        title: "Finalize app icon and splash screen",
        status: "done",
        priority: "high",
        assignee: "Priya Sharma",
        dueDate: "2026-04-10",
        tags: ["design"],
      },
      {
        id: "tk2",
        title: "Write App Store description",
        status: "in-progress",
        priority: "high",
        assignee: "Priya Sharma",
        dueDate: "2026-04-20",
        tags: ["marketing"],
      },
      {
        id: "tk3",
        title: "Fix crash on Android 12",
        status: "in-progress",
        priority: "urgent",
        assignee: "Rahul Mehta",
        dueDate: "2026-04-12",
        tags: ["bug", "android"],
      },
      {
        id: "tk4",
        title: "Set up analytics dashboard",
        status: "todo",
        priority: "medium",
        assignee: "Rahul Mehta",
        dueDate: "2026-05-01",
        tags: ["analytics"],
      },
      {
        id: "tk5",
        title: "Prepare press kit",
        status: "review",
        priority: "medium",
        assignee: "Priya Sharma",
        dueDate: "2026-04-25",
        tags: ["marketing"],
      },
      {
        id: "tk6",
        title: "Create onboarding tutorial",
        status: "todo",
        priority: "high",
        assignee: "Aisha Khan",
        dueDate: "2026-05-10",
        tags: ["ux"],
      },
    ],
    workspaceDocs: [
      {
        id: "wd1",
        type: "project-overview",
        title: "Project Overview",
        content: `# Product Launch Q2 — Project Overview

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
- Zero P0 bugs at launch`,
        lastUpdated: "2026-04-01",
      },
      {
        id: "wd2",
        type: "stakeholder-map",
        title: "Stakeholder Map",
        content: `# Stakeholder Map

## High Influence / High Interest
- **CEO** — Executive sponsor, weekly updates required
- **Marketing Head** — Owns campaign, daily sync needed

## High Influence / Medium Interest
- **CTO** — Technical sign-off required for launch

## Medium Influence / High Interest
- **Customer Success** — Needs training materials by May 15

## Communication Plan
| Stakeholder | Frequency | Channel | Format |
|-------------|-----------|---------|--------|
| CEO | Weekly | Email | Executive Summary |
| Marketing Head | Daily | Slack | Status Update |
| CTO | Bi-weekly | Meeting | Tech Review |
| Customer Success | Weekly | Email | Progress Report |`,
        lastUpdated: "2026-03-28",
      },
      {
        id: "wd3",
        type: "risk-log",
        title: "Risk Log",
        content: `# Risk Log

## Active Risks

### R1: App Store Rejection — HIGH
- **Probability**: Medium | **Impact**: High
- **Description**: Apple may reject due to permission/compliance issues
- **Mitigation**: Pre-review against App Store guidelines, legal review
- **Owner**: Rahul Mehta | **Status**: Open

### R2: Backend Scaling — MEDIUM
- **Probability**: Medium | **Impact**: Medium
- **Description**: Backend may fail under launch traffic
- **Mitigation**: Load testing done, auto-scaling configured
- **Owner**: Rahul Mehta | **Status**: Mitigated

### R3: Marketing Budget Cut — LOW
- **Probability**: Low | **Impact**: Medium
- **Description**: Budget reduction could limit campaign reach
- **Mitigation**: Organic channels and partnerships as backup
- **Owner**: Priya Sharma | **Status**: Open`,
        lastUpdated: "2026-04-02",
      },
      {
        id: "wd4",
        type: "action-plan",
        title: "Action Plan",
        content: `# Action Plan

## April 2026
- [ ] Fix Android 12 crash (due Apr 12) — Rahul
- [ ] Finalize App Store description (due Apr 20) — Priya
- [ ] Complete press kit review (due Apr 25) — Priya
- [ ] Submit for legal review (due Apr 28) — Utkarsh

## May 2026
- [ ] Launch marketing campaign (May 1) — Marketing
- [ ] Complete app store submission (May 20) — Rahul
- [ ] Set up analytics (May 1) — Rahul
- [ ] Create onboarding tutorial (May 10) — Aisha
- [ ] Customer Success training (May 15) — Utkarsh

## June 2026
- [ ] Final QA pass (Jun 1–14) — Rahul
- [ ] Soft launch to beta users (Jun 20) — All
- [ ] Public launch (Jun 30) — All`,
        lastUpdated: "2026-04-03",
      },
    ],
    dependencies: [
      {
        id: "d1",
        title: "Legal review of app permissions",
        type: "internal",
        status: "pending",
        description: "Legal team must approve data collection permissions",
      },
      {
        id: "d2",
        title: "App Store developer account",
        type: "external",
        status: "resolved",
        description: "Apple developer account enrollment completed",
      },
      {
        id: "d3",
        title: "Payment gateway integration",
        type: "external",
        status: "pending",
        description: "Stripe integration pending final API keys from finance",
      },
    ],
    iterations: [
      {
        id: "i1",
        number: 1,
        title: "Beta Feedback Round",
        startDate: "2026-04-01",
        endDate: "2026-04-15",
        status: "completed",
        whatIsOff: [
          "Onboarding flow too long (6 steps)",
          "Push notifications not working on iOS 17",
        ],
        refinements: [
          "Reduced onboarding to 3 steps",
          "Fixed iOS notification entitlements",
        ],
        improvements: [
          "Added skip option for onboarding",
          "Improved load time by 40%",
        ],
      },
      {
        id: "i2",
        number: 2,
        title: "Pre-Launch Polish",
        startDate: "2026-04-16",
        endDate: "2026-04-30",
        status: "active",
        whatIsOff: ["Android crash on specific devices", "App icon not crisp"],
        refinements: [],
        improvements: [],
      },
    ],
    templates: MOCK_TEMPLATES,
  },
  {
    id: "p2",
    name: "Infrastructure Migration",
    description:
      "Migrate all services from on-premise to AWS cloud infrastructure.",
    status: "planning",
    startDate: "2026-05-01",
    endDate: "2026-09-30",
    owner: "Utkarsh Pandey",
    progress: 8,
    goals: [
      "Migrate 100% of services to AWS by September 30",
      "Zero downtime during migration",
      "30% reduction in infrastructure costs",
      "SOC 2 compliance maintained throughout",
    ],
    team: [
      {
        id: "u1",
        name: "Utkarsh Pandey",
        email: "utkarsh@example.com",
        role: "admin",
      },
      {
        id: "u3",
        name: "Rahul Mehta",
        email: "rahul@example.com",
        role: "member",
      },
    ],
    stakeholders: [
      {
        id: "s3",
        name: "CTO",
        role: "Project Sponsor",
        email: "cto@example.com",
        influence: "high",
        interest: "high",
      },
    ],
    timeline: [
      {
        id: "m1",
        title: "Architecture Design",
        dueDate: "2026-05-15",
        status: "in-progress",
      },
      {
        id: "m2",
        title: "Non-critical Services Migrated",
        dueDate: "2026-07-01",
        status: "upcoming",
      },
      {
        id: "m3",
        title: "Full Migration Complete",
        dueDate: "2026-09-30",
        status: "upcoming",
      },
    ],
    risks: [
      {
        id: "r1",
        title: "Data Loss During Migration",
        description: "Risk of data corruption during transfer",
        level: "critical",
        probability: "low",
        impact: "high",
        mitigation: "Full backups, staged migration, rollback plan in place",
        owner: "Rahul Mehta",
        status: "open",
      },
    ],
    tasks: [
      {
        id: "tk1",
        title: "Inventory all services",
        status: "done",
        priority: "high",
        assignee: "Rahul Mehta",
        dueDate: "2026-05-05",
      },
      {
        id: "tk2",
        title: "Design AWS architecture",
        status: "in-progress",
        priority: "urgent",
        assignee: "Rahul Mehta",
        dueDate: "2026-05-15",
      },
    ],
    workspaceDocs: [
      {
        id: "wd1",
        type: "project-overview",
        title: "Project Overview",
        content: `# Infrastructure Migration — Project Overview

## Objective
Migrate all on-premise services to AWS by September 30, 2026.

## Approach
Phased migration: non-critical → staging → production services`,
        lastUpdated: "2026-04-01",
      },
      {
        id: "wd2",
        type: "stakeholder-map",
        title: "Stakeholder Map",
        content: `# Stakeholder Map\n\n## CTO — High Influence / High Interest\nWeekly updates, technical sign-off required.`,
        lastUpdated: "2026-04-01",
      },
      {
        id: "wd3",
        type: "risk-log",
        title: "Risk Log",
        content: `# Risk Log\n\n## R1: Data Loss — CRITICAL\n- Mitigation: Full backups, rollback plan`,
        lastUpdated: "2026-04-01",
      },
      {
        id: "wd4",
        type: "action-plan",
        title: "Action Plan",
        content: `# Action Plan\n\n## May 2026\n- [x] Inventory all services\n- [ ] Design AWS architecture (May 15)`,
        lastUpdated: "2026-04-01",
      },
    ],
    dependencies: [],
    iterations: [],
    templates: MOCK_TEMPLATES,
  },
];
