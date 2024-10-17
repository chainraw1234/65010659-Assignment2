const API_BASE_URL = window.API_BASE_URL || 'https://six5010659-assignment2.onrender.com';

let currentPage = 1;
const pageSize = 20;

// ฟังก์ชันสำหรับโหลด Drone Config ทั้งหมดหรือกรองตาม drone_id
async function loadDroneConfig(searchId = '') {
    const configTableBody = document.getElementById('config-table').getElementsByTagName('tbody')[0];
    configTableBody.innerHTML = ''; // เคลียร์ข้อมูลก่อนโหลดใหม่

    try {
        const response = await fetch(`${API_BASE_URL}/configs`);
        if (!response.ok) {
            throw new Error('Failed to fetch config');
        }
        const configs = await response.json();

        // กรองข้อมูลตาม drone_id ถ้ามีการค้นหา
        const filteredConfigs = searchId ? configs.filter(config => config.drone_id.toString().includes(searchId)) : configs;

        // แสดงข้อมูลในตาราง
        filteredConfigs.forEach(config => {
            const rowHTML = `
                <tr>
                    <td>${config.drone_id}</td>
                    <td>${config.drone_name}</td>
                    <td>${config.light}</td>
                    <td>${config.max_speed}</td>
                    <td>${config.country}</td>
                    <td>${config.population}</td>
                </tr>
            `;
            configTableBody.innerHTML += rowHTML;
        });
    } catch (error) {
        configTableBody.innerHTML = '<tr><td colspan="6">Error loading config</td></tr>';
        console.error('Error fetching drone config:', error);
    }
}

// ฟังก์ชันสำหรับการค้นหา drone_id
function searchDroneConfig() {
    const searchId = document.getElementById('search-drone-id').value;
    loadDroneConfig(searchId); // โหลดข้อมูลตามคำค้นหา
}

// ฟังก์ชันสำหรับการ summit ข้อมูลอุณหภูมิ
async function submitTemperatureLog(event) {
    event.preventDefault();
    const drone_id = document.getElementById('drone_id').value;
    const drone_name = document.getElementById('drone_name').value;
    const celsius = document.getElementById('celsius').value;
    const country = document.getElementById('country').value;

    const logData = {
        drone_id: Number(drone_id),
        drone_name: drone_name,
        celsius: Number(celsius),
        country: country
    };

    try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });

        if (response.ok) {
            alert('Log submitted successfully!');
            loadDroneLogs();  // โหลด logs ใหม่หลังจากส่งข้อมูลเสร็จ
        } else {
            alert('Error submitting log');
        }
    } catch (error) {
        console.error('Error submitting log:', error);
        alert('Error submitting log');
    }
}

// ฟังก์ชันสำหรับการโหลดข้อมูล log
async function loadDroneLogs(page = 1) {
    const logsTable = document.getElementById('logs-table').getElementsByTagName('tbody')[0];
    logsTable.innerHTML = ''; // Clear the table

    try {
        const response = await fetch(`${API_BASE_URL}/logs?page=${page}&pageSize=${pageSize}`);
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        const logs = data.logs;

        logs.forEach(log => {
            const rowHTML = `
                <tr>
                    <td>${log.created}</td>
                    <td>${log.country}</td>
                    <td>${log.drone_id}</td>
                    <td>${log.drone_name}</td>
                    <td>${log.celsius}</td>
                </tr>
            `;
            logsTable.innerHTML += rowHTML;
        });

        // Update page controls
        document.getElementById('page-number').textContent = `Page ${page}`;
    } catch (error) {
        logsTable.innerHTML = '<tr><td colspan="5">Error loading logs</td></tr>';
        console.error('Error fetching drone logs:', error);
    }
}

// การแบ่งหน้า และเปลี่ยนหน้า
function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadDroneLogs(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadDroneLogs(currentPage);
    });
}

window.onload = () => {
    loadDroneConfig();  // Load Drone Config
    loadDroneLogs(currentPage); // Load Logs
    setupPagination(); // Setup pagination controls
};

// ฟังก์ชันส่ง log เมื่อผู้ใช้กดปุ่ม submit
document.getElementById('temperature-log-form').addEventListener('submit', submitTemperatureLog);
