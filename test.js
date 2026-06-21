import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb+srv://angad28032005_db_user:PioiszTA9E7EzXPo@cluster0.m9kboyu.mongodb.net/blood_donor?retryWrites=true&w=majority",
  )
  .then(() => {
    console.log("MongoDB Connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
