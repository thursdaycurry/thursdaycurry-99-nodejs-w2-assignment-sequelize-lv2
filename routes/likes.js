const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'love';

const { Likes, sequelize } = require('../models');

// * 게시글 좋아요 조회 - GET method
router.get('/likes', authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });
    if (!accessToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });

    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);

    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate) return res.status(419).json({ errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)' });
    if (!isAccessTokenValidate) return res.status(419).json({ errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)' });

    // 해당 좋아요의 경우 조회

    const [result, metadata] = await sequelize.query(`
    select 
      p.title, 
      u.name, 
      l.createdAt as dateToLike, 
      p.postId,
      (select count(isLiked) from Likes where PostId = p.postId) as like_cnt
    from Likes l 
    inner join Users u on l.UserId = u.userId
    inner join Posts p on l.PostId = p.postId
    where l.UserId = ${userId}
    order by like_cnt DESC
    `);

    res.json({ data: result });
    return;
  } catch (error) {
    // # 400 예외 케이스에서 처리하지 못한 에러
    console.log(`🐞error: ${error}`);
    return res.status(400).json({ errorMessage: '좋아요 게시글 조회에 실패하였습니다.' });
  }
});

function validateToken(token) {
  try {
    jwt.verify(token, SECRET_KEY);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = router;
