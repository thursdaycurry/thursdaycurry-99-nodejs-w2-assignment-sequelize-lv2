// middlewares/auth-middleware.js

const jwt = require('jsonwebtoken');
const { Users } = require('../models');

const SECRET_KEY = 'love';

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || '').split(' ');

  console.log(`🧆 req.headers.authorization(middleware): ${authorization}`);
  console.log(`🧆 authType: ${authType}`);
  console.log(`🧆 authToken: ${authToken}`);

  if (!authToken || authType !== 'Bearer') {
    console.log(`🧆 토큰에 문제가 있다`);
    res.status(401).send({
      errorMessage: '🧆로그인 후 이용 가능한 기능입니다.(토큰이 없거나 Bearer Auth가 아님)',
    });
    return;
  }

  try {
    const { nickname } = jwt.verify(authToken, SECRET_KEY);
    console.log(`🧆🧆 nickname: ${nickname}`);
    const nicknameAtServer = await Users.findOne({ where: { name: nickname } });

    res.locals.user = nicknameAtServer['dataValues']['name'];
    res.locals.userId = nicknameAtServer['dataValues']['userId'];

    console.log(`🧆🧆 당신은 글을 써도 됩니다. ${res.locals.user}님`);
    console.log(`🧆test: ${nicknameAtServer['dataValues']['userId']}`);
  } catch (err) {
    console.log(`🧆err: ${err}`);
    res.status(401).send({
      errorMessage: '🧆 로그인 후 이용 가능한 기능입니다.(토큰 검증 실패)',
    });
    return;
  }

  next();
};
