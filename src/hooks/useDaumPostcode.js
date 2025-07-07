// src/hooks/useDaumPostcode.js
import { useState } from 'react';

function useDaumPostcode() {
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');

  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('우편번호 검색 서비스를 불러올 수 없습니다.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        setPostcode(data.zonecode);
        setAddress(data.address);
      }
    }).open();
  };

  return {
    postcode,
    address,
    openPostcode,
    setPostcode,
    setAddress
  };
}

export default useDaumPostcode;
