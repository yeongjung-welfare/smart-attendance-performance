// 📁 backend/server.cjs
const app = require('./index'); // index.js에서 app 불러오기

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ API 서버가 ${PORT}번 포트에서 실행 중!`);
});