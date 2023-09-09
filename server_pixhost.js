const express = require('express');
const session = require('express-session');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https'); // Import the 'https' module
const url = require('url'); // Import the 'url' module
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_CONCURRENT_DOWNLOADS = 2; // Change this to your desired limit

const logsFolderPath = path.join(__dirname, 'logs');
if (!fs.existsSync(logsFolderPath)) {
    fs.mkdirSync(logsFolderPath);
    fs.writeFileSync(path.join(logsFolderPath, 'log.csv'), 'Integer,Alphanumeric,URL,NumImages\n', 'utf8');
}
const imagesFolderPath = path.join(__dirname, 'logs');
if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath);
}

const configFolderPath = path.join(__dirname, 'config');
if (!fs.existsSync(configFolderPath)) {
    fs.mkdirSync(configFolderPath);
    //fs.writeFileSync(path.join(configFolderPath, 'config.csv'), ',Alphanumeric,URL,NumImages\n', 'utf8');
}

function setLastUsed(lastInteger) {
    //fs.writeFileSync(path.join(configFolderPath, 'config.csv'), ',Alphanumeric,URL,NumImages\n', 'utf8');
}

app.use(cookieParser());
app.use(session({
	secret: '314159',
	resave: false,
	saveUninitialized: true,
}));

app.use(express.static(__dirname + '/public'));

//app.get('/', (req, res) => {
    //const currentInteger = req.session.currentInteger || 973286; // Default to 0 if not set
    //const alphanumericValue = req.session.alphanumericValue || 'niei'; //nzqz?

    //res.render('index', { currentInteger, alphanumericValue }); // Pass the values to the template
//});

async function downloadAndSaveImage(imageUrl, imageFilePath) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(response.data, 'binary');
        fs.writeFileSync(imageFilePath, imageData);
        console.log(`Image saved: ${imageFilePath}`);
    } catch (error) {
        console.error(`Error downloading image from ${imageUrl}: ${error.message}`);
    }
}

async function downloadImage2(imageUrl, imageFilePath) {
	console.log('in downloadImage');
	console.log(`imageUrl=${imageUrl}`);
	console.log(`imageFilePath=${imageFilePath}`);
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(imageFilePath);
		console.log('created write stream');

        http.get(imageUrl, response => {
            response.pipe(fileStream);

            fileStream.on('finish', () => {
				//console.log('finished filestream');
                fileStream.close();
                resolve();
            });

            fileStream.on('error', error => {
				//console.log('filestream error');
                reject(error);
            });
        }).on('error', error => {
			console.log('other error');
            reject(error);
        });
		console.log('after http get');
    });
}


async function downloadImage(imageUrl, imageFilePath) {
	let alreadyDownloaded = false;
	try {
		var stats = fs.statSync(imageFilePath);
		alreadyDownloaded = (stats.size > 0);
	}
	catch {
		// need to download file
		alreadyDownloaded = false;
	}
	
	//console.log(`imageUrl=${imageUrl}`);
	if (!alreadyDownloaded) {
		return new Promise((resolve, reject) => {
			const fileStream = fs.createWriteStream(imageFilePath);

			const request = https.get(imageUrl, response => {
				if (response.statusCode === 302) {
					// Handle the redirect by getting the new location from the response headers
					const newLocation = response.headers.location;
					const newImageUrl = url.resolve(imageUrl, newLocation);

					// Recursively call downloadImage with the new URL
					downloadImage(newImageUrl, imageFilePath)
						.then(resolve)
						.catch(reject);
					return;
				}

				if (response.statusCode !== 200) {
					reject(new Error(`Request failed with status code ${response.statusCode}`));
					return;
				}

				response.pipe(fileStream);

				fileStream.on('finish', () => {
					fileStream.close();
					resolve();
				});

				fileStream.on('error', error => {
					reject(error);
				});
			});

			request.on('error', error => {
				reject(error);
			});
		});
	}
	else {
		return new Promise((resolve, reject) => {
			resolve();
			return;
		});
	}
}

async function downloadImageWithDelay(imageUrl, imageFilePath, delayMs) {
    await delay(delayMs);

    try {
        await downloadImage(imageUrl, imageFilePath);
        console.log(`Image saved: ${imageFilePath}`);
    } catch (error) {
        console.error('Error downloading image:', error);
    }
}

async function downloadImageWithRetry(imageUrl, imageFilePath, delayMs, retryAttempts) {
	console.log('in downloadImageWithRetry');
    let retryCount = 0;
    while (retryCount < retryAttempts) {
        await delay(delayMs);

        try {
            await downloadImage(imageUrl, imageFilePath);
            console.log(`Image saved: ${imageFilePath}`);
            return true; // Download successful
        } catch (error) {
            console.error('Error downloading image:', error);
            retryCount++;
            console.log(`Retrying (${retryCount}/${retryAttempts})...`);
        }
    }
    console.error(`Failed to download image: ${imageUrl}`);
    return false; // Download failed after retry attempts
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/saveImages', async (req, res) => {
    const url = req.query.url;
    const currentInteger = parseInt(req.query.currentInteger);
    const currentAlphanumeric = req.query.currentAlphanumeric;

    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const imgSrcList = extractImageSrcList(response.data);
            const title = extractTitle(response.data);

            const subdirectory = path.join(__dirname, 'images_pixhost', currentAlphanumeric);
            if (!fs.existsSync(subdirectory)) {
                fs.mkdirSync(subdirectory);
                console.log(`Made subdirectory ${subdirectory}`);
            }

            const delayBetweenImages = 10; // Delay in milliseconds between image download attempts
            const maxRetryAttempts = 5; // Maximum number of retry attempts

            const downloadStatusList = [];
            let imagesDownloaded = 0;

            for (let i = 0; i < imgSrcList.length; i++) {
                const imageFilePath = `${subdirectory}/${currentAlphanumeric}_${i + 1}.jpg`;
                const imageUrl = imgSrcList[i].replace('<img src="', '').replace('"', '').replace('to/thumbs', 'to/images').replace('ttps://t','ttps://img');
				console.time(imageUrl);

                let downloadSuccess = false;
                let retryAttempts = 0;

                while (!downloadSuccess && retryAttempts < maxRetryAttempts) {
                    try {
                        await downloadImage(imageUrl, imageFilePath);
                        downloadSuccess = true;
                        imagesDownloaded++;
                        // Emit progress here
                        //res.write(`data: ${imagesDownloaded}\n\n`);
                    } catch (error) {
                        console.error(`Error downloading image (${retryAttempts + 1} attempts):`, error);
                        retryAttempts++;
                        await sleep(delayBetweenImages*retryAttempts*retryAttempts); // Wait before the next retry
                    }
                }
				process.stdout.write("\rDownloaded image " + (i+1) + " of " + imgSrcList.length + "    ");
                downloadStatusList.push({ imageFilePath, downloadSuccess });
				console.timeEnd(imageUrl);

            }

            console.log("Downloaded " + imgSrcList.length + " images.");
            const imgCount = imgSrcList.length;
            res.json({imgCount});
        } else {
            console.log('Error fetching content');
            res.status(500).json({ error: 'Error fetching content.' });
        }
    } catch (error) {
        console.log('Got a general error: ' + error);
        res.status(500).json({ error: 'Error fetching content.' });
    }
});


app.get('/getImages', async (req, res) => {
    const url = req.query.url; // Get the URL from the query parameter
	const currentInteger = parseInt(req.query.currentInteger);
	const currentAlphanumeric = req.query.currentAlphanumeric;
	console.log(`Loading ${url}, cI=${currentInteger}, cA=${currentAlphanumeric}`);

    const configFilePath = path.join(__dirname, 'config', 'config_pixhost.csv');
    const configData = `${currentInteger}\n`;
    fs.writeFileSync(configFilePath, configData, 'utf8');
	
    try {
        const response = await axios.get(url);
		console.log("got response ", response.status, " url= ", url);

        if (response.status === 200) {
			req.session.currentInteger = currentInteger;
			req.session.currentAlphanumericValue = currentAlphanumeric;
            const imgSrcList = extractImageSrcList(response.data);
			const title = extractTitle(response.data);
			saveLogToCSV(currentInteger, currentAlphanumeric, url, title, imgSrcList.length);
			
			console.log("returning results");
            res.json({title, imgSrcList}); // Send the list of img src values
        } else {
            res.status(500).json({ error: 'Error fetching content.'});
        }
    } catch (error) {
		console.log("in catch(error)");
        res.status(500).json({ error: 'Error fetching content.'});
    }
	console.log("exiting /getImages");
});

app.get('/getFirstImage', async (req, res) => {
    const url = req.query.url; // Get the URL from the query parameter
	//console.log(url);

    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const imgSrcList = extractImageSrc(response.data);
			const title = extractTitle(response.data);
            res.json({title, imgSrcList}); // Send the list of img src values
        } else {
            res.status(500).json({ error: 'Error fetching content.'});
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching content.'});
    }
});


// class="tooltiptext"><img src="https://imx.to/u/t/2022/06/16/36i8l7.jpg" 

// Function to extract img src attributes
function extractImageSrcList(html) {
	//console.log("Extracting image list.");
	//console.log(html);
	//console.log("Dumped html.");
    const imgSrcList = [];
    const imgRegex = /<img src="https:..t[0-9]+.pixhost.to.thumbs.([^">]+)"/g;
    //const imgRegex = /w.dth/g;
    let match;
	let i=0;
    while ((match = imgRegex.exec(html)) !== null) {
		i++;
		//console.log(`Found ${match[0]}. Next starts at ${match.lastIndex}.`);
		//console.log(match[1]);
        imgSrcList.push(match[0]);
		console.log(match[0]);
    }
	//console.log(`found ${i}`);
    return imgSrcList;
}

function extractImageSrc(html) {
    const imgSrcList = [];
    const imgRegex = /<img src="https:..t[0-9]+.pixhost.to.thumbs.([^">]+)"/;
    //const imgRegex = /w.dth/g;
    let match;
    match = imgRegex.exec(html);
	//console.log(`Found first ${match[0]}.`);
		//console.log(match[1]);
	imgSrcList.push(match[0]);
    return imgSrcList;
}

function integerToAlphanumeric(integer) {
	const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
	const base = characters.length;
	let result = '';

	while (integer > 0) {
		const remainder = integer % base;
		result = characters[remainder] + result;
		integer = Math.floor(integer / base);
	}

	while (result.length < 5) {
		result = '0' + result;
	}

	return result;
}


function extractTitle(html) {
    const titleRegex = /<title>(.*?)<\/title>/;
    const match = titleRegex.exec(html);
    return match ? match[1] : '';
}

function saveLogToCSV(currentInteger, currentAlphanumeric, url, title, numImages) {
    const logData = `${currentInteger},${currentAlphanumeric},${url},"${title}",${numImages}\n`;
    const logFilePath = path.join(__dirname, 'logs', 'log_pixhost.csv');

    fs.appendFileSync(logFilePath, logData, 'utf8');
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


app.get('/getSelectedInteger', (req, res) => {
    const configFilePath = path.join(__dirname, 'config', 'config.csv');
    if (fs.existsSync(configFilePath)) {
        const selectedIntegerString = fs.readFileSync(configFilePath, 'utf8').trim();
        const selectedInteger = parseInt(selectedIntegerString);
		console.log(`selectedInteger=${selectedInteger}`);
        res.json({ selectedInteger });
    } else {
        res.status(404).json({ error: 'Selected integer not found.' });
    }
});