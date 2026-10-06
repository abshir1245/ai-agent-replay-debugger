import { spawn } from "node:child_process";

const children = [
  spawn("npm", ["run", "dev", "-w", "@agent-replay/api"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev", "-w", "@agent-replay/web"], { stdio: "inherit" }),
];

const stop = () => children.forEach((child) => child.kill("SIGTERM"));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) => child.on("exit", (code) => {
  if (code && code !== 0) {
    stop();
    process.exitCode = code;
  }
}));
