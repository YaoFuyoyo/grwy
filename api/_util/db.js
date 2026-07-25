const isLocal = process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI

if (isLocal) {
  module.exports = require('./db-memory')
} else {
  const { MongoClient } = require('mongodb')

  let client = null
  let dbs = {}

  async function getDb(dbName) {
    if (dbs[dbName]) return dbs[dbName]
    
    if (!client) {
      const uri = process.env.MONGODB_URI
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set')
      }
      client = new MongoClient(uri)
      await client.connect()
    }
    
    dbs[dbName] = client.db(dbName)
    return dbs[dbName]
  }

  async function getCollection(dbName, collectionName) {
    const db = await getDb(dbName)
    return db.collection(collectionName)
  }

  async function generateUserId() {
    const db = await getDb('zzyy_auth')
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'userId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )
    return 'U' + String(counter.value.seq).padStart(6, '0')
  }

  async function generatePageId() {
    const db = await getDb('profile_builder')
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'pageId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )
    return String(counter.value.seq).padStart(6, '0')
  }

  async function generateOrderId() {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const db = await getDb('zzyy_payment')
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'orderId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )
    return 'O' + dateStr + String(counter.value.seq).padStart(5, '0')
  }

  module.exports = { getDb, getCollection, generateUserId, generatePageId, generateOrderId }
}