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
        const data = await fs.promises.readdir(path, {withFileTypes: true});
        data.map((item) => {
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
        // Send response with data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
    }
})
