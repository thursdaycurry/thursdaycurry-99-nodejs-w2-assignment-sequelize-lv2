const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'love';

const { Users, Posts, Comments, sequelize } = require('../models');

// * 7.댓글 작성
// url : api/comments/:_postId
// - todo 댓글 내용 비워두고 댓글 작성 API 호출 시 -> '댓글 내용 입력해주세요' 메시지 return하기 기능

router.post('/comments/:_postId', authMiddleware, async (req, res) => {
  try {
    const { _postId } = req.params;
    const { comment } = req.body;

    console.log(`🐞_postId: ${_postId}`);

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    console.log(`👹 accessToken: ${accessToken}`);
    console.log(`👹 refreshToken: ${refreshToken}`);
    // # 412 body 데이터가 정상적으로 전달되지 않는 경우
    // {"errorMessage": "데이터 형식이 올바르지 않습니다."}
    // - todo Errorhandler2: body 또는 params 입력받지 못한 경우
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
    }

    // - todo Errorhandler1: content 댓글 내용 빈칸으로 호출 시
    if (!comment.length) {
      return res.status(400).json({
        success: false,
        errorMessage: '댓글 내용을 입력해주세요.',
      });
    }

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });
    if (!accessToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });

    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);

    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate) return res.status(419).json({ errorMessage: '403 전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)' });
    if (!isAccessTokenValidate) return res.status(419).json({ errorMessage: '403 전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)' });

    const existsPosts = await Posts.findOne({ where: { postId: _postId } });
    console.log(`👹 existsPosts: ${existsPosts}`);

    if (!!existsPosts) {
      await Comments.create({
        UserId: res.locals.userId,
        PostId: _postId,
        comment: comment,
      });
      return res.json({ message: '댓글을 작성하였습니다.' });
    }
    // # 401 게시글 수정이 실패한 경우
    return res.status(400).json({ errorMessage: '게시글이 존재하지 않습니다.' });
  } catch (error) {
    console.log(`👹 error: ${error}`);
    // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({ errorMessage: '게시글 작성에 실패하였습니다.' });
  }
});

// * 6.댓글 목록 조회
// url : api/comments/:_postId
// todo 조회하는 게시글에 작성된 모든 댓글을 목록 형식으로 보는 기능
// todo 작성 날짜 기준으로 내림차순 정렬

router.get('/comments/:_postId', async (req, res) => {
  try {
    const { _postId } = req.params;
    const existsPosts = await Posts.findOne({ where: { postId: _postId } });
    console.log(`👹 existsPosts: ${JSON.stringify(existsPosts)}`);

    // if (!!existsPosts) {
    //   const [result, metadata] = await sequelize.query(`
    //     select *
    //     from Comments
    //     where PostId =${_postId}
    //   `);
    //   console.log(`👹 result: ${result}`);

    //   return res.json({ data: result });
    // }

    if (!!existsPosts) {
      const result = await Comments.findAll({
        where: { PostId: _postId },
        order: sequelize.literal('createdAt DESC'),
      });

      if (result) {
        return res.json({ data: result });
      }
    }
    // # 400 게시글이 없는 경우
    return res.status(400).json({ errorMessage: '게시글이 존재하지 않습니다.' });
  } catch (error) {
    console.log(`👹 error: ${error}`);
    // # 400 예외 케스서 처하 못한 에러
    return res.status(400).json({ errorMessage: '댓글 조회에 실패했습니다.' });
  }
});

// router.get('/comments/:_postId', async (req, res) => {
//   try {
//     const { _postId } = req.params;
//     const existsPosts = await Posts.find({ _id: _postId });
//     if (existsPosts.length !== 0) {
//       const existsComments = await Comments.find({ postId: _postId }).sort({
//         createdAt: 'desc',
//       });
//       const results = existsComments.map((comment) => {
//         return {
//           commentId: comment['_id'],
//           user: comment['user'],
//           content: comment['content'],
//           createdAt: comment['createdAt'],
//         };
//       });
//       return res.json({ data: results });
//     }
//   } catch (err) {
//     return res.status(400).json({ success: false, errorMessage: '해당하는 포스트가 없네요' });
//   }
// });

// * 8.댓글 수정
// url : api/comments/:_postId
// todo 댓글 내용 비워두고 댓글 수정 API 호출 시 -> '댓글 내용 입력해주세요' 메시지 return하기 기능
router.put('/comments/:_commentId', authMiddleware, async (req, res) => {
  try {
    const { _commentId } = req.params;
    const { comment } = req.body;

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });
    if (!accessToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });

    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);

    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate)
      return res.status(419).json({
        errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)',
      });
    if (!isAccessTokenValidate)
      return res.status(419).json({
        errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)',
      });

    // # 412 body 데이터가 정상적으로 전달되지 않는 경우
    if (Object.keys(req.body).length === 0) {
      res.status(400).json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    // # 404 댓글이 존재하지 않는경우
    if (!comment) res.status(400).json({ errorMessage: '댓글이 존재하지 않습니다.' });

    console.log(`👹👹👹👹👹👹👹👹👹👹👹`);
    // 토큰 유효 검사

    // 클라이언트 유저 아이디 : 토큰에서 유저 아이디 추출
    const nameFromToken = getAccessTokenPayload(accessToken);

    // 서버 유저 아이디 : 서버에 등록된 댓글 작성자
    const personWhoPosted = await Comments.findOne({
      attributes: ['postId', 'UserId'],
      where: { commentId: _commentId },
    });
    console.log(`👹 personWhoPosted: ${JSON.stringify(personWhoPosted)}`);

    const userIdWhoPostedAtServer = personWhoPosted['dataValues']['UserId'];
    console.log(`🐞 userIdWhoPostedAtServer: ${userIdWhoPostedAtServer}`);

    const userNameWhoPostedAtServer = await Users.findOne({
      where: { userId: userIdWhoPostedAtServer },
    });
    console.log(`🐞 userNameWhoPostedAtServer: ${userNameWhoPostedAtServer}`);

    const userNameAtServer = userNameWhoPostedAtServer['dataValues']['name'];
    console.log(`🐞 userNameAtServer: ${userNameAtServer}`);

    // 두개 동일하지 않으면 에러
    if (nameFromToken !== userNameAtServer)
      return res.status(419).json({
        errorMessage: '당신이 작성한 글이 아닙니다.(작성자 불일치 에러)',
      });

    if (comment) {
      await Comments.update({ comment: comment }, { where: { commentId: _commentId } });
      return res.json({ errorMessage: '댓글을 수정하였습니다.' });
    }
    // # 400 댓글 수정에 실패한 경우
    return res.status(400).json({ errorMessage: '댓글 수정이 정상적으로 처리되지 않았습니다.' });
  } catch (error) {
    // # 400 예외 케이스에서 처리하지 못한 에러
    // {"errorMessage": "댓글 수정에 실패하였습니다."}
  }
});

// // * 8.댓글 수정
// // url : api/comments/:_postId
// // todo 댓글 내용 비워두고 댓글 수정 API 호출 시 -> '댓글 내용 입력해주세요' 메시지 return하기 기능
// router.put('/comments/:_commentId', async (req, res) => {
//   try {
//     const { _commentId } = req.params;
//     const { password, content } = req.body;

//     // - todo Errorhandler2: 빈 body로 요청 시
//     if (Object.keys(req.body).length === 0) {
//       return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
//     }

//     // - todo Errorhandler1: content 댓글 내용 빈칸으로 요청 시
//     if (!content.length) {
//       return res.status(400).json({
//         success: false,
//         errorMessage: '댓글 내용을 입력해주세요.',
//       });
//     }
//     // _commentID에 해당하는 댓글 변수
//     const existsComments = await Comments.find({ _id: _commentId });
//     // 글 찾은 경우
//     if (existsComments.length > 0) {
//       await Comments.updateOne({ _id: _commentId }, { $set: { content } });
//       return res.json({ message: '댓글을 수정하였습니다.' });
//     }
//   } catch (err) {
//     // 댓글 조회 실패
//     return res.status(400).json({
//       success: false,
//       errorMessage: '해당 댓글이 없네요',
//     });
//   }
//   return res.status(400).json({
//     success: false,
//     errorMessage: '해당 댓글이 없네요',
//   });
// });

// * 9.댓글 삭제
// url : api/comments/:_postId
// todo 원하는 댓글 삭제하기 기능

router.delete('/comments/:_commentId', async (req, res) => {
  try {
    const { _commentId } = req.params;

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // # 403 Cookie가 존재하지 않을 경우
    if (!refreshToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });
    if (!accessToken) return res.status(400).json({ errorMessage: '로그인이 필요한 기능입니다.' });

    // refresh/access 유효 여부 검사
    const isAccessTokenValidate = validateToken(accessToken);
    const isRefreshTokenValidate = validateToken(refreshToken);

    // # 403 Cookie가 비정상적이거나 만료된 경우
    if (!isRefreshTokenValidate)
      return res.status(419).json({
        errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Refresh Cookie 없음)',
      });
    if (!isAccessTokenValidate)
      return res.status(419).json({
        errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.(Access Cookie 없음)',
      });

    // # 404 댓글이 존재하지 않는경우
    const comment = await Comments.findOne({ where: { commentId: _commentId } });
    if (!comment) return res.status(400).json({ errorMessage: '댓글이 존재하지 않습니다.' });

    // 토큰 유효 검사

    // 클라이언트 유저 아이디 : 토큰에서 유저 아이디 추출
    const nameFromToken = getAccessTokenPayload(accessToken);

    // 서버 유저 아이디 : 서버에 등록된 댓글 작성자
    const personWhoPosted = await Comments.findOne({
      attributes: ['postId', 'UserId'],
      where: { commentId: _commentId },
    });
    console.log(`👹 personWhoPosted: ${JSON.stringify(personWhoPosted)}`);

    const userIdWhoPostedAtServer = personWhoPosted['dataValues']['UserId'];
    console.log(`🐞 userIdWhoPostedAtServer: ${userIdWhoPostedAtServer}`);

    const userNameWhoPostedAtServer = await Users.findOne({
      where: { userId: userIdWhoPostedAtServer },
    });
    console.log(`🐞 userNameWhoPostedAtServer: ${userNameWhoPostedAtServer}`);

    const userNameAtServer = userNameWhoPostedAtServer['dataValues']['name'];
    console.log(`🐞 userNameAtServer: ${userNameAtServer}`);

    // 두개 동일하지 않으면 에러
    if (nameFromToken !== userNameAtServer)
      return res.status(419).json({
        errorMessage: '당신이 작성한 댓글이 아닙니다.(작성자 불일치 에러)',
      });

    if (comment) {
      await Comments.destroy({ where: { commentId: _commentId } });
      return res.json({ errorMessage: '댓글을 삭제하였습니다.' });
    }
    // # 400 댓글 수정에 실패한 경우
    return res.status(401).json({ errorMessage: '댓글이 정상적으로 삭제되지 않았습니다.' });
  } catch (error) {
    console.log(`🐞 error: ${error}`);

    // # 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({ errorMessage: '댓글 삭제에 실패하였습니다.' });
  }
});

// router.delete('/comments/:_commentId', async (req, res) => {
//   try {
//     const { _commentId } = req.params;
//     const { password } = req.body;

//     // - todo Errorhandler2: 빈 body로 요청 시
//     if (Object.keys(req.body).length === 0) {
//       return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
//     }
//     // - todo Errorhandler1: content 댓글 내용 빈칸으로 요청 시
//     if (!password.length) {
//       return res.status(400).json({
//         success: false,
//         errorMessage: '댓글 내용을 입력해주세요.',
//       });
//     }

//     const existsComments = await Comments.find({ _id: _commentId });
//     // commentdId와 동일한 댓글 찾는 경우
//     if (existsComments.length) {
//       // - todo 비밀번호 동일 확인 체크
//       if (existsComments[0]['password'] === password) {
//         await Comments.deleteOne({ _id: _commentId });
//         return res.json({ message: '댓글을 삭제하였습니다.' });
//       } else {
//         return res.status(400).json({
//           success: false,
//           errorMessage: '비밀번호가 틀립니다',
//         });
//       }
//     }
//   } catch (err) {
//     return res.status(400).json({
//       success: false,
//       errorMessage: '댓글 조회에 실패',
//     });
//   }
//   return res.status(400).json({
//     success: false,
//     errorMessage: 'last gate : 댓글 삭제에 실패했습니다',
//   });
// });

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
    const { nickname } = jwt.verify(accessToken, SECRET_KEY);
    return nickname;
  } catch (err) {
    return null;
  }
}

// ------------------------------------------
module.exports = router;
