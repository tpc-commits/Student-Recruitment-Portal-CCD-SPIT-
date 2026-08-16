const jobs = [
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
    description: "Join a product engineering team building dependable tools for high-growth businesses. Interns work alongside senior engineers on production features, testing, and platform improvements.",
    requirements: ["CGPA 7.5 or above", "No active backlogs", "Computer, IT or EXTC branches"],
    eligibleYears: [2027, 2028, 2029],
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
    description: "A campus technology challenge that leads to software engineering interviews across digital banking, risk platforms, and data engineering teams.",
    requirements: ["CGPA 7.0 or above", "2026 graduating batch", "All engineering branches"],
    eligibleYears: [2026],
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
    description: "Build and operate data products used by investment teams. The role combines software engineering, cloud platforms, data quality, and financial technology.",
    requirements: ["CGPA 8.0 or above", "Strong DSA fundamentals", "Computer and IT branches"],
    eligibleYears: [2026],
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
    description: "Develop research infrastructure and data pipelines for systematic investing. Ideal for students who enjoy mathematics, algorithms, and high-quality software.",
    requirements: ["CGPA 8.0 or above", "Python or C++ proficiency", "All engineering branches"],
    eligibleYears: [2026],
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
    description: "Learn market analysis, risk management, and decision-making in a structured internship for analytically strong students.",
    requirements: ["CGPA 7.0 or above", "Strong analytical ability", "Open to all branches"],
    eligibleYears: [2027, 2028],
  },
];

export function getJobsForYear(graduationYear) {
  return jobs
    .filter((job) => job.eligibleYears.includes(graduationYear))
    .map((job) => {
      const publicJob = { ...job };
      delete publicJob.eligibleYears;
      return publicJob;
    });
}
