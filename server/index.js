const { createApp } = require('./app')
// PORT=0 代表让系统自动分配一个可用端口
const PORT =
  process.env.PORT === undefined || process.env.PORT === ''
    ? 4001
    : Number(process.env.PORT)

const app = createApp()

const server = app.listen(PORT, () => {
  const address = server.address()
  const port =
    address && typeof address === 'object' && 'port' in address
      ? address.port
      : PORT
  console.log(`API server running on http://localhost:${port}`)
})

