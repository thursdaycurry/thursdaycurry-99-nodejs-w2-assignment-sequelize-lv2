// express.js setup
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

// mongoDB setup
const connect = require('./schemas');
connect();

const routers = require('./routes/index');

const { sequelize } = require('./models/index.js');
async function main() {
  // sequelize에 테이블들이 존재하지 않는 경우 태이블을 생성합니다.
  await sequelize.sync();
  // await sequelize.sync({ force: true }); // DB 밀어버리고 재생성
}
main();

app.use(express.json());
app.use(cookieParser());

app.use(routers);

app.listen(port, () => {
  console.log(port, '포트로 서버 개방');
});
