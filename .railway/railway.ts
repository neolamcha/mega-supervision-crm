import { type Project } from "@railway/cli";

export default {
  name: "mega-supervision",
  environments: {
    production: {
      services: [
        {
          name: "backend",
          source: {
            repo: "neolamcha/mega-supervision-crm",
            branch: "main",
          },
          rootDirectory: "backend",
          variables: {
            APP_ENV: "production",
            NODE_ENV: "production",
            PORT: "3000",
          },
        },
        {
          name: "frontend",
          source: {
            repo: "neolamcha/mega-supervision-crm",
            branch: "main",
          },
          rootDirectory: "web",
          variables: {
            NODE_ENV: "production",
          },
        },
      ],
    },
  },
} satisfies Project;
