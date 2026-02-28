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
