// api/db.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('profile_builder'); // 数据库名，可以改
  return db;
}

module.exports = { getDb };