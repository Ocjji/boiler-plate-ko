const express = require('express');
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const config = require("./config/key.js");
const { User } = require("./models/User.js");
const { auth } = require("./middleware/auth.js");

// bodyParser는 express 4.x 버전 이후라면, express의 내장 미들웨어를 사용하여 본문을 파싱할 수 있고, 더 나은 성능을 얻을 수 있다.
// const bodyParser = require("body-parser");
// application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: true }));
// application/json
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// cookieParser 4.x 버전 이상해서는 express에서 기본 제공함
// 아래를 사용했는데 오류가 떴고, 아예 필요없음을 알았음
// app.use(express.cookieParser());

mongoose.connect(config.mongoURI, {})
    .then(() => console.log("mongoDB Connected"))
    .catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('Hello World!!! with Nodemon');
})

// mongoose 구버전에서 사용함
// app.post("/register", (req, res) => {
//     // 회원가입 필요 정보들을 client에서 가져오면,
//     // 그것들을 데이터 베이스에 넣어준다.
//     const user = new User(req.body);
//     user.save((err, userInfo) => {
//         if (err) return res.json({ success: false, err })
//         return res.status(200).json({
//             success: true
//         })
//     })
// })

// Router 사용을 고려하여, api/users/... 등으로 작성

// 회원가입 (신버전 mongoose 에서는 save() 메서드에서 Promises를 사용하도록 함)
app.post("/api/users/register", async (req, res) => {
    try {
        // 회원가입 필요 정보들을 client에서 가져오면,
        // 그것들을 데이터베이스에 넣어준다.

        const user = new User(req.body);

        await user.save();

        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        console.error("User Registration Error:", err);
        return res.status(500).json({
            success: false,
            error: "User registration failed",
        });
    }
});

// 로그인 Route

// 1. 과거버전으로 작성한 코드
// app.post("/login", (req, res) => {
//     // 1. 요청된 이메일을 데이터베이스에서 있는지 찾는다.
//     User.findOne({ email: req.body.email }, (err, user) => {
//         if (!user) {
//             return res.json({
//                 loginSuccess: false,
//                 message: "이메일을 확인해주세요."
//             })
//         }
//         // 2. 요청된 이메일이 데이터베이스에 있다면, 비밀번호를 확인한다.
//         // comparePassword 함수 생성하여, 비교함
//         user.comparePassword(req.body.password, (err, isMatch) => {
//             if (!isMatch)
//                 return res.json({ loginSuccess: false, message: "비밀번호를 확인해주세요." })
//             // 3. 비밀번호가 맞다면, 토큰을 생성한다.
//             user.generateToken((err, user) => {
//                 if (err) return res.status(400).send(err);

//                 // 토큰을 저장한다. 저장장소 - 쿠키, 로컬/세션스토리지 등
//                 // 쿠키사용
//                 res.cookie("x_auth", user.token)
//                     .status(200)
//                     .json({ loginSuccess: true, userId: user._id });
//             })
//         })
//     })
// })

// 2. 최근버전 로그인 기능구현
app.post("/api/users/login", async (req, res) => {
    try {
        // 1. 요청된 이메일을 데이터베이스에서 찾기
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.json({
                loginSuccess: false,
                message: "이메일을 확인해주세요."
            });
        }

        // 2. 요청된 이메일이 데이터베이스에 있다면, 비밀번호를 확인
        const isMatch = await user.comparePassword(req.body.password);

        if (!isMatch) {
            return res.json({ loginSuccess: false, message: "비밀번호를 확인해주세요." });
        }

        // 3. 비밀번호가 맞다면, 토큰을 생성
        const token = await user.generateToken();

        // 토큰을 저장 (쿠키 사용)
        res.cookie("x_auth", token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id });
    } catch (error) {
        return res.status(400).send(error.message || "로그인에 실패했습니다.");
    }
});

// Auth 기능 구현하기
app.get("/api/users/auth", auth, async (req, res) => {
    // 여기까지 미들웨어를 통과해 왔다는 이야기는
    // Authentication이 True 이다.


    try {
        res.status(200).json({
            _id: req.user._id,
            isAdmin: req.user.role === 0 ? false : true,
            isAuth: true,
            email: req.user.email,
            name: req.user.name,
            lastname: req.user.lastname,
            role: req.user.role,
            image: req.user.image
        });

    } catch (error) {

    }
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})