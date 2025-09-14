document.addEventListener('DOMContentLoaded', async () => {
    const mypageForm = document.getElementById('mypageForm');
    const nameInput = document.getElementById('name');
    const idInput = document.getElementById('email');
    const newPwInput = document.getElementById('newPw');
    const confirmNewPwInput = document.getElementById('confirmNewPw');

    const token = localStorage.getItem('token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    // Fetch user data
    try {
        const response = await fetch('https://172.31.57.147:8001/members/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const userData = await response.json();
            nameInput.value = userData.name;
            idInput.value = userData.id;
        } else {
            const error = await response.json();
            alert(`사용자 정보를 불러오는데 실패했습니다: ${error.detail || '알 수 없는 오류'}`);
            window.location.href = '/home'; // Redirect if failed to load user data
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
        window.location.href = '/home';
        return;
    }

    // Handle form submission
    mypageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const oldPassword = document.getElementById('old_password').value;
        const newPassword = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Only proceed with password change if a new password is entered
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                alert('새 비밀번호가 일치하지 않습니다.');
                return;
            }

            if (!oldPassword) {
                alert('기존 비밀번호를 입력해주세요.');
                return;
            }

            const passwordData = {
                old_password: oldPassword,
                new_password: newPassword
            };

            try {
                const response = await fetch('https://172.31.57.147:8001/members/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(passwordData)
                });

                if (response.ok) {
                    alert('비밀번호가 성공적으로 변경되었습니다.');
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert(`비밀번호 변경에 실패했습니다: ${error.detail || '알 수 없는 오류'}`);
                }
            } catch (error) {
                console.error('Error updating password:', error);
                alert('비밀번호 변경 중 오류가 발생했습니다.');
            }
        }
        // Note: Name update logic is separate for now, as the API spec for it is unclear.
    });

    // Store original name to check for changes later
    nameInput.dataset.originalName = nameInput.value;
});