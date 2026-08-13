"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ModuleId =
  | "home"
  | "jobs"
  | "profile"
  | "interviews"
  | "assessments"
  | "events"
  | "competitions"
  | "resume"
  | "help";

type ProfileSectionId =
  | "basic"
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "accomplishments";

type JobDetailTab = "description" | "workflow" | "eligibility";

interface JobProfile {
  id: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  positionType: string;
  posted: string;
  closes: string;
  ctc: string;
  category: string;
  description: string;
  requirements: string[];
}

interface ActivityItem {
  title: string;
  organization: string;
  meta: string;
  status: string;
  statusTone: "blue" | "green" | "amber" | "gray";
  description: string;
}

interface UploadedResume {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

const resumeApiBaseUrl = process.env.NEXT_PUBLIC_RESUME_API_URL ?? "http://localhost:3002";

const navigationItems: Array<{ id: ModuleId; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "jobs", label: "Job Profiles", icon: "▣" },
  { id: "profile", label: "My Profile", icon: "◎" },
  { id: "interviews", label: "Interviews", icon: "▱" },
  { id: "assessments", label: "Assessments", icon: "▤" },
  { id: "events", label: "Events", icon: "◇" },
  { id: "competitions", label: "Competitions", icon: "♧" },
  { id: "resume", label: "Resume", icon: "▧" },
];

const moduleTitles: Record<ModuleId, string> = {
  home: "Home",
  jobs: "Job Profiles",
  profile: "Profile",
  interviews: "Interviews",
  assessments: "Assessments",
  events: "Events",
  competitions: "Competitions",
  resume: "Resume",
  help: "Help Centre",
};

const profileSections: Array<{ id: ProfileSectionId; label: string }> = [
  { id: "basic", label: "Basic Details" },
  { id: "education", label: "Education Details" },
  { id: "experience", label: "Internship & Work Experience" },
  { id: "skills", label: "Skills, Subjects & Languages" },
  { id: "projects", label: "Projects" },
  { id: "accomplishments", label: "Accomplishments" },
];

const jobProfiles: JobProfile[] = [
  {
    id: "edralabs",
    title: "Engineer Intern",
    company: "Edra Labs",
    city: "Mumbai",
    sector: "Technology",
    positionType: "Internship",
    posted: "2 days ago",
    closes: "Closes in 3 days",
    ctc: "₹75,000 per month",
    category: "Elite",
    description:
      "Join a product engineering team building dependable tools for high-growth businesses. Interns work alongside senior engineers on production features, testing, and platform improvements.",
    requirements: ["CGPA 7.5 or above", "No active backlogs", "Computer, IT or EXTC branches"],
  },
  {
    id: "bnp",
    title: "Technology Hackathon",
    company: "BNP Paribas India",
    city: "Bengaluru · Chennai",
    sector: "Banking",
    positionType: "Full-time",
    posted: "2 days ago",
    closes: "Closes in 2 days",
    ctc: "₹14.5 LPA",
    category: "Dream",
    description:
      "A campus technology challenge that leads to software engineering interviews across digital banking, risk platforms, and data engineering teams.",
    requirements: ["CGPA 7.0 or above", "2026 graduating batch", "All engineering branches"],
  },
  {
    id: "blackrock",
    title: "Software Engineer / Aladdin Data",
    company: "BlackRock",
    city: "Gurugram · Mumbai",
    sector: "Fintech",
    positionType: "Full-time",
    posted: "3 days ago",
    closes: "Closes in 5 days",
    ctc: "₹22 LPA",
    category: "Super Dream",
    description:
      "Build and operate data products used by investment teams. The role combines software engineering, cloud platforms, data quality, and financial technology.",
    requirements: ["CGPA 8.0 or above", "Strong DSA fundamentals", "Computer and IT branches"],
  },
  {
    id: "versor",
    title: "Quantitative Developer",
    company: "Versor Investments",
    city: "Mumbai",
    sector: "Finance",
    positionType: "Full-time",
    posted: "4 days ago",
    closes: "Closes in 6 days",
    ctc: "₹19 LPA",
    category: "Dream",
    description:
      "Develop research infrastructure and data pipelines for systematic investing. Ideal for students who enjoy mathematics, algorithms, and high-quality software.",
    requirements: ["CGPA 8.0 or above", "Python or C++ proficiency", "All engineering branches"],
  },
  {
    id: "futures-first",
    title: "International Markets Intern",
    company: "Futures First",
    city: "Gurugram · Kolkata",
    sector: "Finance",
    positionType: "Internship",
    posted: "7 days ago",
    closes: "Closes tomorrow",
    ctc: "₹55,000 per month",
    category: "Elite",
    description:
      "Learn market analysis, risk management, and decision-making in a structured internship for analytically strong students.",
    requirements: ["CGPA 7.0 or above", "Strong analytical ability", "Open to all branches"],
  },
];

const activityPages: Record<"interviews" | "assessments" | "events" | "competitions", {
  eyebrow: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string }>;
  items: ActivityItem[];
}> = {
  interviews: {
    eyebrow: "Recruitment pipeline",
    title: "Interview Centre",
    description: "Track upcoming rounds, join scheduled interviews, and review outcomes in one place.",
    stats: [
      { label: "Upcoming", value: "2" },
      { label: "Completed", value: "7" },
      { label: "Shortlisted", value: "3" },
    ],
    items: [
      {
        title: "Technical Interview · Round 1",
        organization: "Edra Labs",
        meta: "12 August 2026 · 11:30 AM · Online",
        status: "Upcoming",
        statusTone: "blue",
        description: "45-minute technical discussion covering problem solving, projects, and engineering fundamentals.",
      },
      {
        title: "HR Discussion",
        organization: "BlackRock",
        meta: "15 August 2026 · 2:00 PM · Placement Cell",
        status: "Scheduled",
        statusTone: "amber",
        description: "Final culture and role-alignment conversation. Bring a printed resume and institute ID.",
      },
      {
        title: "Coding + Technical Round",
        organization: "CloudNova Systems",
        meta: "Completed on 2 August 2026",
        status: "Shortlisted",
        statusTone: "green",
        description: "Feedback released. You have advanced to the hiring-manager conversation.",
      },
    ],
  },
  assessments: {
    eyebrow: "Tests and evaluations",
    title: "Assessment Hub",
    description: "See assigned tests, deadlines, instructions, and scores from every active placement process.",
    stats: [
      { label: "Pending", value: "2" },
      { label: "Completed", value: "11" },
      { label: "Average score", value: "84%" },
    ],
    items: [
      {
        title: "Software Engineering Aptitude",
        organization: "Edra Labs",
        meta: "60 minutes · Opens 10 August at 9:00 AM",
        status: "Not started",
        statusTone: "blue",
        description: "Quantitative aptitude, logical reasoning, CS fundamentals, and two programming questions.",
      },
      {
        title: "Data Structures Challenge",
        organization: "BNP Paribas India",
        meta: "90 minutes · Due 11 August at 8:00 PM",
        status: "In progress",
        statusTone: "amber",
        description: "Three coding problems. Your latest autosaved attempt is available to continue.",
      },
      {
        title: "Quantitative Reasoning",
        organization: "Versor Investments",
        meta: "Completed on 4 August 2026 · Score 88/100",
        status: "Completed",
        statusTone: "green",
        description: "Your result meets the shortlisting threshold. Further updates will appear in Interviews.",
      },
    ],
  },
  events: {
    eyebrow: "Campus calendar",
    title: "Placement Events",
    description: "Discover company sessions, career workshops, and important CCD briefings.",
    stats: [
      { label: "This month", value: "8" },
      { label: "Registered", value: "3" },
      { label: "Attended", value: "12" },
    ],
    items: [
      {
        title: "Pre-placement Talk",
        organization: "BlackRock",
        meta: "10 August 2026 · 4:00 PM · SPIT Auditorium",
        status: "Registered",
        statusTone: "green",
        description: "Meet the Aladdin engineering team and learn about technology roles, culture, and hiring rounds.",
      },
      {
        title: "Resume Clinic",
        organization: "CCD Career Development Team",
        meta: "13 August 2026 · 1:00 PM · Seminar Hall 2",
        status: "18 seats left",
        statusTone: "amber",
        description: "Bring a resume draft for a focused peer and mentor review session.",
      },
      {
        title: "Careers in Product Engineering",
        organization: "SPIT Alumni Network",
        meta: "18 August 2026 · 5:30 PM · Online",
        status: "Open",
        statusTone: "blue",
        description: "A candid panel with alumni working across product, platform, and developer-experience teams.",
      },
    ],
  },
  competitions: {
    eyebrow: "Challenges and hackathons",
    title: "Competitions",
    description: "Build your profile through employer challenges, national contests, and campus hackathons.",
    stats: [
      { label: "Open", value: "5" },
      { label: "Joined", value: "2" },
      { label: "Achievements", value: "4" },
    ],
    items: [
      {
        title: "FinTech Buildathon 2026",
        organization: "BNP Paribas India",
        meta: "Team size 2–4 · Registration closes 14 August",
        status: "Team registered",
        statusTone: "green",
        description: "Prototype an accessible financial product using secure APIs and responsible AI principles.",
      },
      {
        title: "CodeSprint Campus League",
        organization: "TechVerse",
        meta: "Individual · Qualifier on 17 August",
        status: "Registration open",
        statusTone: "blue",
        description: "A timed algorithm and debugging contest with direct interview opportunities for finalists.",
      },
      {
        title: "Sustainability Product Challenge",
        organization: "SPIT Innovation Cell",
        meta: "Idea submission due 21 August",
        status: "Draft saved",
        statusTone: "amber",
        description: "Design a measurable technology intervention for mobility, energy, or circular-economy problems.",
      },
    ],
  },
};

const profileModels: Record<Exclude<ProfileSectionId, "basic" | "education">, {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  entries: Array<{ title: string; subtitle: string; meta: string; badge?: string }>;
  tags?: string[];
}> = {
  experience: {
    eyebrow: "Professional experience",
    title: "Internship & Work Experience",
    description: "Roles, internships, and practical experience highlighted for recruiters.",
    action: "Add experience",
    entries: [
      {
        title: "Software Engineering Intern",
        subtitle: "CloudNova Systems · Hybrid",
        meta: "May 2025–July 2025 · Built internal workflow tools and improved API reliability.",
        badge: "Completed",
      },
      {
        title: "Web Development Intern",
        subtitle: "SPIT Innovation Cell · Mumbai",
        meta: "December 2024–February 2025 · Delivered a responsive event registration portal.",
      },
    ],
  },
  skills: {
    eyebrow: "Capabilities",
    title: "Skills, Subjects & Languages",
    description: "A concise view of technical strengths, coursework, and communication skills.",
    action: "Add skill",
    entries: [
      {
        title: "Technical skills",
        subtitle: "Strongest in full-stack product development",
        meta: "React, TypeScript, Node.js, Python, PostgreSQL, Git, REST APIs",
      },
      {
        title: "Core subjects",
        subtitle: "Computer Engineering",
        meta: "Data Structures, DBMS, Operating Systems, Computer Networks, Software Engineering",
      },
      {
        title: "Languages",
        subtitle: "Professional working proficiency",
        meta: "English, Hindi, Marathi",
        badge: "Updated",
      },
    ],
    tags: ["React", "TypeScript", "Python", "SQL", "Node.js", "Data Structures", "Git", "English"],
  },
  projects: {
    eyebrow: "Portfolio",
    title: "Projects",
    description: "Selected work demonstrating engineering ability and product thinking.",
    action: "Add project",
    entries: [
      {
        title: "Campus Recruitment Portal",
        subtitle: "React · TypeScript · PostgreSQL",
        meta: "Role-based recruitment workflows, verified profiles, job eligibility, and notifications.",
        badge: "Featured",
      },
      {
        title: "QueueWatch",
        subtitle: "Python · FastAPI · Redis",
        meta: "Monitoring dashboard for asynchronous jobs with alerting and retry analytics.",
      },
      {
        title: "Accessible Notes",
        subtitle: "React · Web Speech API",
        meta: "A keyboard-first note-taking tool with speech playback and semantic exports.",
      },
    ],
  },
  accomplishments: {
    eyebrow: "Recognition",
    title: "Accomplishments",
    description: "Certifications, awards, publications, and competitive achievements.",
    action: "Add accomplishment",
    entries: [
      {
        title: "Winner · SPIT Internal Hackathon",
        subtitle: "Smart campus operations track",
        meta: "March 2025 · Built a queue and room-allocation optimizer.",
        badge: "1st place",
      },
      {
        title: "AWS Cloud Practitioner Essentials",
        subtitle: "Amazon Web Services Training",
        meta: "Issued January 2025 · Credential verified",
        badge: "Verified",
      },
      {
        title: "Top 8% · CodeSprint University League",
        subtitle: "National algorithmic programming contest",
        meta: "November 2024 · 4,800 participants",
      },
    ],
  },
};

function BrandMark({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand-mark" type="button" aria-label="Go to homepage" title="Home" onClick={onClick}>
      <Image src="/ccd-logo-light.png" alt="CCD logo" width={46} height={46} priority unoptimized />
    </button>
  );
}

function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "verified-badge small" : "verified-badge"} title="Verified profile">
      ✓
    </span>
  );
}

function ProfileIdentity() {
  return (
    <section className="student-card" aria-labelledby="student-name">
      <div className="avatar-wrap">
        <div className="student-avatar" aria-hidden="true">AM</div>
        <span className="online-indicator" title="Profile active" />
      </div>
      <div className="student-title-row">
        <h1 id="student-name">Aarav Rajesh<br />Mehta</h1>
        <VerifiedBadge />
      </div>
      <p>Student ID: <strong>SRP-24-0187</strong></p>
      <div className="completion-row">
        <span>Profile strength</span>
        <strong>82%</strong>
      </div>
      <div className="completion-track" aria-label="Profile is 82 percent complete"><span /></div>
      <div className="exam-sync-mini"><span aria-hidden="true">↻</span><div><strong>Exam Cell synced</strong><small>9 Aug 2026 · 7:30 AM</small></div></div>
    </section>
  );
}

function HomeDashboard({ openModule }: { openModule: (moduleId: ModuleId) => void }) {
  const quickStats = [
    { label: "Applications", value: "8", note: "3 active processes", icon: "↗" },
    { label: "Upcoming rounds", value: "2", note: "Next on 12 Aug", icon: "◷" },
    { label: "Profile strength", value: "82%", note: "Add one project", icon: "◎" },
    { label: "Saved jobs", value: "5", note: "2 closing soon", icon: "☆" },
  ];

  return (
    <div className="home-dashboard">
      <section className="welcome-card">
        <div>
          <span className="eyebrow light">Sunday, 9 August</span>
          <h1>Good afternoon, Aarav.</h1>
          <p>Your placement profile is verified and you have two recruitment actions due this week.</p>
          <div className="welcome-actions">
            <button className="white-button" onClick={() => openModule("jobs")}>Explore jobs</button>
            <button className="ghost-light-button" onClick={() => openModule("profile")}>Complete profile</button>
          </div>
        </div>
        <div className="hero-meter" aria-label="Profile is 82 percent complete">
          <div className="hero-meter-ring"><strong>82%</strong><span>complete</span></div>
          <p>Verified placement profile</p>
        </div>
      </section>

      <section className="stat-card-grid" aria-label="Placement summary">
        {quickStats.map((stat) => (
          <article className="metric-card" key={stat.label}>
            <span className="metric-icon" aria-hidden="true">{stat.icon}</span>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div><span className="section-kicker">Next up</span><h2>Your recruitment timeline</h2></div>
            <button className="text-button" onClick={() => openModule("interviews")}>View all</button>
          </div>
          <div className="timeline-list">
            <article className="timeline-item featured">
              <div className="timeline-date"><strong>12</strong><span>Aug</span></div>
              <div><h3>Technical Interview · Edra Labs</h3><p>11:30 AM · Online · 45 minutes</p></div>
              <span className="status-pill blue">Upcoming</span>
            </article>
            <article className="timeline-item">
              <div className="timeline-date"><strong>13</strong><span>Aug</span></div>
              <div><h3>Resume Clinic · CCD</h3><p>1:00 PM · Seminar Hall 2</p></div>
              <span className="status-pill amber">Registered</span>
            </article>
            <article className="timeline-item">
              <div className="timeline-date"><strong>15</strong><span>Aug</span></div>
              <div><h3>HR Discussion · BlackRock</h3><p>2:00 PM · Placement Cell</p></div>
              <span className="status-pill gray">Scheduled</span>
            </article>
          </div>
        </section>

        <aside className="dashboard-card recommended-card">
          <div className="dashboard-card-header">
            <div><span className="section-kicker">Matched for you</span><h2>Recommended jobs</h2></div>
          </div>
          {jobProfiles.slice(0, 3).map((job, index) => (
            <button className="mini-job" key={job.id} onClick={() => openModule("jobs")}>
              <span className={`company-tile company-${index + 1}`}>{job.company.slice(0, 2).toUpperCase()}</span>
              <span><strong>{job.title}</strong><small>{job.company} · {job.city}</small></span>
              <span className="match-score">{94 - index * 5}%</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}

function JobProfilesPage() {
  const [selectedJobId, setSelectedJobId] = useState(jobProfiles[0].id);
  const [activeList, setActiveList] = useState<"all" | "applied">("all");
  const [detailTab, setDetailTab] = useState<JobDetailTab>("description");
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All sectors");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(["bnp", "blackrock", "versor"]);
  const [notInterestedIds, setNotInterestedIds] = useState<string[]>([]);

  const visibleJobs = useMemo(() => jobProfiles.filter((job) => {
    const matchesSearch = `${job.title} ${job.company} ${job.city}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === "All sectors" || job.sector === sectorFilter;
    const matchesType = typeFilter === "All types" || job.positionType === typeFilter;
    const isApplied = appliedJobIds.includes(job.id);
    const matchesList = activeList === "all" ? !isApplied : isApplied;
    const matchesStatus = statusFilter === "All statuses"
      || statusFilter === "Open"
      || (statusFilter === "Closing soon" && /tomorrow|2 days|3 days/i.test(job.closes));
    return matchesSearch && matchesSector && matchesType && matchesList && matchesStatus;
  }), [activeList, appliedJobIds, searchQuery, sectorFilter, statusFilter, typeFilter]);

  const selectedJob = jobProfiles.find((job) => job.id === selectedJobId) ?? jobProfiles[0];
  const hasApplied = appliedJobIds.includes(selectedJob.id);
  const isNotInterested = notInterestedIds.includes(selectedJob.id);
  const appliedJobCount = jobProfiles.filter((job) => appliedJobIds.includes(job.id)).length;
  const availableJobCount = jobProfiles.length - appliedJobCount;

  function applyToSelectedJob() {
    setAppliedJobIds((currentIds) => currentIds.includes(selectedJob.id) ? currentIds : [...currentIds, selectedJob.id]);
    setNotInterestedIds((currentIds) => currentIds.filter((jobId) => jobId !== selectedJob.id));
    setActiveList("applied");
  }

  function toggleNotInterested() {
    setNotInterestedIds((currentIds) => currentIds.includes(selectedJob.id)
      ? currentIds.filter((jobId) => jobId !== selectedJob.id)
      : [...currentIds, selectedJob.id]);
  }

  return (
    <div className="jobs-page">
      <section className="job-filters" aria-label="Job filters">
        <label>Job sector
          <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
            <option>All sectors</option><option>Technology</option><option>Banking</option><option>Fintech</option><option>Finance</option>
          </select>
        </label>
        <label>Position type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All types</option><option>Internship</option><option>Full-time</option>
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All statuses</option><option>Open</option><option>Closing soon</option>
          </select>
        </label>
        <label>Sort by
          <select defaultValue="Newest first"><option>Newest first</option><option>Closing soon</option><option>Best match</option></select>
        </label>
        <button className="clear-filter" onClick={() => {
          setSearchQuery(""); setSectorFilter("All sectors"); setTypeFilter("All types"); setStatusFilter("All statuses");
        }}>Clear filters</button>
        <label className="search-field"><span>⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by job title or company" /></label>
      </section>

      <section className="jobs-workspace">
        <div className="jobs-list-panel">
          <div className="list-tabs" role="tablist" aria-label="Job lists">
            <button className={activeList === "all" ? "active" : ""} onClick={() => setActiveList("all")}>All jobs <span>{availableJobCount}</span></button>
            <button className={activeList === "applied" ? "active" : ""} onClick={() => setActiveList("applied")}>Applied jobs <span>{appliedJobCount}</span></button>
          </div>
          <div className="job-list" aria-live="polite">
            {visibleJobs.length > 0 ? visibleJobs.map((job, index) => {
              const applied = appliedJobIds.includes(job.id);
              return (
                <button className={selectedJob.id === job.id ? "job-list-item active" : "job-list-item"} key={job.id} onClick={() => { setSelectedJobId(job.id); setDetailTab("description"); }}>
                  <span className={`company-avatar company-${(index % 3) + 1}`}>{job.company.slice(0, 2).toUpperCase()}</span>
                  <span className="job-list-copy"><strong>{job.title}</strong><span><b>{job.company}</b> · {job.city}</span><small>{job.posted} · {job.closes}</small></span>
                  <span className={applied ? "application-state applied" : "application-state"}>{applied ? "✓ Applied" : "Yet to apply"}</span>
                </button>
              );
            }) : <div className="empty-state"><span>⌕</span><strong>No matching roles</strong><p>Try clearing one or more filters.</p></div>}
          </div>
        </div>

        <article className="job-detail-panel">
          <header className="selected-job-header">
            <span className="company-avatar company-1">{selectedJob.company.slice(0, 2).toUpperCase()}</span>
            <div><h1>{selectedJob.title}</h1><p><strong>{selectedJob.company}</strong> · {selectedJob.positionType} · {selectedJob.city}</p></div>
            <div className="job-action-row">
              <button className={isNotInterested ? "outline-button selected" : "outline-button"} onClick={toggleNotInterested}>{isNotInterested ? "Undo" : "Not interested"}</button>
              <button className="primary-button" onClick={applyToSelectedJob}>{hasApplied ? "✓ Applied" : "Apply"}</button>
            </div>
          </header>
          <div className="job-alert amber-alert">ⓘ Application withdrawal is prohibited for this placement cycle.</div>
          <div className="job-alert blue-alert">ⓘ This job profile is open for applications. Apply before <strong>Monday, 10 August 2026 · 11:00 AM</strong>.</div>

          <div className="detail-tabs" role="tablist" aria-label="Job details">
            <button className={detailTab === "description" ? "active" : ""} onClick={() => setDetailTab("description")}>Job description</button>
            <button className={detailTab === "workflow" ? "active" : ""} onClick={() => setDetailTab("workflow")}>Hiring workflow</button>
            <button className={detailTab === "eligibility" ? "active" : ""} onClick={() => setDetailTab("eligibility")}>Eligibility criteria</button>
          </div>

          {detailTab === "description" && (
            <div className="job-tab-content">
              <h2>Opening overview</h2>
              <dl className="job-overview-grid"><div><dt>Category</dt><dd>{selectedJob.category}</dd></div><div><dt>Job function</dt><dd>Software & Technology</dd></div><div><dt>Job profile CTC</dt><dd>{selectedJob.ctc}</dd></div><div><dt>Employment type</dt><dd>{selectedJob.positionType}</dd></div></dl>
              <h2>Job description</h2><p>{selectedJob.description}</p>
              <h2>What you will work on</h2><ul><li>Deliver well-tested product features with a cross-functional team.</li><li>Review code, improve technical documentation, and participate in design discussions.</li><li>Use data and user feedback to improve reliability and product quality.</li></ul>
            </div>
          )}
          {detailTab === "workflow" && (
            <div className="job-tab-content">
              <h2>Hiring workflow</h2>
              <ol className="workflow-list">
                <li className="complete"><span>1</span><div><strong>Application review</strong><p>Eligibility and profile verification by CCD.</p></div></li>
                <li><span>2</span><div><strong>Online assessment</strong><p>Aptitude, CS fundamentals, and coding · 90 minutes.</p></div></li>
                <li><span>3</span><div><strong>Technical interview</strong><p>Problem solving, projects, and core engineering concepts.</p></div></li>
                <li><span>4</span><div><strong>HR discussion</strong><p>Role alignment, culture, and joining details.</p></div></li>
              </ol>
            </div>
          )}
          {detailTab === "eligibility" && (
            <div className="job-tab-content">
              <h2>Your eligibility</h2>
              <div className="eligibility-banner"><VerifiedBadge small /><div><strong>You are eligible to apply</strong><p>Your latest Exam Cell record meets all academic requirements configured for this role.</p></div></div>
              <ul className="criteria-list">{selectedJob.requirements.map((requirement) => <li key={requirement}><span>✓</span>{requirement}</li>)}</ul>
              <p className="eligibility-note">Eligibility is calculated automatically from the latest Exam Cell sync. Raise an academic correction request if any imported value is incorrect.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function BasicProfileContent() {
  const [activeTab, setActiveTab] = useState<"about" | "documents">("about");
  const profileFields = [
    { label: "Full name", value: "Aarav Rajesh Mehta" },
    { label: "Date of birth", value: "18 September, 2004" },
    { label: "Gender", value: "Male" },
    { label: "Current / latest college", value: "Sardar Patel Institute of Technology, Mumbai", imported: true },
  ];

  return (
    <>
      <div className="content-heading-row">
        <div><span className="eyebrow">Student profile</span><h2>Basic Details</h2></div>
        <div className="profile-status"><VerifiedBadge small /><span>Verified by CCD</span></div>
      </div>
      <div className="about-tabs" role="tablist" aria-label="Profile detail tabs">
        <button className={activeTab === "about" ? "about-tab active" : "about-tab"} onClick={() => setActiveTab("about")}>About <VerifiedBadge small /></button>
        <button className={activeTab === "documents" ? "about-tab active" : "about-tab"} onClick={() => setActiveTab("documents")}>Documents <span className="document-count">4</span></button>
      </div>
      {activeTab === "about" ? (
        <>
          <section className="details-section" aria-label="About the student"><dl className="details-grid">{profileFields.map((field) => <div className="detail-row" key={field.label}><dt>{field.label}</dt><dd>{field.value}{field.imported && <span className="imported-field">⌁ Exam Cell</span>}</dd></div>)}</dl></section>
          <section className="content-block"><div className="section-title-row"><div><span className="section-kicker">Personal statement</span><h3>Profile Summary</h3></div><button className="secondary-button">✎ Edit info</button></div><p className="summary-copy">Computer Engineering student interested in full-stack product development, dependable systems, and solving practical problems through thoughtful software.</p><div className="tag-row"><span>Software Engineering</span><span>Product Development</span><span>Open to opportunities</span></div></section>
          <section className="content-block"><div className="section-title-row"><div><span className="section-kicker">Contact information</span><h3>Address</h3></div><button className="secondary-button">✎ Edit info</button></div><dl className="details-grid compact"><div className="detail-row"><dt>Permanent address</dt><dd>Andheri East, Mumbai, Maharashtra, India — 400069</dd></div><div className="detail-row"><dt>Current city</dt><dd>Mumbai, Maharashtra</dd></div></dl></section>
          <section className="content-block"><div className="section-title-row"><div><span className="section-kicker">Reach me at</span><h3>Contact Details</h3></div><button className="secondary-button">✎ Edit info</button></div><dl className="details-grid compact"><div className="detail-row"><dt>Email</dt><dd>aarav.mehta@spit.ac.in</dd></div><div className="detail-row"><dt>Phone</dt><dd>+91 98••• ••241</dd></div></dl></section>
        </>
      ) : (
        <section className="documents-panel">
          <div className="section-title-row"><div><span className="section-kicker">Digital academic vault</span><h3>Verified Documents</h3></div><button className="primary-button">＋ Upload document</button></div>
          {["Semester marksheets", "Higher secondary marksheet", "Secondary school marksheet", "Government photo ID"].map((document, index) => <article className="document-row" key={document}><span className="document-icon">▧</span><div><strong>{document}</strong><p>PDF · Updated {index + 2} August 2026</p></div><span className="verified-label"><VerifiedBadge small /> Verified</span><button className="more-button">•••</button></article>)}
        </section>
      )}
    </>
  );
}

function AcademicDetailsContent() {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const semesterRecords = [
    { semester: "Semester I", year: "2022–23", sgpa: "8.35", credits: "21 / 21", result: "Pass" },
    { semester: "Semester II", year: "2022–23", sgpa: "8.61", credits: "22 / 22", result: "Pass" },
    { semester: "Semester III", year: "2023–24", sgpa: "8.48", credits: "22 / 22", result: "Pass" },
    { semester: "Semester IV", year: "2023–24", sgpa: "8.84", credits: "23 / 23", result: "Pass" },
    { semester: "Semester V", year: "2024–25", sgpa: "8.91", credits: "22 / 22", result: "Pass" },
    { semester: "Semester VI", year: "2024–25", sgpa: "9.08", credits: "22 / 22", result: "Pass" },
  ];

  function openCorrectionForm() {
    setRequestSubmitted(false);
    setShowCorrectionForm(true);
  }

  function submitCorrectionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestSubmitted(true);
  }

  return (
    <div className="academic-page">
      <div className="content-heading-row academic-heading">
        <div>
          <span className="eyebrow">Academic source of truth</span>
          <h2>Education Details</h2>
          <p className="page-description">Your official academic record is imported directly from the Exam Cell and used automatically for placement eligibility.</p>
        </div>
        <div className="source-of-truth-pill"><span>↻</span><div><strong>Synced</strong><small>9 Aug 2026 · 7:30 AM</small></div></div>
      </div>

      <section className="exam-cell-banner">
        <div className="exam-cell-icon" aria-hidden="true">EC</div>
        <div><span>Imported from Exam Cell</span><h3>Official records are read-only</h3><p>Students cannot edit marks, CGPA, backlogs, branch, or academic status directly. If something is incorrect, submit a correction request with supporting evidence.</p></div>
      </section>

      <section className="academic-stat-grid" aria-label="Academic summary">
        <article><span>Current CGPA</span><strong>8.72</strong><small>Through Semester VI</small></article>
        <article><span>Active backlogs</span><strong>0</strong><small>No pending subjects</small></article>
        <article><span>Credits earned</span><strong>132</strong><small>of 132 attempted</small></article>
        <article><span>Academic status</span><strong className="status-value">Regular</strong><small>Eligible for placements</small></article>
      </section>

      <section className="academic-record-card">
        <div className="section-title-row"><div><span className="section-kicker">Current programme</span><h3>Institute Record</h3></div><span className="locked-record">⌑ Read-only</span></div>
        <dl className="readonly-grid">
          <div><dt>Institute</dt><dd>Sardar Patel Institute of Technology</dd></div>
          <div><dt>Programme</dt><dd>B.Tech · Computer Engineering</dd></div>
          <div><dt>University</dt><dd>University of Mumbai</dd></div>
          <div><dt>Admission year</dt><dd>2022</dd></div>
          <div><dt>Expected graduation</dt><dd>2026</dd></div>
          <div><dt>Exam seat number</dt><dd>CE22-0187</dd></div>
        </dl>
      </section>

      <section className="semester-section">
        <div className="section-title-row"><div><span className="section-kicker">Semester performance</span><h3>SGPA & Credit History</h3></div><span className="semester-count">6 semesters imported</span></div>
        <div className="semester-table-wrap">
          <table className="semester-table">
            <thead><tr><th>Semester</th><th>Academic year</th><th>SGPA</th><th>Credits earned</th><th>Result</th></tr></thead>
            <tbody>{semesterRecords.map((record) => <tr key={record.semester}><td><strong>{record.semester}</strong></td><td>{record.year}</td><td><b>{record.sgpa}</b></td><td>{record.credits}</td><td><span className="result-badge">✓ {record.result}</span></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="prior-education-section">
        <div className="section-title-row"><div><span className="section-kicker">Previous qualifications</span><h3>School Records</h3></div><span className="locked-record">⌑ Read-only</span></div>
        <div className="prior-education-grid">
          <article><span className="qualification-icon">12</span><div><h4>Higher Secondary Certificate</h4><p>Maharashtra State Board · Science</p><strong>91.20%</strong><small>Completed 2022 · Verified</small></div></article>
          <article><span className="qualification-icon">10</span><div><h4>Secondary School Certificate</h4><p>Maharashtra State Board</p><strong>94.40%</strong><small>Completed 2020 · Verified</small></div></article>
        </div>
      </section>

      <section className="academic-correction-cta">
        <div><span className="section-kicker">Found an incorrect record?</span><h3>Request an academic correction</h3><p>The Exam Cell will review your request and supporting document before updating the official record.</p></div>
        <button className="secondary-button" onClick={openCorrectionForm}>Raise correction request</button>
      </section>

      {showCorrectionForm && (
        <section className="correction-panel" aria-labelledby="correction-title">
          <div className="section-title-row"><div><span className="section-kicker">Exam Cell review</span><h3 id="correction-title">Academic Correction Request</h3></div><button className="more-button close-button" onClick={() => setShowCorrectionForm(false)} aria-label="Close correction form">×</button></div>
          {requestSubmitted ? (
            <div className="correction-success"><VerifiedBadge small /><div><strong>Request drafted successfully</strong><p>This static model demonstrates the student flow. In the finished system, the request would now be sent to the Exam Cell for review.</p></div></div>
          ) : (
            <form className="correction-form" onSubmit={submitCorrectionRequest}>
              <label>Record to correct<select required defaultValue=""><option value="" disabled>Select an academic record</option><option>Semester result or SGPA</option><option>CGPA</option><option>Backlog status</option><option>Branch or programme</option><option>10th / 12th marks</option></select></label>
              <label>What appears incorrect?<textarea required rows={4} placeholder="Describe the current value and the correction you are requesting." /></label>
              <label className="evidence-upload"><span>Supporting evidence</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" /><small>Upload a marksheet or official supporting document · PDF, PNG or JPG</small></label>
              <div className="correction-actions"><button type="button" className="outline-button" onClick={() => setShowCorrectionForm(false)}>Cancel</button><button type="submit" className="primary-button">Submit request</button></div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function ProfileSectionContent({ sectionId }: { sectionId: ProfileSectionId }) {
  if (sectionId === "basic") return <BasicProfileContent />;
  if (sectionId === "education") return <AcademicDetailsContent />;
  const model = profileModels[sectionId];
  return (
    <div className="profile-section-view">
      <div className="content-heading-row"><div><span className="eyebrow">{model.eyebrow}</span><h2>{model.title}</h2><p className="page-description">{model.description}</p></div><button className="primary-button">＋ {model.action}</button></div>
      {model.tags && <div className="skill-cloud">{model.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      <section className="profile-entry-list">
        {model.entries.map((entry, index) => (
          <article className="profile-entry-card" key={entry.title}>
            <span className={`entry-monogram entry-${(index % 3) + 1}`}>{entry.title.slice(0, 2).toUpperCase()}</span>
            <div><h3>{entry.title}</h3><p>{entry.subtitle}</p><span>{entry.meta}</span></div>
            {entry.badge && <span className="entry-badge"><VerifiedBadge small />{entry.badge}</span>}
            <button className="more-button" aria-label={`More actions for ${entry.title}`}>•••</button>
          </article>
        ))}
      </section>
      <aside className="static-model-note"><span>ⓘ</span><p>This is a static portal model. Add, edit, upload, and verification actions are represented visually without saving data.</p></aside>
    </div>
  );
}

function ProfilePage({ activeSection }: { activeSection: ProfileSectionId }) {
  return <ProfileSectionContent sectionId={activeSection} />;
}

function ActivityPage({ pageId }: { pageId: "interviews" | "assessments" | "events" | "competitions" }) {
  const page = activityPages[pageId];
  return (
    <div className="activity-page">
      <section className="module-heading"><div><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div></section>
      <div className="activity-stats">{page.stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</div>
      <section className="activity-list"><div className="activity-list-header"><h2>Current activity</h2><div className="segmented-control"><button className="active">Active</button><button>Past</button></div></div>{page.items.map((item, index) => <article className="activity-card" key={item.title}><span className={`activity-icon activity-${(index % 3) + 1}`}>{item.organization.slice(0, 2).toUpperCase()}</span><div className="activity-copy"><div><span className={`status-pill ${item.statusTone}`}>{item.status}</span><h3>{item.title}</h3><strong>{item.organization}</strong></div><p>{item.description}</p><small>{item.meta}</small></div><button className="outline-button">View details</button></article>)}</section>
    </div>
  );
}

function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadUploadedResumes() {
      try {
        const response = await fetch(`${resumeApiBaseUrl}/api/resumes`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as { resumes: UploadedResume[] };
        setUploadedResumes(data.resumes);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    loadUploadedResumes();
    return () => controller.abort();
  }, []);

  async function uploadResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(`Uploading ${file.name}…`);
    const formData = new FormData();
    formData.set("resume", file);

    try {
      const response = await fetch(`${resumeApiBaseUrl}/api/resumes`, { method: "POST", body: formData });
      const data = await response.json() as { resume?: UploadedResume; message?: string };
      if (!response.ok || !data.resume) throw new Error(data.message ?? "Upload failed.");
      setUploadedResumes((resumes) => [data.resume as UploadedResume, ...resumes]);
      setUploadMessage(`${file.name} uploaded successfully.`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "The resume could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  }

  function formatFileSize(size: number) {
    return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
  }

  return (
    <div className="resume-page">
      <section className="module-heading"><div><span className="eyebrow">Application documents</span><h1>Resume Repository</h1><p>Maintain role-specific resumes and choose a default version for placement applications.</p></div><div className="resume-upload-controls"><input ref={fileInputRef} className="resume-file-input" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadResume} /><button className="primary-button" type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{isUploading ? "Uploading…" : "＋ Upload resume"}</button><small>PDF, DOC or DOCX · maximum 5 MB</small></div></section>
      {uploadMessage && <p className="upload-message" role="status" aria-live="polite">{uploadMessage}</p>}
      <section className="resume-summary"><div className="resume-preview"><div className="paper-sheet"><span>AM</span><div /><div /><div /><strong>Aarav Mehta</strong><div /><div /></div></div><div><span className="status-pill green">Default resume</span><h2>Software Engineering Resume</h2><p>Optimized for product engineering, backend, and full-stack roles.</p><dl><div><dt>Last updated</dt><dd>7 August 2026</dd></div><div><dt>File size</dt><dd>684 KB · PDF</dd></div><div><dt>Profile match</dt><dd>96%</dd></div></dl><div className="resume-actions"><button className="primary-button">Preview</button><button className="outline-button">Download</button><button className="outline-button">Replace</button></div></div></section>
      {uploadedResumes.length > 0 && <section className="resume-versions"><div className="activity-list-header"><h2>Uploaded resumes</h2><span className="status-pill blue">{uploadedResumes.length} saved</span></div>{uploadedResumes.map((resume) => <article className="resume-row" key={resume.id}><span className="document-icon">{resume.name.split(".").pop()?.toUpperCase()}</span><div><strong>{resume.name}</strong><p>Uploaded {new Date(resume.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {formatFileSize(resume.size)}</p></div><span className="status-pill green">Uploaded</span><a className="outline-button resume-download" href={`${resumeApiBaseUrl}/api/resumes/${resume.id}/download`}>Download</a></article>)}</section>}
      <section className="resume-versions"><div className="activity-list-header"><h2>Other versions</h2><button className="text-button">Manage versions</button></div>{["Data & Analytics Resume", "Product Engineering Resume", "General Campus Resume"].map((resume, index) => <article className="resume-row" key={resume}><span className="document-icon">PDF</span><div><strong>{resume}</strong><p>Updated {index + 2} weeks ago · {570 + index * 84} KB</p></div><span className="status-pill gray">Ready</span><button className="more-button">•••</button></article>)}</section>
    </div>
  );
}

function HelpPage() {
  const questions = [
    ["How is my job eligibility calculated?", "Eligibility uses the latest Exam Cell–imported CGPA, branch, graduation year, backlogs, and academic status together with the requirements defined for each job."],
    ["Can I withdraw an application?", "Withdrawal rules are set per placement cycle and are displayed before you apply to a job profile."],
    ["How do I correct a verified record?", "Raise a profile correction request with supporting documents. CCD will review the request and update its status."],
    ["Which resume is used while applying?", "Your default resume is selected automatically, and eligible job profiles may allow you to choose another saved version."],
  ];
  return (
    <div className="help-page">
      <section className="help-hero"><span className="eyebrow light">Student support</span><h1>How can we help?</h1><p>Search portal guidance or reach the Career Development Department.</p><label><span>⌕</span><input placeholder="Search help articles" /></label></section>
      <div className="help-layout"><section className="faq-list"><span className="section-kicker">Frequently asked</span><h2>Popular questions</h2>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</section><aside className="support-card"><span className="support-icon">?</span><h2>Need personal support?</h2><p>The CCD student desk can help with profile verification, eligibility, and active recruitment processes.</p><dl><div><dt>Desk hours</dt><dd>Mon–Fri · 10 AM–5 PM</dd></div><div><dt>Location</dt><dd>Room 212 · Main Building</dd></div><div><dt>Email</dt><dd>ccd@spit.ac.in</dd></div></dl><button className="primary-button">Create support request</button></aside></div>
    </div>
  );
}

export default function StudentPortal() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [activeProfileSection, setActiveProfileSection] = useState<ProfileSectionId>("basic");

  function openModule(moduleId: ModuleId) {
    setActiveModule(moduleId);
    window.history.replaceState(null, "", `#${moduleId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const profileMode = activeModule === "profile";

  return (
    <main className={profileMode ? "app-shell profile-mode" : "app-shell module-mode"}>
      <header className="topbar">
        <div className="topbar-title"><BrandMark onClick={() => openModule("home")} /><span className="brand-copy"><small>CCD · SPIT</small><strong>{moduleTitles[activeModule]}</strong></span></div>
        <div className="topbar-actions" aria-label="Account actions"><button className="icon-button" aria-label="Settings">⚙</button><button className="icon-button notification-button" aria-label="Notifications">♧<span className="notification-dot" /></button><button className="mini-avatar" aria-label="Open my profile" title="My Profile" onClick={() => openModule("profile")}>AM</button></div>
      </header>

      <nav className="primary-nav" aria-label="Primary navigation">
        <div className="nav-list">{navigationItems.map((item) => <button key={item.id} className={activeModule === item.id ? "nav-item active" : "nav-item"} onClick={() => openModule(item.id)}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}</div>
        <button className={activeModule === "help" ? "nav-item help-link active" : "nav-item help-link"} onClick={() => openModule("help")}><span className="nav-icon" aria-hidden="true">ⓘ</span><span>Help</span></button>
      </nav>

      {profileMode && (
        <aside className="profile-sidebar">
          <ProfileIdentity />
          <label className="mobile-section-picker"><span>Profile section</span><select value={activeProfileSection} onChange={(event) => setActiveProfileSection(event.target.value as ProfileSectionId)}>{profileSections.map((section) => <option value={section.id} key={section.id}>{section.label}</option>)}</select></label>
          <nav className="profile-nav" aria-label="Profile sections">{profileSections.map((section) => <button key={section.id} className={activeProfileSection === section.id ? "profile-nav-item active" : "profile-nav-item"} onClick={() => setActiveProfileSection(section.id)}>{section.label}{section.id === "accomplishments" && <span aria-hidden="true">⌄</span>}</button>)}</nav>
        </aside>
      )}

      <section className={profileMode ? "content-panel" : "module-content"}>
        {activeModule === "home" && <HomeDashboard openModule={openModule} />}
        {activeModule === "jobs" && <JobProfilesPage />}
        {activeModule === "profile" && <ProfilePage activeSection={activeProfileSection} />}
        {activeModule === "interviews" && <ActivityPage pageId="interviews" />}
        {activeModule === "assessments" && <ActivityPage pageId="assessments" />}
        {activeModule === "events" && <ActivityPage pageId="events" />}
        {activeModule === "competitions" && <ActivityPage pageId="competitions" />}
        {activeModule === "resume" && <ResumePage />}
        {activeModule === "help" && <HelpPage />}
      </section>
    </main>
  );
}
