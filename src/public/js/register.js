document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const id = document.getElementById('id').value;
        const pw = document.getElementById('pw').value;

        try {
            const response = await fetch('https://172.31.57.147:8001/members/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, id, pw }),
            });

            if (response.status === 201) {
                alert('회원가입 성공! 로그인 페이지로 이동합니다.');
                window.location.href = '/login';
            } else {
                const result = await response.json();
                alert(`회원가입 실패: ${result.detail || '알 수 없는 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('회원가입 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
        }
    });
});