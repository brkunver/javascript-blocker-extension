const { spawnSync } = require("node:child_process")

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" })
  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function output(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" })
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout)
    process.exit(result.status || 1)
  }
  return result.stdout.trim()
}

const status = output("git", ["status", "--short"])
if (status) {
  console.error("zip:all requires a clean working tree before packaging.")
  console.error(status)
  process.exit(1)
}

run("pnpm", ["run", "zip"])
run("pnpm", ["run", "zip:firefox"])
