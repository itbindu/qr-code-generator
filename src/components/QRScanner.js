import React, {useState, useEffect, useRef} from 'react';
import {FaClipboard, FaCamera, FaImage, FaTimes, FaCheck} from 'react-icons/fa';
import QrScanner from "qr-scanner";

export default function QRScanner() {
    const [scannedData, setScannedData] = useState({});
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [devices, setDevices] = useState([]);
    const [noCameraFound, setNoCameraFound] = useState(false); // State to track if no camera is found
    const videoRef = useRef(null);
    const qrScannerRef = useRef(null); // Ref for the QR Scanner

    useEffect(() => {
        const initQrScanner = async () => {
            if (!videoRef.current) return;

            qrScannerRef.current = new QrScanner(
                videoRef.current,
                result => handleScan(result.data), // Use handleScan to update scanned data
                {
                    onDecodeError: error => {
                        console.error('QR decoding error:', error);
                    },
                    highlightCodeOutline: true,
                    highlightScanRegion: true,
                }
            );

            try {
                await fetchDevices();
                await qrScannerRef.current.start();
            } catch (err) {
                console.error('Error starting QR scanner:', err);
            }
        };

        const fetchDevices = async () => {
            console.log('Fetching devices...');
            try {
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput' && device.deviceId !== '');
                setDevices(videoDevices);
                setNoCameraFound(videoDevices.length === 0);
            } catch (err) {
                setNoCameraFound(true);
                console.error('Error fetching devices:', err);
            }
        };

        if (isCameraActive) {
            initQrScanner();
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
            }
        };
    }, [isCameraActive]);

    const handleScan = (data) => {
        if (data) {
            const scannedText = typeof data === 'object' && data.text ? data.text : data;
            setScannedData({error: false, result: scannedText});
        }
    };

    const handleFileError = (err) => {
        setScannedData({error: true, result: "Error while scanning the image!"});
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        QrScanner.scanImage(file, {returnDetailedScanResult: true})
            .then(result => {
                handleScan(result.data);
            })
            .catch(e => handleFileError(e));
    };

    const toggleCamera = () => {
        setIsCameraActive(!isCameraActive);
        setScannedData({});
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scannedData.result)
            .then(() => {
                alert('Copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    };

    return (
        <div className="p-8 bg-white shadow-lg rounded-lg max-w-lg mx-auto">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800 flex items-center justify-center">
                <FaCamera className="mr-2"/> QR Code Scanner
            </h1>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
                    <FaCamera className="mr-2"/> Scan with Camera
                </h2>
                <div className="flex w-full justify-center gap-5 items-center">
                    <button
                        onClick={toggleCamera}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4 flex items-center justify-center disabled:bg-gray-300 disabled:text-gray-600 disabled:opacity-50"
                        disabled={noCameraFound}
                    >
                        {isCameraActive && !noCameraFound ? <FaTimes className="mr-2"/> : <FaCheck className="mr-2"/>}
                        {isCameraActive && !noCameraFound ? 'Turn Off Camera' : 'Turn On Camera'}
                    </button>
                    {noCameraFound ? (
                        <div className="px-4 py-2 rounded-md mb-4 bg-red-100 text-red-800 flex flex-col items-center">
                            <p className="font-semibold flex items-center justify-between">No Camera Found!</p>
                            <p className="text-xs">Check site permissions and devices</p>
                        </div>
                    ) : (
                        <select
                            onChange={(e) => {
                                const selectedDeviceId = e.target.value;
                                if (qrScannerRef.current) {
                                    qrScannerRef.current.setCamera(selectedDeviceId);
                                }
                            }}
                            className="bg-gray-200 text-gray-800 w-60 px-4 py-2 rounded-md mb-4 flex items-center justify-center truncate"
                        >
                            {devices.map((device, index) => (
                                <option key={index} value={device.deviceId}>
                                    {device.label || `Camera ${index + 1}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                {isCameraActive && (
                    <div>
                        <video id="videoContainer" className="w-full h-full aspect-square object-cover rounded-lg" ref={videoRef}/>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
                    <FaImage className="mr-2"/> Scan from Image
                </h2>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mb-4 w-full p-2 border border-gray-300 rounded-lg"
                />
            </div>

            {/* Only show the div if scannedData has a result */}
            {scannedData.result && (
                <div
                    className={`p-4 rounded-lg font-semibold flex items-center justify-between ${
                        scannedData.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}
                >
                    <span>Scanned Data: {scannedData.result}</span>
                    <button onClick={copyToClipboard}
                            className="ml-4 text-blue-600 hover:text-blue-800 flex items-center">
                        <FaClipboard size={24} className="mr-2"/> Copy
                    </button>
                </div>
            )}
        </div>
    );
}