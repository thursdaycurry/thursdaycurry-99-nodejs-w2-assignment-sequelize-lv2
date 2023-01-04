const express = require("express");

const Joi = require('joi');


const schema = Joi.object({
    nickname: Joi
        .string()
        .alphanum()
        .min(3),
    password: Joi
        .string()
        .min(4),
})

const router = express.Router();

const {Users} = require('../models');

// * 회원가입 API
router.post("/signup", async (req, res) => {

    try {

        const { nickname, password, confirm } = req.body;
        
        // Joi validator
        console.log(`🐞validated req: ${await schema.validateAsync({nickname: nickname, password: password})}`)

        // # 412 닉네임 형식이 비정상적인 경우
        if (!nickname) return res.status(400).json({"errorMessage": "닉네임의 형식이 일치하지 않습니다."});

        // # 412 passwordd 일치하지 않는 경우
        if(password !== confirm) return  res.status(400).json({"errorMessage": "패스워드와 확인용 패스워드가 다릅니다."});

        // # 412 password 형식이 비정상적인 경우
        if (!password) return res.status(400).json({"errorMessage": "패스워드 형식이 일치하지 않습니다."});

        // # 412 password에 닉네임이 포함되어있는 경우
        if (password.split(nickname).length > 1) return res.status(400).json({"errorMessage": "패스워드에 닉네임이 포함되어 있습니다."});
        
        // # 412 닉네임이 중복된 경우 
        const isExistNick = await Users.findOne({where: {name: nickname}});
        if (isExistNick) { 
            return res.status(400).json({"errorMessage": "중복된 닉네임입니다."});
        } else {
            await Users.create({
                name: nickname,
                password: password});
            return res.json({  "message": "회원 가입에 성공하였습니다."});
        }
        // # 400 예외 케이스에서 처리하지 못한 에러
        return res.status(400).json({"errorMessage": "요청한 데이터 형식이 올바르지 않습니다."});

    } catch(error) {
        return res.status(400).json({"errorMessage": "게시글 작성에 실패하였습니다."});
    }
})


module.exports = router;