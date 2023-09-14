const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 4
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String,
    },
    tokenExp: {
        type: Number
    }
})

// 저장하기 전에 실행한다
userSchema.pre("save", function (next) {
    const user = this;
    // 위 userSchema를 가리킨다.

    // 조건 : 비밀번호가 바뀔때만 암호화한다.
    if (user.isModified("password")) {
        // salt를 이용해서 비밀번호를 암호화함.
        // salt를 먼저 생성하고, saltRounds = 10 => 10자리 salt를 이용하여 암호화
        // 비밀번호를 암호화한다.

        bcrypt.genSalt(saltRounds, function (err, salt) {
            // error 발생시,
            if (err) return next(err)

            // salt 성공시,
            bcrypt.hash(user.password, salt, function (err, hash) {
                // Store hash in your password DB.
                if (err) return next(err);
                // hash를 만드는 것에 성공한다면, hash 비밀번호로 변경해준다.
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    } // 다른 것을 바꿀때
})

// 비밀번호 비교를 위한 메서드
// 현재버전
userSchema.methods.comparePassword = async function (plainPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, this.password);
        return isMatch;
    } catch (err) {
        throw err;
    }
};

userSchema.methods.generateToken = async function () {
    try {
        const user = this;
        const token = jwt.sign(user._id.toHexString(), "secretToken");
        user.token = token;
        await user.save();
        return token;
    } catch (err) {
        throw err;
    }
};

// 과거버전
// userSchema.methods.comparePassword = function (plainPassword, callback) {
//     // plainPassword 12345678 과
//     // 해시 암호와 비교함
//     bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
//         if (err) return callback(err);
//         callback(null, isMatch) // isMatch : true
//     })
// }

// // 토큰 생성을 위한 메서드
// userSchema.methods.generateToken = function (callback) {
//     const user = this;

//     // jsonwebtoken을 이용해서 token을 생성하기
//     // const token = jwt.sign(user._id, "secretToken");
//     const token = jwt.sign(user._id.toHexString(), "secretToken");
//     // sign에서 받을때, 에러발생

//     // user._id + "secretToken" = token
//     user.token = token;
//     user.save(function (err, user) {
//         if (err) return callback(err);
//         callback(null, user);
//     })
// }

const User = mongoose.model("User", userSchema);

module.exports = { User };