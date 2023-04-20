const app = require("./server");
const fs = require('node:fs');
const os = require('node:os');
const p = require('node:path');


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
    const path = p.join(os.tmpdir(), name);
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

app.post('/api/drive', async (req, res) => {
    // Fetch data from request
    const name = req.query.name;
    // Get path for new directory
    const path = p.join(os.tmpdir(), name);
    try {
        // Check if directory name is valid
        if (validateName(name)) {
            // Create new directory
            await fs.promises.mkdir(path);
            res.status(201).send(`New directory ${name} created`);
            return;
        }
        // Return error if name is invalid
        res.status(400).send('Invalid name input');
    } catch (err) {
        console.error(err);
    }
})

app.post('/api/drive/:folder', async (req, res) => {
    // Fetch data from request
    const folder = req.params.folder;
    const name = req.query.name;
    // Get path for directories
    const dirPath = p.join(os.tmpdir(), folder);
    const path = p.join(os.tmpdir(), folder, name);
    try {
        // Check if current directory exist
        if (fs.existsSync(dirPath)) {
            if (validateName(name)) {
                await fs.promises.mkdir(path);
                res.status(201).send(`New directory ${name} created with success`);
                return;
            }
            res.status(400).send('Invalid name input');
            return;
        }
        // Return error if directory does not exist
        res.status(404).send(`Directory ${folder} does not exist`);
    } catch (err) {
        console.error(err);
    }
})

app.delete('/api/drive/:name', async (req, res) => {
    // Fetch data from request
    const name = req.params.name;
    // Get path for directory or file
    const path = p.join(os.tmpdir(), name);
    try {
        // Check if directory or file name is valid
        if (validateName(name)) {
            // Delete directory or file
            await fs.promises.rm(path, {recursive: true});
            res.status(200).send(`${name} deleted with success`);
            return;
        }
        // Return error if name is invalid
        res.status(400).send('Invalid directory or file name');
    } catch (err) {
        console.error(err);
    }
})

app.delete('/api/drive/:folder/:name', async (req, res) => {
    // Fetch data from request
    const folder = req.params.folder;
    const name = req.params.name;
    // Get path for directory or file
    const dirPath = p.join(os.tmpdir(), folder);
    const path = p.join(os.tmpdir(), folder, name);
    try {
        // Check if current directory exist
        if (fs.existsSync(dirPath)) {
            if (validateName(name)) {
                await fs.promises.rm(path, {recursive: true});
                res.status(200).send(`${name} deleted with success`);
                return;
            }
            res.status(400).send('Invalid directory or file name');
            return;
        }
        // Return error if directory does not exist
        res.status(404).send(`Directory ${folder} does not exist`);
    } catch (err) {
        console.error(err);
    }
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
                size: fs.statSync(p.join(path, item.name)).size
            }
        }
    });
}

const validateName = (name) => {
    // Regex to check directory name
    const regex = new RegExp(/^[a-z0-9_.]+$/i);
    return regex.test(name);
}
