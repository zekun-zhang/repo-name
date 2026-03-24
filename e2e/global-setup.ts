import fs from 'fs'

export default function globalSetup() {
  // Start each E2E run with an empty data file
  fs.writeFileSync('/tmp/e2e-habits.json', JSON.stringify({ habits: [], logs: {} }), 'utf-8')
}
