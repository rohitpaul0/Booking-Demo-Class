import app from "./app.js";
import connectDB from "./db/db.js";

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();
