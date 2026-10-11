import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is missing. Please add your MongoDB connection string to the MONGODB_URI variable in the .env file."
      );
    }

    const connectionInstance = await mongoose.connect(mongoURI);

    console.log(
      `MongoDB connected successfully !! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
