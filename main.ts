import app from './server';
import { existsSync, lstatSync, promises, statSync, Dirent } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const rootDir = tmpdir();

export interface File {
    name: string,
    isFolder: boolean,
    size?: number
}

// API ROUTES //

app.get('/api/drive', async (req: any, res: any) => {
    // Set the header content type
    res.setHeader("Content-Type", "application/json");
    try {
        // Fetching data
        const data: File[] = await readDirectory(rootDir);
        // Send response with data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
    }
})

app.get('/api/drive/:name', async (req: any, res: any) => {
    // Fetch data from request
    const name: string = req.params.name;
    // Get the path of the directory or filename
    const path: string = join(rootDir, name);
    try {
        // Fetch directory content
        if (lstatSync(path).isDirectory()) {
            res.setHeader("Content-Type", "application/json");
            const data: File[] = await readDirectory(path);
            res.json(data);
            return;
        }
        // Fetch file content
        if (lstatSync(path).isFile()) {
            res.setHeader("Content-Type", "application/octet-stream");
            // Read file content
            const data: string = await promises.readFile(path, { encoding: 'utf8' });
            res.send(data);
            return;
        }
    } catch (err) {
        console.error(err);
    }
    res.status(404).send('No such file or directory');
})

app.post('/api/drive', async (req: any, res: any) => {
    // Fetch data from request
    const name: string = req.query.name;
    // Get path for new directory
    const path: string = join(rootDir, name);
    try {
        // Check if directory name is valid
        if (validateName(name)) {
            // Create new directory
            await promises.mkdir(path);
            res.status(201).send(`New directory ${name} created`);
            return;
        }
        // Return error if name is invalid
        res.status(400).send('Invalid name input');
    } catch (err) {
        console.error(err);
    }
})

app.post('/api/drive/:folder', async (req: any, res: any) => {
    // Fetch data from request
    const folder = req.params.folder;
    const name = req.query.name;
    // Get path for directories
    const dirPath: string = join(rootDir, folder);
    const path: string = join(rootDir, folder, name);
    try {
        // Check if current directory exist
        if (existsSync(dirPath)) {
            if (validateName(name)) {
                await promises.mkdir(path);
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

app.delete('/api/drive/:name', async (req: any, res: any) => {
    // Fetch data from request
    const name = req.params.name;
    // Get path for directory or file
    const path = join(rootDir, name);
    try {
        // Check if directory or file name is valid
        if (validateName(name)) {
            // Delete directory or file
            await promises.rm(path, {recursive: true});
            res.status(200).send(`${name} deleted with success`);
            return;
        }
        // Return error if name is invalid
        res.status(400).send('Invalid directory or file name');
    } catch (err) {
        console.error(err);
    }
})

app.delete('/api/drive/:folder/:name', async (req: any, res: any) => {
    // Fetch data from request
    const folder = req.params.folder;
    const name = req.params.name;
    // Get path for directory or file
    const dirPath = join(rootDir, folder);
    const path = join(rootDir, folder, name);
    try {
        // Check if current directory exist
        if (existsSync(dirPath)) {
            if (validateName(name)) {
                await promises.rm(path, {recursive: true});
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

app.put('/api/drive', async (req: any, res: any) => {
    // Fetch data from request
    const files = req.files;
    try {
        // Check if file exist in request
        if (Object.keys(files).length > 0) {
            const {file: {file, filename}} = files;
            // Get path for new file
            const path = join(rootDir, filename);
            // Create file in directory
            await promises.copyFile(file, path);
            res.status(201).send(`${filename} uploaded with success`);
            return;
        }
        // Return error if no file in request
        res.status(400).send('No file to upload');
    } catch (err) {
        console.error(err);
    }
})

app.put('/api/drive/:folder', async (req: any, res: any) => {
    // Fetch data from request
    const folder = req.params.folder;
    const files = req.files;
    // Get path for directory or file
    const dirPath = join(rootDir, folder);
    try {
        // Check if current directory exist
        if (existsSync(dirPath)) {
            if (Object.keys(files).length > 0) {
                const {file: {file, filename}} = files;
                const path = join(rootDir, folder, filename);
                await promises.copyFile(file, path);
                res.status(201).send(`${filename} uploaded with success`);
                return;
            }
            // Return error if no file in request
            res.status(400).send('No file to upload');
        }
        // Return error if directory does not exist
        res.status(404).send(`Directory ${folder} does not exist`);
    } catch (err) {
        console.error(err);
    }
})

// METHODS //

const readDirectory = async (path: string): Promise<File[]> => {
    const items = await promises.readdir(path, {withFileTypes: true});
    return items.map((item: Dirent) => {
        if (item.isDirectory()) {
            return {
                name: item.name,
                isFolder: item.isDirectory(),
            }
        } else {
            return {
                name: item.name,
                isFolder: item.isDirectory(),
                size: statSync(join(path, item.name)).size
            }
        }
    });
}

const validateName = (name: string) => {
    // Regex to check directory name
    const regex = new RegExp(/^[a-z0-9_.]+$/i);
    return regex.test(name);
}
