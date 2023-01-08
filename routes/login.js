const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'love';

const { Users, UserInfos } = require('../models');

// * 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    // TODO DB 내 등록된 닉네임 확인 : UserInfos의 키값을 비교하는 것으로 변경
    const result = await Users.findOne({ where: { name: nickname } });

    // DB 내 등록된 닉네임 없는 경우 -> 400
    if (!result) return res.status(400).json({ errorMessage: '등록되지 않은 닉네임입니다.' });

    // DB 내 등록된 닉네임 있는 경우, 비밀번호 일치 여부하는 경우 있는지
    // 닉네임 존재할 경우
    if (result) {
      const passwordAtServer = result['dataValues']['password'];

      if (password !== passwordAtServer) {
        return res.status(400).json({ errorMessage: '비밀번호를 다시 확인해주세요.' });
      } else {
        // 로그인 성공, JWT Cookie 발급
        const accessToken = createAccessToken(nickname);
        const refreshToken = createRefreshToken();
        // console.log(`refreshToken: ${refreshToken}`)
        // console.log(`refreshToken type: ${typeof refreshToken}`)

        // 저장소 refreshToken 저장
        UserInfos.create({
          refreshToken: refreshToken,
          nickname: nickname,
        });

        // access, refresh Token 클라이언트에게 발급
        res.cookie('accessToken', accessToken);
        res.cookie('refreshToken', refreshToken);
        res.cookie('authorization', 'Bearer ' + accessToken);

        console.log(`🐞authorization : Bearer ${accessToken}`);

        return res.status(200).send({ message: '토큰 정상 발급 완료' });
      }
    }
    // # 412 해당하는 유저가 존재하지 않는 경우
    return res.status(401).json({ errorMessage: '닉네임 또는 패스워드를 확인해주세요.' });
  } catch (error) {
    // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({ errorMessage: '로그인에 실패하였습니다.' });
  }
});

// Access Token 생성 함수
function createAccessToken(nickname) {
  const accessToken = jwt.sign({ nickname: nickname }, SECRET_KEY, {
    expiresIn: '600s',
  });

  return accessToken;
}

// Refresh Token 생성 함수
function createRefreshToken() {
  const refreshToken = jwt.sign({}, SECRET_KEY, { expiresIn: '1d' });
  return refreshToken;
}

module.exports = router;
