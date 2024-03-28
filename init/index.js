const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");
        await initDB();
        mongoose.connection.close(); // Close the connection after initialization
    } catch (err) {
        console.error("Error connecting to DB:", err);
    }
}

async function initDB() {
    try {
        await Listing.deleteMany({});
        const dataWithOwner = initData.data.map((obj) => ({ ...obj, owner: "6601979ab15c18ac3b7dfabd"}));
        const dataWithValidImage = dataWithOwner.map((obj) => ({
            ...obj,
            image: obj.image // Now 'image' directly holds the URL string
        }));
        await Listing.insertMany(dataWithValidImage);
        console.log("Data was initialized");
    } catch (err) {
        console.error("Error initializing data:", err);
    }
}

main();
