import GlassCard from "./GlassCard";
import MatchScoreRing from "./MatchScoreRing";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  tags: string[];
  postedAgo: string;
}

const jobs: JobListing[] = [
  {
    id: "1",
    title: "Senior Product Designer",
    company: "Northwind Labs",
    location: "Remote · US",
    salary: "$145K–$175K",
    matchScore: 94,
    tags: ["Figma", "Design Systems", "B2B SaaS"],
    postedAgo: "2h ago",
  },
  {
    id: "2",
    title: "Staff Frontend Engineer",
    company: "Cascade Analytics",
    location: "Austin, TX",
    salary: "$160K–$195K",
    matchScore: 87,
    tags: ["React", "TypeScript", "Data Viz"],
    postedAgo: "6h ago",
  },
  {
    id: "3",
    title: "Product Manager, Platform",
    company: "Ferrous Systems",
    location: "Hybrid · NYC",
    salary: "$150K–$180K",
    matchScore: 71,
    tags: ["B2B", "APIs", "0→1"],
    postedAgo: "1d ago",
  },
  {
    id: "4",
    title: "Growth Marketing Lead",
    company: "Voyage Health",
    location: "Remote · US",
    salary: "$120K–$140K",
    matchScore: 48,
    tags: ["Lifecycle", "SEO", "Paid Media"],
    postedAgo: "2d ago",
  },
];

export default function CandidateDashboard() {
  return (
    <div className="min-h-screen bg-dark-950 px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl">Your trajectory, mapped</h1>
          <p className="text-dark-300 text-sm mt-1">
            4 new matches since yesterday, sorted by fit
          </p>
        </div>
        <div className="pill bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-500" />
          Profile 92% complete
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Job feed */}
        <div className="col-span-2 space-y-4">
          {jobs.map((job) => (
            <GlassCard key={job.id} interactive arc>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-display font-semibold text-dark-50 truncate">
                      {job.title}
                    </h3>
                    <span className="text-dark-400 text-xs data-figure shrink-0">
                      {job.postedAgo}
                    </span>
                  </div>
                  <p className="text-sm text-dark-300">
                    {job.company} · {job.location}
                  </p>
                  <p className="text-sm text-signal-500 data-figure mt-1">{job.salary}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="pill bg-dark-700/60 text-dark-200 border border-white/[0.06] font-body normal-case tracking-normal"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <MatchScoreRing score={job.matchScore} size={72} />
                  <button className="text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors">
                    View role →
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Sidebar: quick stats */}
        <div className="space-y-6">
          <GlassCard arc>
            <h3 className="text-sm font-display font-semibold text-dark-50 mb-4">
              This week's activity
            </h3>
            <div className="space-y-3">
              {[
                { label: "Applications sent", value: "6" },
                { label: "Recruiter replies", value: "3" },
                { label: "Interviews scheduled", value: "1" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">{stat.label}</span>
                  <span className="data-figure text-indigo-300 font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-display font-semibold text-dark-50 mb-2">
              Top skill to close the gap
            </h3>
            <p className="text-sm text-dark-300 mb-4">
              Adding <span className="text-dark-50 font-medium">system design</span> to your
              profile would raise your average match by an estimated 11 points.
            </p>
            <button className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors text-sm font-medium text-white">
              See skill gap analysis
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
