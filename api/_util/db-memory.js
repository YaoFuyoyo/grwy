let databases = {}

function getDb(dbName) {
  if (!databases[dbName]) {
    databases[dbName] = {
      collections: {},
      counters: {}
    }
  }
  return databases[dbName]
}

function deepClone(doc) {
  if (doc === null || typeof doc !== 'object') return doc
  if (doc instanceof Date) return new Date(doc.getTime())
  if (Array.isArray(doc)) return doc.map(item => deepClone(item))
  const cloned = {}
  for (const key in doc) {
    cloned[key] = deepClone(doc[key])
  }
  return cloned
}

function createCollectionProxy(collection) {
  return {
    async findOne(query) {
      const found = collection.find(doc => {
        for (const key in query) {
          if (doc[key] !== query[key]) return false
        }
        return true
      })
      return found ? deepClone(found) : null
    },

    async find(query = {}) {
      const filtered = collection.filter(doc => {
        for (const key in query) {
          if (doc[key] !== query[key]) return false
        }
        return true
      }).map(doc => deepClone(doc))
      return {
        async toArray() {
          return filtered
        },
        sort(options) {
          const sortKey = Object.keys(options)[0]
          const sortDir = options[sortKey]
          return {
            async toArray() {
              return [...filtered].sort((a, b) => {
                if (a[sortKey] < b[sortKey]) return sortDir === -1 ? 1 : -1
                if (a[sortKey] > b[sortKey]) return sortDir === -1 ? -1 : 1
                return 0
              })
            }
          }
        }
      }
    },

    async insertOne(doc) {
      const newDoc = deepClone(doc)
      newDoc._id = Math.random().toString(36).substr(2, 9)
      collection.push(newDoc)
      return { insertedId: newDoc._id }
    },

    async updateOne(query, update) {
      const doc = await this.findOne(query)
      if (doc) {
        const updateDoc = update.$set || update
        Object.assign(doc, updateDoc)
        const index = collection.findIndex(d => d._id === doc._id)
        if (index > -1) {
          collection[index] = doc
        }
      }
      return { matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 }
    },

    async deleteOne(query) {
      const index = collection.findIndex(doc => {
        for (const key in query) {
          if (doc[key] !== query[key]) return false
        }
        return true
      })
      if (index > -1) {
        collection.splice(index, 1)
        return { deletedCount: 1 }
      }
      return { deletedCount: 0 }
    },

    async findOneAndUpdate(query, update, options = {}) {
      const doc = await this.findOne(query)
      if (doc) {
        const updateDoc = update.$set || update
        Object.assign(doc, updateDoc)
        const index = collection.findIndex(d => d._id === doc._id)
        if (index > -1) {
          collection[index] = doc
        }
      }
      return { value: doc }
    }
  }
}

async function getCollection(dbName, collectionName) {
  const db = getDb(dbName)
  if (!db.collections[collectionName]) {
    db.collections[collectionName] = []
  }
  return createCollectionProxy(db.collections[collectionName])
}

async function generateUserId() {
  const db = getDb('zzyy_auth')
  if (!db.counters.userId) db.counters.userId = 0
  db.counters.userId++
  return 'U' + String(db.counters.userId).padStart(6, '0')
}

async function generatePageId() {
  const db = getDb('profile_builder')
  if (!db.counters.pageId) db.counters.pageId = 0
  db.counters.pageId++
  return String(db.counters.pageId).padStart(6, '0')
}

async function generateOrderId() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const db = getDb('zzyy_payment')
  if (!db.counters.orderId) db.counters.orderId = 0
  db.counters.orderId++
  return 'O' + dateStr + String(db.counters.orderId).padStart(5, '0')
}

module.exports = {
  getDb,
  getCollection,
  generateUserId,
  generatePageId,
  generateOrderId
}