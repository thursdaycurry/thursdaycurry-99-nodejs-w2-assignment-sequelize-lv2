// schemas/index.js 파일 용도 : mongodb - mongoos 연결 위함
const mongoose = require("mongoose");

// mongoose connect 메서드로 mongoDB 연결
const connect = () => {
  mongoose
    .connect("mongodb://localhost:27017/admin", {
      dbName: "99-w1-api",
      ignoreUndefined: true,
    })
    .catch((error) => {
      console.error(error);
    });
};

mongoose.connection.on("error", (err) => {
  console.log("몽고db 연결 중 에러 감지: ", err);
});

module.exports = connect;
