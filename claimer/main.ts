const run = async () => {
  console.log('Hello, World!')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
