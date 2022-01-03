export default async function sleep(time = 1) {
  await new Promise(resolve => setTimeout(resolve, time * 1000))
}
