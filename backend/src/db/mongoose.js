const mongoose = require("mongoose");
const env = require("../config/env");

async function connectMongo() {
  await mongoose.connect(env.mongodbUri, {
    maxPoolSize: 30,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  return mongoose.connection;
}

module.exports = { connectMongo };
