import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is missing. Please configure it in your environment variables."
      );
    }

    console.log("MongoDB connection attempt started");

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected successfully");
    });

    mongoose.connection.on("disconnected", () => {
      console.error("Mongoose disconnected");
    });

    mongoose.connection.on("error", (error) => {
      console.error("Mongoose connection error:", error.message);
    });

    const connectionInstance = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `MongoDB connected successfully. Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
