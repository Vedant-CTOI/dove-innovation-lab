/** Mock data shared across all three spikes — represents the newsroom session. */

export interface Team {
  id: string;
  name: string;
  members: number;
  blurb: string;
}

export const TEAMS: Team[] = [
  { id: "alpha", name: "Team Alpha", members: 8, blurb: "Product & Strategy" },
  { id: "aurora", name: "Team Aurora", members: 12, blurb: "Design & Brand" },
  { id: "forge", name: "Team Forge", members: 6, blurb: "Engineering" },
  { id: "nimbus", name: "Team Nimbus", members: 10, blurb: "Cloud & Infra" },
  { id: "quartz", name: "Team Quartz", members: 9, blurb: "Data & ML" },
  { id: "sable", name: "Team Sable", members: 7, blurb: "Research" },
];

export interface Idea {
  id: string;
  title: string;
  author: string;
  team: string;
  votes: number;
  shortlisted: boolean;
  body: string;
  timestamp: string;
}

export const IDEAS: Idea[] = [
  {
    id: "i-001",
    title: "Real-time co-pilot for incident triage",
    author: "Priya M.",
    team: "Forge",
    votes: 14,
    shortlisted: true,
    body: "An AI agent that joins the incident channel, reads the timeline, and drafts a severity assessment within 30 seconds of page.",
    timestamp: "2m ago",
  },
  {
    id: "i-002",
    title: "Workshop roulette — pair people across teams",
    author: "Léon C.",
    team: "Aurora",
    votes: 11,
    shortlisted: true,
    body: "Every Friday, randomly pair one person from each team for a 30-min cross-pollination call. Track the connections made.",
    timestamp: "5m ago",
  },
  {
    id: "i-003",
    title: "Feature flag tombstones — show what was removed",
    author: "Sasha K.",
    team: "Nimbus",
    votes: 8,
    shortlisted: false,
    body: "When a flag kills a UI element, leave a one-line tombstone in its place with a link to the AAR. Reduces user confusion.",
    timestamp: "12m ago",
  },
  {
    id: "i-004",
    title: "Onboarding maze — gamify the first week",
    author: "Diego R.",
    team: "Aurora",
    votes: 6,
    shortlisted: false,
    body: "A nonlinear onboarding path where new hires unlock access to tools by completing small quests with their buddy.",
    timestamp: "18m ago",
  },
  {
    id: "i-005",
    title: "Decision log as a first-class artifact",
    author: "Mira J.",
    team: "Sable",
    votes: 5,
    shortlisted: false,
    body: "Every major decision gets a 3-block entry: context, decision, consequences. Searchable. Linked from PRs.",
    timestamp: "25m ago",
  },
];

export interface Presence {
  name: string;
  team: string;
  status: "active" | "idle" | "typing";
}

export const PRESENCE: Presence[] = [
  { name: "Priya M.", team: "Forge", status: "typing" },
  { name: "Léon C.", team: "Aurora", status: "active" },
  { name: "Sasha K.", team: "Nimbus", status: "active" },
  { name: "Diego R.", team: "Aurora", status: "idle" },
  { name: "Mira J.", team: "Sable", status: "active" },
  { name: "Tom B.", team: "Quartz", status: "idle" },
];

export const NEWSROOM_PHASE = "Ideation";
export const TIMER_REMAINING = "04:12";
export const TOTAL_PARTICIPANTS = 52;
