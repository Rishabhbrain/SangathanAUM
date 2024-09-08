const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const dataFile = path.join(__dirname, 'data.json');

async function readData() {
    try {
        const data = await fs.readFile(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { leaderboard: [], sports: [], notices: [], results: {} };
    }
}

async function writeData(data) {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

app.get('/data', async (req, res) => {
    const data = await readData();
    res.json(data);
});

app.post('/update-leaderboard', async (req, res) => {
    const { team, points } = req.body;
    const data = await readData();
    const index = data.leaderboard.findIndex(entry => entry.team === team);
    if (index !== -1) {
        data.leaderboard[index].points = points;
    } else {
        data.leaderboard.push({ team, points });
    }
    data.leaderboard.sort((a, b) => b.points - a.points);
    await writeData(data);
    res.sendStatus(200);
});

app.post('/award-points', async (req, res) => {
    const { team, points } = req.body;
    const data = await readData();
    const index = data.leaderboard.findIndex(entry => entry.team === team);
    if (index !== -1) {
        data.leaderboard[index].points = Number(data.leaderboard[index].points) + Number(points);
    } else {
        data.leaderboard.push({ team, points: Number(points) });
    }
    data.leaderboard.sort((a, b) => b.points - a.points);
    await writeData(data);
    res.sendStatus(200);
});

app.post('/post-notice', async (req, res) => {
    const { notice } = req.body;
    const data = await readData();
    data.notices.unshift(notice);
    if (data.notices.length > 5) data.notices.pop();
    await writeData(data);
    res.sendStatus(200);
});

app.post('/declare-winners', async (req, res) => {
    const { sport, firstPlace, secondPlace, thirdPlace } = req.body;
    const data = await readData();
    data.results[sport] = { firstPlace, secondPlace, thirdPlace };
    await writeData(data);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/admin-login', (req, res) => {
    const { id, password } = req.body;
    if (id === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
