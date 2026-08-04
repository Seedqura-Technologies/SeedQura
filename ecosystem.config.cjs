module.exports = {
  apps: [
    {
      name: "seedqura-backend",
      cwd: "./Backend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        FRONTEND_URL: "http://72.60.206.223:3020",
      },
    },
    {
      name: "seedqura-frontend",
      cwd: "./Frontend",
      script: "npm",
      args: "run start -- -p 3020 -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: 3020,
        API_URL: "http://localhost:3001",
      },
    },
  ],
};
