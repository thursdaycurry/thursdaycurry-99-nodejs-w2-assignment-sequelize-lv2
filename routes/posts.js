const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth-middleware")

const jwt = require("jsonwebtoken");
const SECRET_KEY = 'love';

const { Users, Posts, UserInfos } = require('../models');


// * 게시글 등록 API
router.post('/posts', authMiddleware, async(req, res) =>{
  
  try {
    const {title, content} = req.body;
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // console.log(`accessToken: ${accessToken}`)
    // console.log(`refreshToken: ${refreshToken}`)

    // # 412 body 데이터가 정상적으로 전달되지 않는 경우
    if (Object.keys(req.body).length === 0) res.status(400).json({"errorMessage": "데이터 형식이 올바르지 않습니다."});

    // # 412 Title의 형식이 비정상적인 경우
    if(!title) res.status(400).json({"errorMessage": "게시글 제목의 형식이 일치하지 않습니다."});

    // # 412 Content의 형식이 비정상적인 경우
    if(!content) res.status(400).json({"errorMessage": "게시글 내용의 형식이 일치하지 않습니다."});

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});
    if (!accessToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});

    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);
    
    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)"});
    if (!isAccessTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)"});

    // 토큰 활용하여 userId 추출
    const nameFromToken = getAccessTokenPayload(accessToken);
    console.log(`🐞당신은.. ${nameFromToken}`)

    const userIdAtServer = await Users.findOne({
      where: {name: nameFromToken}})
    const userNameAtServer = userIdAtServer['dataValues']['userId'];
    // console.log(`🐞userNameAtServer: ${userNameAtServer}`)

    // Insert data
    if (!!title && !!content) {
      await Posts.create({
        UserId: userNameAtServer, // dummy value 🤡
        title: title, 
        content: content
      })
      return res.json({"message": "게시글 작성에 성공하였습니다."});
    }

  } catch(error) {
  // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({"errorMessage": "게시글 작성에 실패하였습니다."});
  }
})


// * 전체 게시글 조회 API
router.get('/posts', async (req, res) => {
  try {
    const results = await Posts.findAll({
      include: [{ model: Users, attributes: ['name']}]
    });
    res.json({ data: results });
    return;

  } catch(error) { 
    return res.status(400).json({"errorMessage": "게시글 조회에 실패하였습니다."})
  }
})


// * 게시글 상세 조회 API
router.get("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await Posts.findOne({where: { postId: postId},});
    return res.json({ data : result });

  } catch(error) {
    return res.status(400).json({"errorMessage": "게시글 조회에 실패하였습니다."})
  }
});


// * 게시글 수정 API
router.put("/posts/:postId", authMiddleware , async (req, res) => {

  try {

    console.log(`🐞 res.locals.user : ${res.locals.user}`)

    const { postId } = req.params;
    const { title, content } = req.body;

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    // console.log(`🐞🐞 accessToken: ${accessToken}`)
    // console.log(`🐞🐞 refreshToken: ${refreshToken}`)

    // # 412 body 데이터가 정상적으로 전달되지 않는 경우
    if (Object.keys(req.body).length === 0) {
      res.status(400).json({"errorMessage": "데이터 형식이 올바르지 않습니다."});
      return;
    }
    // # 412 Title의 형식이 비정상적인 경우
    if(!title) {
      res.status(400).json({"errorMessage": "게시글 제목의 형식이 일치하지 않습니다."});
    }
    // # 412 Content의 형식이 비정상적인 경우
    if(!content) {
      res.status(400).json({"errorMessage": "게시글 내용의 형식이 일치하지 않습니다."});
    }
    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});
    if (!accessToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});
    
    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);
        
    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)"});
    if (!isAccessTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)"});
    
    // 토큰 검사 후 해당 사용자와 작성자 동일한 지 검증

    // 클라이언트 유저 아이디 : 토큰에서 유저 아이디 추출
    const nameFromToken = getAccessTokenPayload(accessToken);
    
    // 서버 유저 아이디 : 서버에 등록된 글 작성자
    const personWhoPosted = await Posts.findOne({
      attributes: ['postId', 'UserId'],
      where: {postId: postId}})
    const userIdWhoPostedAtServer = personWhoPosted['dataValues']['UserId'];
    const userNameWhoPostedAtServer = await Users.findOne({
      where: {userId: userIdWhoPostedAtServer}
    });
    const userNameAtServer = userNameWhoPostedAtServer['dataValues']['name']
    // console.log(`🐞 userIdWhoPostedAtServer: ${userIdWhoPostedAtServer}`)
    // console.log(`🐞 userNameWhoPostedAtServer: ${userNameWhoPostedAtServer}`)
    // console.log(`🐞 userNameAtServer: ${userNameAtServer}`)

    // 두개 동일하지 않으면 에러
    if(nameFromToken !== userNameAtServer) return res.status(419).json({"errorMessage": "당신이 작성한 글이 아닙니다.(작성자 불일치 에러)"});

    // 게시글 찾기 
    const result = await Posts.findOne({where: { postId: postId},});
    
    // 게시글 존재할 경우
    if(result) {
      // * 게시글 수정
      await Posts.update(
        {content: content}, 
        {where: { postId: postId}}
      );
      return res.json({"errorMessage": "게시글을 수정하였습니다."});
    }
    // # 401 게시글 수정이 실패한 경우
    return res.status(401).json({"errorMessage": "게시글이 정상적으로 수정되지 않았습니다."});

  } catch(error) {
    // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({"errorMessage": "게시글 수정에 실패하였습니다."});
  }
})


// * 게시글 삭제 API
router.delete("/posts/:postId", authMiddleware, async (req, res) => {

  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // 게시글 조회
    const result = await Posts.findOne({ where: { postId: postId},});

    // # 404 게시글이 존재하지 않는경우
    if(!result) {
      return res.status(400).json({"errorMessage": "게시글이 존재하지 않습니다."});
    }

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});
    if (!accessToken) return res.status(400).json({"errorMessage": "로그인이 필요한 기능입니다."});
    
    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);
        
    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)"});
    if (!isAccessTokenValidate) return res.status(419).json({"errorMessage": "전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)"});
    
    // 토큰 검사 후 해당 사용자와 작성자 동일한 지 검증

    // 클라이언트 유저 아이디 : 토큰에서 유저 아이디 추출
    const nameFromToken = getAccessTokenPayload(accessToken);
    
    // 서버 유저 아이디 : 서버에 등록된 글 작성자
    const personWhoPosted = await Posts.findOne({
      attributes: ['postId', 'UserId'],
      where: {postId: postId}})
    const userIdWhoPostedAtServer = personWhoPosted['dataValues']['UserId'];
    const userNameWhoPostedAtServer = await Users.findOne({
      where: {userId: userIdWhoPostedAtServer}
    });
    const userNameAtServer = userNameWhoPostedAtServer['dataValues']['name']

    // 두개 동일하지 않으면 에러
    if(nameFromToken !== userNameAtServer) return res.status(419).json({"errorMessage": "당신이 작성한 글이 아닙니다.(작성자 불일치 에러)"});
     

    // * 게시글 삭제(게시글 존재하는 경우)
    if (result) {
      await Posts.destroy({where: { postId: postId}});
      return res.json({"errorMessage": "게시글을 삭제하였습니다."}); 
    }
    
    // # 401 게시글 삭제에 실패한 경우
    return res.status(401).json({"errorMessage": "게시글이 정상적으로 삭제되지 않았습니다."});

  } catch(error) {

    console.log(error);

    // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({"errorMessage": "게시글 작성에 실패하였습니다."});
  }
})


// Access Token & Refresh Token 검증 함수
function validateToken(token) {
  try {
    jwt.verify(token, SECRET_KEY);
    return true;
  } catch (err) {
    return false;
  }
}

// AccessToken Payload 추출 함수
function getAccessTokenPayload(accessToken) {
  try {
    const {nickname} = jwt.verify(accessToken, SECRET_KEY);
    return nickname;
  } catch (err) {
    return null;
  }
}

// Access Token 생성 함수
function createAccessToken(nickname) {
  const accessToken = jwt.sign(
    {nickname: nickname},
    SECRET_KEY,
    { expiresIn: '20s'})
  
  return accessToken;
}

// Refresh Token 생성 함수
function createRefreshToken() {
  const refreshToken = jwt.sign(
    {},
    SECRET_KEY,
    { expiresIn: '1d'})
    
  return refreshToken;
}


module.exports = router;
