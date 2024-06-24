import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import AWS from 'aws-sdk';
import axios from 'axios';
import  dotenv  from 'dotenv';
const app = express();
app.use(express.json());
app.use(dotenv.config())
// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.ID,
    secretAccessKey: process.env.KEY,
    region: process.env.REGION
})

// MongoDB configuration
const mySchema = new mongoose.Schema({
    title: String
});
const myModel = mongoose.model("docker", mySchema);

const conn = async () => {
    try {
        await mongoose.connect("mongodb+srv://ahmed:ahmed@cluster0.xcy71ll.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
    }
};

conn();

app.post('/upload', async (req, res) => {
    const imageUrl = req.body.imageUrl; // Assuming client sends imageUrl in request body

    if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
    }

    // Download image from URL
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const fileContent = response.data;

        // Determine file name from URL
        const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);

        // S3 upload parameters
        const params = {
            Bucket: process.env.BUCKET,
            Key: fileName, // Use file name extracted from URL
            Body: fileContent,
            ContentType: response.headers['content-type']
        };

        // Upload file to S3
        const data = await s3.upload(params).promise();
        res.json({ message: 'File uploaded successfully', imageUrl: data.Location });
    } catch (err) {
        console.error("Error uploading image to S3:", err);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});


// Endpoint to handle saving data to MongoDB
app.post('/post', async (req, res) => {
    const title = req.body.title;
    try {
        const data = await myModel.create({ title });
        await data.save();
        res.json({ message: 'Data saved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint to fetch data from MongoDB
app.get('/post', async (req, res) => {
    try {
        const data = await myModel.find();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Default endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Start the server
app.listen(80, () => console.log(`Server started on port 80`));
