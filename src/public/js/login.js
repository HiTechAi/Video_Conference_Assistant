document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const pw = document.getElementById('pw').value;

        try {
            const response = await fetch('https://172.31.57.147:8001/members/login', { // Assuming FastAPI runs on port 8000
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // The backend model expects a 'name', so we send a dummy one.
                body: JSON.stringify({ name: 'dummy', id, pw }),
            });

            const result = await response.json();

            if (response.ok && result.access_token) {
                alert('로그인 성공!');
                // The new backend returns name, so we can store it
                sessionStorage.setItem('nickname', result.name);
                localStorage.setItem('token', result.access_token);
                window.location.href = '/home'; // Redirect to home page
            } else {
                alert(`Login failed: ${result.detail || 'Invalid credentials'}`);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login. Please check the console.');
        }
    });
});
