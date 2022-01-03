import config from './../config/config.ts'
import { MongoClient } from 'https://deno.land/x/mongo@v0.28.0/mod.ts'

const client = new MongoClient()

await client.connect(
  `mongodb://${config.DB_USER}:${config.DB_PASS}@${config.DB_HOST}:${config.DB_PORT}`
)

const db = client.database(config.DB_NAME)
export default db
