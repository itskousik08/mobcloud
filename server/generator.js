const fs = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');

const previewDir = path.join(__dirname, '../preview');
const downloadsDir = path.join(__dirname, '../downloads');

// Function to create a ZIP file of the generated website
const createZip = async () => {
    await fs.mkdir(downloadsDir, { recursive: true });
    const zip = new JSZip();
    
    try {
        const files = await fs.readdir(previewDir);
        for (const file of files) {
            const filePath = path.join(previewDir, file);
            const content = await fs.readFile(filePath);
            zip.file(file, content);
        }
        
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        return zipBuffer;

    } catch (error) {
        console.error("Could not read preview directory for zipping:", error);
        throw error;
    }
};

module.exports = { createZip };
