// [commentsRouter] for '/api/comments'

// console.log("💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥");
// console.log("🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡");
// ------------------------------------------
const express = require('express');
const router = express.Router();

const Posts = require('../schemas/post.js');
const Comments = require('../schemas/comment.js');

// * 7.댓글 작성
// url : api/comments/:_postId
// - todo 댓글 내용 비워두고 댓글 작성 API 호출 시 -> '댓글 내용 입력해주세요' 메시지 return하기 기능
router.post('/comments/:_postId', async (req, res) => {
  const { _postId } = req.params;
  const { user, password, content } = req.body;

  // - todo Errorhandler2: body 또는 params 입력받지 못한 경우
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
  }

  // - todo Errorhandler1: content 댓글 내용 빈칸으로 호출 시
  if (!content.length) {
    return res.status(400).json({
      success: false,
      errorMessage: '댓글 내용을 입력해주세요.',
    });
  }

  // find the post exists
  const existsPosts = await Posts.find({ _id: _postId });
  if (existsPosts.length !== 0) {
    await Comments.create({
      user: user,
      password: password,
      content: content,
      postId: _postId,
    });
    return res.json({ message: '댓글 생성 완료.' });
  }

  return res.status(400).json({
    success: false,
    errorMessage: '해당하는 포스트가 없네요',
  });
});

// * 6.댓글 목록 조회
// url : api/comments/:_postId
// todo 조회하는 게시글에 작성된 모든 댓글을 목록 형식으로 보는 기능
// todo 작성 날짜 기준으로 내림차순 정렬
router.get('/comments/:_postId', async (req, res) => {
  try {
    const { _postId } = req.params;
    const existsPosts = await Posts.find({ _id: _postId });
    if (existsPosts.length !== 0) {
      const existsComments = await Comments.find({ postId: _postId }).sort({
        createdAt: 'desc',
      });
      const results = existsComments.map((comment) => {
        return {
          commentId: comment['_id'],
          user: comment['user'],
          content: comment['content'],
          createdAt: comment['createdAt'],
        };
      });
      return res.json({ data: results });
    }
  } catch (err) {
    return res.status(400).json({ success: false, errorMessage: '해당하는 포스트가 없네요' });
  }
});

// * 8.댓글 수정
// url : api/comments/:_postId
// todo 댓글 내용 비워두고 댓글 수정 API 호출 시 -> '댓글 내용 입력해주세요' 메시지 return하기 기능
router.put('/comments/:_commentId', async (req, res) => {
  try {
    const { _commentId } = req.params;
    const { password, content } = req.body;

    // - todo Errorhandler2: 빈 body로 요청 시
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
    }

    // - todo Errorhandler1: content 댓글 내용 빈칸으로 요청 시
    if (!content.length) {
      return res.status(400).json({
        success: false,
        errorMessage: '댓글 내용을 입력해주세요.',
      });
    }
    // _commentID에 해당하는 댓글 변수
    const existsComments = await Comments.find({ _id: _commentId });
    // 글 찾은 경우
    if (existsComments.length > 0) {
      await Comments.updateOne({ _id: _commentId }, { $set: { content } });
      return res.json({ message: '댓글을 수정하였습니다.' });
    }
  } catch (err) {
    // 댓글 조회 실패
    return res.status(400).json({
      success: false,
      errorMessage: '해당 댓글이 없네요',
    });
  }
  return res.status(400).json({
    success: false,
    errorMessage: '해당 댓글이 없네요',
  });
});

// * 9.댓글 삭제
// url : api/comments/:_postId
// todo 원하는 댓글 삭제하기 기능
router.delete('/comments/:_commentId', async (req, res) => {
  try {
    const { _commentId } = req.params;
    const { password } = req.body;

    // - todo Errorhandler2: 빈 body로 요청 시
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, errorMessage: 'body가 비었습니다.' });
    }
    // - todo Errorhandler1: content 댓글 내용 빈칸으로 요청 시
    if (!password.length) {
      return res.status(400).json({
        success: false,
        errorMessage: '댓글 내용을 입력해주세요.',
      });
    }

    const existsComments = await Comments.find({ _id: _commentId });
    // commentdId와 동일한 댓글 찾는 경우
    if (existsComments.length) {
      // - todo 비밀번호 동일 확인 체크
      if (existsComments[0]['password'] === password) {
        await Comments.deleteOne({ _id: _commentId });
        return res.json({ message: '댓글을 삭제하였습니다.' });
      } else {
        return res.status(400).json({
          success: false,
          errorMessage: '비밀번호가 틀립니다',
        });
      }
    }
  } catch (err) {
    return res.status(400).json({
      success: false,
      errorMessage: '댓글 조회에 실패',
    });
  }
  return res.status(400).json({
    success: false,
    errorMessage: 'last gate : 댓글 삭제에 실패했습니다',
  });
});

// ------------------------------------------
module.exports = router;
