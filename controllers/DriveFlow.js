const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04zl8RuWF7vGhCgYIARAAGAQSNwF-L9IrzEwZq2X7O3EALQk4JNYfAhgCxqoWA_BT4V-58QvhC5lMHveLZr2p_gldq3Dxb3hqvHE';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

async function uploadFile(filePath, name) {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: path.basename(name),  // Use the file's original name
                mimetypes: ['application/pdf', 'image/png', 'image/jpeg']  // Adjust based on file type
            },
            media: {
                mimetypes: ['application/pdf', 'image/png', 'image/jpeg'],
                body: fs.createReadStream(filePath)  // Read from the file path passed in
            }
        });
        return response.data;
    } catch (err) {
        console.log('Error uploading file:', err.message);
        throw err;
    }
}

async function generateLink(fileId) {
    try {
        // Create permission to make the file publicly viewable
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Retrieve the file's view and download links
        const result = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink'
        });

        return result.data;
    } catch (err) {
        console.log('Error generating link:', err.message);
        throw err;
    }
}

async function deleteFile(fileId){
    try{
        const response  = await drive.files.delete({
            fileId: fileId
        });
        console.log("deleted");
    }
    catch (err) {
        console.log('Error generating link:', err.message);
        throw err;
    }
}

module.exports = { uploadFile, generateLink,deleteFile};
