import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
// const socket = io('https://email-scraper-backend-2dj9.onrender.com')
// const socket = io('http://localhost:3000')

const Home = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [downloadUrl, setDownloadUrl] = useState(''); // Download link store karne ke liye
    const socketRef = useRef(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus('');
        setDownloadUrl('');
    };

    useEffect(() => {
        // ⭐ Backend URL check karein (3000 ya 3000 jo bhi aapne set kiya ho)
        socketRef.current = io('https://email-scraper-backend-2dj9.onrender.com', {
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            console.log("Connected to Socket! ID:", socketRef.current.id);
        });

        socketRef.current.on('progress', (data) => {
            console.log("Progress Received:", data);
            setProgress(data);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a CSV file first!");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        if (socketRef.current && socketRef.current.id) {
            formData.append('socketId', socketRef.current.id);
        } else {
            console.warn("Socket not connected yet, updates might not show.");
        }

        try {
            setLoading(true);
            setDownloadUrl('');
            setProgress({ current: 0, total: 0, percentage: 0 });
            setStatus('Scraping started... our bots are visiting domains. It might take a few minutes.');

            const response = await axios.post('https://email-scraper-backend-2dj9.onrender.com/api/upload', formData);

            if (response.data && response.data.success) {
                setDownloadUrl(response.data.downloadUrl); // URL ko state mein set karein
                setStatus(`Success! Found emails for ${response.data.found} domains.`);
            } else {
                setStatus('Error: Unexpected response from server.');
            }

        } catch (error) {
            console.error(error);
            setStatus('Error: Could not process the file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
            <h1>Email Scraper Tool</h1>
            <p>Upload your CSV file containing domains to start extracting emails.</p>

            <div style={{ margin: '30px auto', padding: '20px', border: '2px dashed #ccc', width: '400px' }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                <br /><br />

                {/* Upload Button */}
                {!downloadUrl && (
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Processing...' : 'Upload & Scrape'}
                    </button>
                )}

                {/* Download Button - Yeh tabhi dikhega jab downloadUrl mil jayega */}
                {downloadUrl && (
                    <div style={{ marginTop: '10px' }}>
                        <a
                            href={downloadUrl}
                            download
                            style={{
                                display: 'inline-block',
                                padding: '12px 25px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            ⬇️ Download Result CSV
                        </a>
                        <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
                            File is ready for download.
                        </p>
                    </div>
                )}
            </div>

            {status && <p style={{ color: status.includes('Error') ? 'red' : 'green' }}>{status}</p>}

            {loading && (
                <div style={{ marginTop: '20px', width: '100%', maxWidth: '400px', margin: '20px auto' }}>
                    <p>🚀 Processing: {progress.current} / {progress.total} Domains</p>

                    {/* Progress Bar UI */}
                    <div style={{
                        width: '100%',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '10px',
                        height: '20px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: '#007bff',
                            height: '100%',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <p>{progress.percentage}% Completed</p>
                </div>
            )}
        </div>
    );
};

export default Home;