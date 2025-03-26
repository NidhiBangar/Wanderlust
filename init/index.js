const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb+srv://nidhi:RVLFF6aaXbNCwUDz@cluster0.hqwtfle.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

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
        const dataWithOwner = initData.data.map((obj) => ({ 
            ...obj, 
            owner: "67e41ff45af8212770d06e91",
            // Add default geometry data
            geometry: {
                type: "Point",
                coordinates: [77.2090, 28.6139] // Default coordinates (New Delhi)
            }
        }));
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
