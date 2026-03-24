const path = require('path')
const { createApp } = require('./app')
// PORT=0 lets the OS assign an available port automatically
const PORT =
  process.env.PORT === undefined || process.env.PORT === ''
    ? 4001
    : Number(process.env.PORT)

const dataFile = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : undefined
const app = createApp(dataFile ? { dataFile } : {})

const server = app.listen(PORT, () => {
  const address = server.address()
  const port =
    address && typeof address === 'object' && 'port' in address
      ? address.port
      : PORT
  console.log(`API server running on http://localhost:${port}`)
})

