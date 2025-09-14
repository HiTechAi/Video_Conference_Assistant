document.addEventListener('DOMContentLoaded', async () => {
    const reportsContainer = document.getElementById('reports-container');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }

    try {
        // 1. Decode token to get user ID
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedPayload);
        const userId = payload.id;

        if (!userId) {
            throw new Error('사용자 ID를 토큰에서 찾을 수 없습니다.');
        }

        // 2. Construct URL with user ID
        const url = `https://172.31.57.147:8001/reports/me?id=${userId}`;

        // 3. Fetch reports
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const reports = await response.json();
            reportsContainer.innerHTML = ''; // Clear "Loading..." message

            if (reports.length === 0) {
                reportsContainer.innerHTML = '<p>표시할 회의 기록이 없습니다.</p>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'reports-table';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Participants</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            reports.forEach(report => {
                const row = document.createElement('tr');
                
                // Format date as YYYY-MM-DD HH:mm
                const date = new Date(report.uploadedAt);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                row.innerHTML = `
                    <td>${report.title}</td>
                    <td>${formattedDate}</td>
                    <td>${report.participants.join(', ')}</td>
                `;

                row.addEventListener('click', () => {
                    const newTab = window.open();
                    newTab.document.open();
                    newTab.document.write(report.content);
                    newTab.document.close();
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            reportsContainer.appendChild(table);

        } else {
            const error = await response.json();
            reportsContainer.innerHTML = `<p>회의 기록을 불러오는데 실패했습니다:</p><pre>${JSON.stringify(error, null, 2)}</pre>`;
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
        reportsContainer.innerHTML = `<p>회의 기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
    }
});
