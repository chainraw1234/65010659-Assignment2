const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());  // Enable CORS for all routes

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // For serving static files

const DRONE_CONFIG_URL = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec';
const DRONE_LOGS_URL = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records?page=11';

app.get('/configs', async (req, res) => {
    try {
        const response = await axios.get(DRONE_CONFIG_URL);
        const logs = response.data.data;  

        if (!logs) {
            return res.status(404).send('No logs found');
        }

        const formattedLogs = logs.map(log => ({
            drone_id: log.drone_id,
            drone_name: log.drone_name,
            light: log.light,
            max_speed: log.max_speed > 110 ? 110 : log.max_speed, // สร้างเงื่อนไข > 110 ไห้เป็น 110
            country: log.country,
            population: log.population
        }));

        console.log(formattedLogs);
        res.json(formattedLogs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching logs');
    }
});

app.get('/configs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(DRONE_CONFIG_URL);
        if (!response.data.data) {
            return res.status(500).send('Invalid response from API');
        }
        let data = response.data.data;
        const config = data.find(drone => drone.drone_id == id);

        if (!config) {
            return res.status(404).send('Drone not found');
        }

        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching drone status');
    }
});

app.get('/logs', async (req, res) => {
    try {
        const { page = 1, pageSize = 20 } = req.query; // Default to page 1 and 20 items per page
        let allLogs = [];
        let currentPage = 1;
        let hasMorePages = true;

        // การดึงข้อมูล log ทั้งหมดจาก API(เนื่องจากข้อมูลมีมากกว่า 1 หน้า)
        while (hasMorePages) {
            const response = await axios.get(`https://app-tracking.pockethost.io/api/collections/drone_logs/records?page=${currentPage}`);
            const logs = response.data.items;

            if (!logs || logs.length === 0) {
                hasMorePages = false;
            } else {
                allLogs = allLogs.concat(logs);
                currentPage++;
            }
        }

        // การคัดกรองและเรียงลำดับข้อมูล log(เรียงตามเวลา ล่าสุดขึ้นก่อน)
        const filteredLogs = allLogs.filter(log =>
            log.created && log.country && log.drone_id && log.drone_name && log.celsius
        );

        const sortedLogs = filteredLogs.sort((a, b) => new Date(b.created) - new Date(a.created));

        // การแบ่งหน้า
        const startIndex = (page - 1) * pageSize;
        const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

        // การส่งข้อมูลกลับไปยัง user
        res.json({ logs: paginatedLogs, total: sortedLogs.length });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).send('Error fetching logs');
    }
});


app.post('/logs', async (req, res) => {
    try {
        const response = await axios.post(DRONE_LOGS_URL, req.body, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        res.status(response.status).send("ok");
    } catch (error) {
        console.error('Error posting logs:', error);
        res.status(500).send('Error saving log data');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
