import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Forks are stable on the Node/macOS combination used by this project.
    // The thread pool intermittently failed before loading the story test worker.
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false
  }
})
