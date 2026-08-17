export interface Job {
  slug: string;
  company: string;
  position: string;
  description: string;
  startYear: number;
  endYear?: number;
  current: boolean;
}

export const jobs: Job[] = [
  {
    slug: "infinelabs",
    company: "Infinee Labs",
    position: "CTO & Co-founder",
    description:
      "Co-founded with Rene Remsik in September 2025. Sole technical owner (architecture, development, DevOps, security). In 8 months we shipped four products — Foodient, ViralSky, SkySnail, Anderro — to ~43k registered users and ~350 active paying subscribers across B2C mobile, creator SaaS, and a B2B affiliate marketplace.",
    startYear: 2025,
    current: true,
  },
  {
    slug: "csretail",
    company: "CSRetail",
    position: "Backend Engineer",
    description:
      "Building and maintaining backend systems for Czech fashion e-commerce brands including Bibloo, Sam73, and Zoot.cz. Marketplace services, API integrations, and e-commerce platform infrastructure.",
    startYear: 2022,
    current: true,
  },
  {
    slug: "4dots",
    company: "4dots",
    position: "Intern / Entry Level Developer",
    description:
      "Started career in software development. Worked on various web projects and learned core engineering practices.",
    startYear: 2021,
    endYear: 2022,
    current: false,
  },
];
