export const seedUsers = [
  {
    id: 1,
    username: "admin",
    password: "test123",
    email: "admin@tm.com",
    role: "admin",
  },
  {
    id: 2,
    username: "chris",
    password: "test123",
    email: "chris@tm.com",
    role: "team_member",
  },
  {
    id: 3,
    username: "pm",
    password: "test123",
    email: "pm@tm.com",
    role: "project_manager",
  },
];

export const seedProjects = [
  {
    id: 7,
    title: "Marketing Campaign",
    text: "Promote a new vacuum cleaner product across TV, radio, and social.",
    users: ["chris", "admin"],
    priority: 3,
  },
  {
    id: 9,
    title: "iOS App Development",
    text: "Mobile application project for training workflows.",
    users: ["pm"],
    priority: 2,
  },
];
