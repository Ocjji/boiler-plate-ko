if (process.env.NODE_ENV === "production") {
    module.exports = require("./prod");
} else {
    module.exports = require("./dev");
}

// Local 개발 환경과, 배포 후 환경에서 분기처리를 해줘야 함