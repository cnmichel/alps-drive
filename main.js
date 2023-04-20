const app = require("./server");
const fs = require('node:fs');
const os = require('node:os');


// API ROUTES //

app.get('/api/drive', async (req, res) => {
    // Set the header content type
    res.setHeader("Content-Type", "application/json");
    // Get the path of the system temp directory
    const path = os.tmpdir();
    try {
        // Fetching data
        const data = await readDirectory(path);
        // Send response with data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
    }
})

app.get('/api/drive/:name', async (req, res) => {
    // Fetch data from request
    const name = req.params.name;
    // Get the path of the directory or filename
    const path = os.tmpdir() + `/${name}`;
    try {
        // Fetch directory content
        if (fs.lstatSync(path).isDirectory()) {
            res.setHeader("Content-Type", "application/json");
            const data = await readDirectory(path);
            res.json(data);
            return;
        }
        // Fetch file content
        if (fs.lstatSync(path).isFile()) {
            res.setHeader("Content-Type", "application/octet-stream");
            // Read file content
            const data = await fs.promises.readFile(path, { encoding: 'utf8' });
            res.send(data);
            return;
        }
    } catch (err) {
        console.error(err);
    }
    res.status(404).send('No such file or directory');
})


// METHODS //

const readDirectory = async (path) => {
    const items = await fs.promises.readdir(path, {withFileTypes: true});
    return items.map((item) => {
        if (item.isDirectory()) {
            return {
                name: item.name,
                isFolder: item.isDirectory(),
            }
        } else {
            return {
                name: item.name,
                isFolder: item.isDirectory(),
                size: fs.statSync(path + `/${item.name}`).size
            }
        }
    });
}