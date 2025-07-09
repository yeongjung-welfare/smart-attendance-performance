<script setup>
import { onMounted } from 'vue'
import axios from 'axios'

onMounted(() => {
  axios.get(`${import.meta.env.VITE_API_BASE_URL}/hello`)
    .then(res => {
      console.log('✅ API 응답:', res.data)
    })
    .catch(err => {
      console.error('❌ API 호출 실패:', err)
    })
})
</script>

<template>
  <div>
    <h1>API 테스트 페이지</h1>
    <p>콘솔을 확인하세요</p>
  </div>
</template>