const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User'); 
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 
  "mongodb://sameermd761_db_user:viX4PKnGA1gIrE2b@" +
  "ac-mxvttls-shard-00-00.xekje7n.mongodb.net:27017," +
  "ac-mxvttls-shard-00-01.xekje7n.mongodb.net:27017," +
  "ac-mxvttls-shard-00-02.xekje7n.mongodb.net:27017/" +
  "RentEase?ssl=true&replicaSet=atlas-m6j763-shard-0&authSource=admin&retryWrites=true&w=majority";

const seedDatabaseSystemInitialization = async () => {
  try {
    console.log("Connecting securely to your explicit Cloud MongoDB Atlas shards...");
    await mongoose.connect(MONGO_URI);
    console.log("🏁 Database network handshake successful!");

    console.log("Verifying platform administrative identity profiles...");
    let targetOwnerAccount = await User.findOne({ role: 'admin' });
    if (!targetOwnerAccount) {
      targetOwnerAccount = await User.findOne({});
    }

    if (!targetOwnerAccount) {
      console.log("Zero records found in user database. Provisioning admin profile account...");
      targetOwnerAccount = new User({
        name: "RentEase Prime Hub Owner",
        email: "admin@rentease.com",
        password: "$2a$10$wE95M.1oYhD0wS2mU99x1eY8K9O2D3E4F5G6H7I8J9K0L1M2N3O4", 
        role: "admin",
        mobileNumber: "9999999999"
      });
      await targetOwnerAccount.save();
      console.log(`Successfully provisioned administrator account with ID: ${targetOwnerAccount._id}`);
    } else {
      console.log(`Verified active platform administrator account: ${targetOwnerAccount.name} (${targetOwnerAccount.email})`);
    }

    console.log("Flushing old product catalog tables safely...");
    await Product.deleteMany({});
    console.log("Products cleared.");

    console.log("✨ System initialized successfully! Cloud tables are clean and ready.");
    process.exit(0);
  } catch (error) {
    console.error("Critical error during system database initialization:", error);
    process.exit(1);
  }
};

seedDatabaseSystemInitialization();