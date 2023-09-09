const galleryTab = document.getElementById('galleryTab');
const imagesTab = document.getElementById('imagesTab');

const contentLeft = document.getElementById('contentLeft');
const contentRight = document.getElementById('contentRight');

const leftArrow = document.getElementById('leftArrow');
const galleryMiddle = document.getElementById('galleryMiddle');
const rightArrow = document.getElementById('rightArrow');

const jumpInput = document.getElementById('jumpInput');
const jumpButton = document.getElementById('jumpButton');

const saveAllImagesButton = document.getElementById('saveAllImagesButton');
const numberSaved = document.getElementById('numberSaved');

const boxSizeWidth = 130; // Adjust as needed
const boxSizeHeight = 130; // Adjust as needed

const imageSizeWidth = 150; // Adjust as needed
const imageSizeHeight = 150; // Adjust as needed

const defaultNoImage = "/No_Image_Available.jpg";

//Initial values
let currentInteger = 513216 ;
//let currentInteger = 7647561 ;
//let currentInteger =  ;
let currentAlphanumeric = 'b000' ;
//let currentAlphanumeric = '4jww9' ;
let currentNumBoxes = 1;

let currentGalleryStart = 41990247;
let currentGalleryEnd;
let currentGalleryStartAlpha = 'ozzvr';
let currentGalleryEndAlpha;

// currently selected gallery
//let selectedInteger = 7647561;
let selectedInteger = 513216;
const maxInteger4 = 1679615;
const maxInteger5 = 60466175;

// get the last selected gallery integer value 
/*
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/getSelectedInteger');
        const data = await response.json();
        const selectedInteger = data.selectedInteger;
		
		if (!isNaN(selectedInteger)) {
			currentInteger = selectedInteger;
			currentAlphanumeric = integerToAlphanumeric(selectedInteger);
			// Use the selectedInteger value in your application
			console.log('Selected Integer:', currentInteger);
			console.log('Selected Alpha:', currentAlphanumeric);
		}
        // Rest of your code...
    } catch (error) {
        console.error('Error fetching selectedInteger:', error);
    }
});
*/

// Call the calculateBoxes function when the page loads and on window resize
window.addEventListener('load', () => {
  const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();
  const galleryMiddle = document.getElementById('galleryMiddle');
  //galleryMiddle.textContent = `${numBoxesHorizontal} by ${numBoxesVertical}`;
  jumpInput.style.display = 'block';
  jumpButton.style.display = 'block';
  saveAllImagesButton.style.display = 'none';
  numberSaved.style.display = 'none';
  loadGalleryImages();
  //console.log(`Number of boxes horizontal: ${numBoxesHorizontal}`);
  //console.log(`Number of boxes vertical: ${numBoxesVertical}`);
});

window.addEventListener('resize', () => {
  const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();
  const galleryMiddle = document.getElementById('galleryMiddle');
  //galleryMiddle.textContent = `${numBoxesHorizontal} by ${numBoxesVertical}`;
  //console.log(`Number of boxes horizontal: ${numBoxesHorizontal}`);
  //console.log(`Number of boxes vertical: ${numBoxesVertical}`);
});


// EventListeners for tabs
galleryTab.addEventListener('click', () => {
  contentLeft.style.display = 'block';
  contentRight.style.display = 'none';
  jumpInput.style.display = 'block';
  jumpButton.style.display = 'block';
  saveAllImagesButton.style.display = 'none';
  numberSaved.style.display = 'none';
  // Show the static content in contentLeft
  //document.getElementById('staticContent').style.display = 'block';
});

function loadImagesTab() {
  contentLeft.style.display = 'none';
  contentRight.style.display = 'block';
  jumpInput.style.display = 'none';
  jumpButton.style.display = 'none';
  saveAllImagesButton.style.display = 'block';
  numberSaved.style.display = 'block';
}

imagesTab.addEventListener('click', () => {
  loadImagesTab();
  // Hide the static content in contentLeft
  //document.getElementById('staticContent').style.display = 'none';
});

// EventListeners for navigation
leftArrow.addEventListener('click', () => {
	// Handle your action for the left arrow here
	//galleryMiddle.textContent = 'Left arrow clicked'
    const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();
	currentInteger = currentInteger - currentNumBoxes;
	
	loadGalleryImages();
	//console.log('Left arrow clicked');
});

rightArrow.addEventListener('click', () => {
	// Handle your action for the right arrow here
	//galleryMiddle.textContent = 'Right arrow clicked'
    currentInteger = currentInteger + currentNumBoxes;
	const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();
	
	loadGalleryImages();
	//console.log('Right arrow clicked');
});

jumpButton.addEventListener('click', () => {
	const newAlphanumericValue = jumpInput.value.toLowerCase();
	const newIntegerValue = alphanumericToInteger(newAlphanumericValue);
	const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();

	if (!isNaN(newIntegerValue)) {
		currentInteger = newIntegerValue;
		currentAlphanumeric = newAlphanumericValue ;
		loadGalleryImages();
	}
});

saveAllImagesButton.addEventListener('click', () => {
	numberSaved.textContent = "Saving...";
	const correspondingImageContainer = document.querySelector(`.gallery-${selectedInteger}`);
	if (correspondingImageContainer) {
		// Add a class to change the color of the image container to red
		correspondingImageContainer.classList.remove('selected');		
		correspondingImageContainer.classList.add('saved');
	}
  	saveAllImages();
});
		


// gallery tab functions
async function getGalleryImageURL(curInt) {
	const curAlpha = integerToAlphanumeric(curInt);
	const calc_url = `/getFirstImage?url=https://imx.to/g/${curAlpha}`;

	try {
		const response = await fetch(calc_url);
		const data = await response.json();

		const firstImgSrc = data.imgSrcList[0]; // Get the URL of the first image
		// Extract the actual HTTP URL from the firstImgSrc
		const firstImgUrl = firstImgSrc.match(/src="([^"]+)"/)[1];
		
		if (firstImgUrl == null) {
			return defaultNoImage;
		}
		else {
			return firstImgUrl;
		}
	} catch (error) {
		console.error('Error fetching image URLs:', error);
		return defaultNoImage;
	} 
}


function loadContentForSelectedImage(selectedInt) {
	// set selected Integer
	selectedInteger = selectedInt;

	const selectedAlpha = integerToAlphanumeric(selectedInt);
	document.getElementById('selectedURL').textContent = `${selectedInt}:${selectedAlpha}`;
	numberSaved.textContent = "";
	loadImagesTab();
	displayAllImages(selectedInt);
}

async function loadGalleryImages() {
  // Clear the gallery images
  const { numBoxesHorizontal, numBoxesVertical } = calculateBoxes();
  curnumbox = numBoxesHorizontal * numBoxesVertical;
  //galleryMiddle.innerHTML = `Loading ${curnumbox} gallery items.`;
  galleryMiddle.innerHTML = '';
  // Load and display gallery images
  document.getElementById('startIndex').textContent = `${currentInteger}  `;
  document.getElementById('endIndex').textContent = `${currentInteger + curnumbox - 1}  `;

  currentGalleryStart = currentInteger;
  let i = 0 ;
  let i_good = 0 ;
  while (i_good < curnumbox) {
	const src_url = await getGalleryImageURL(currentInteger + i);
	if (src_url == defaultNoImage) {
		i++;
	} 
	else {
		const imageContainer = document.createElement('div');
		imageContainer.classList.add('image-container');
		
		// Add a class corresponding to the gallery URL
		imageContainer.classList.add(`gallery-${currentInteger + i}`);
		
		//console.log(`gal_src_url=${src_url}`);
		//console.log(`this_integer=${this_integer}`);
		const img = document.createElement('img');
		img.src = src_url;
		img.alt = 'Image ' + (i_good + 1);
		img.classList.add('gallery-image');
		const this_integer = currentGalleryStart + i;
		imageContainer.appendChild(img);
		imageContainer.addEventListener('click', () => {
		  // Load content for the selected image's associated URL
		  imageContainer.classList.add('selected');
		  loadContentForSelectedImage(this_integer);
		});
		galleryMiddle.appendChild(imageContainer);
		i++;
		i_good++;
	}
	  
  }
  currentGalleryEnd = currentGalleryStart + i - 1;
  
  /*
  for (let i = 0; i < curnumbox; i++) {
  //for (let i = 0; i < 1; i++) {
	const src_url = await getGalleryImageURL(currentInteger + i);
	
	const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');
	
	// Add a class corresponding to the gallery URL
    imageContainer.classList.add(`gallery-${currentInteger + i}`);

	
	//console.log(`gal_src_url=${src_url}`);
    const img = document.createElement('img');
    img.src = src_url;
    img.alt = 'Image ' + (i + 1);
    img.classList.add('gallery-image');

	imageContainer.appendChild(img);
    imageContainer.addEventListener('click', () => {
      // Load content for the selected image's associated URL
	  imageContainer.classList.add('selected');
      loadContentForSelectedImage(currentInteger + i);
    });
    galleryMiddle.appendChild(imageContainer);
  }
  */
}

// images tab functions
function saveAllImages() {
	const selectedAlpha = integerToAlphanumeric(selectedInteger);
	const options = `currentInteger=${selectedInteger}&currentAlphanumeric=${selectedAlpha}`;
	const save_url = `/saveImages?url=https://imx.to/g/${selectedAlpha}&${options}`;
	fetch(save_url)
	   .then(response => response.json())
	   .then(data => {
		   const imgCount = data.imgCount;

			// Update currentURL span content with the current URL value
			document.getElementById('numberSaved').textContent = `${imgCount} saved.`;
		})
	   .catch(error => {
		   console.error('Error fetching image URLs:', error);
	   });

}

function displayAllImages(selectedInt) {
	selectedInteger = selectedInt;
	const selectedAlphanumeric = integerToAlphanumeric(selectedInteger);
	calc_options = `currentInteger=${selectedInteger}&currentAlphanumeric=${selectedAlphanumeric}`;
	calc_url = `/getImages?url=https://imx.to/g/${selectedAlphanumeric}&${calc_options}`;

	fetch(calc_url)
	   .then(response => response.json())
	   .then(data => {
		   const currentTitle = data.title;
		   const imgSrcList = data.imgSrcList;
			//const imgTags = imgSrcList.map(src => `<img src="${src}" />`).join('');
			//const imgTags = imgSrcList.map(src => `${src}`).join(',');
			//const commaSeparatedList = imgSrcList.join(', ');
			const imgUrls = imgSrcList.map(src => src.match(/src="([^"]+)"/)[1]);
			
			//const modifiedList = imgSrcList.map(src => src.replace('to/u/t', 'to/u/i'));
			//const modifiedUrls = imgUrls.map(src => src.replace('to/thumbs', 'to/images').replace('ttps://t','ttps://img'));
			const modifiedUrls = imgUrls.map(src => src.replace('to/u/t', 'to/u/i'));

			// Create anchor elements with modified URLs in href and original URLs in img src
			const anchorTags = modifiedUrls.map((modifiedSrc, index) => `
				<a href="${modifiedSrc}" target="_blank">
					<img src="${imgUrls[index]}" style="width:auto;height:auto;max-height:150px;max-width:150px"/>
				</a>`).join('');

			// Update currentURL span content with the current URL value
			document.getElementById('selectedTitle').textContent = `${currentTitle}`;

			const imageView = document.getElementById('contentRight');
			// Update iframe content with the anchor tags
			//webFrame.contentDocument.body.textContent = anchorTags;
			setTimeout(() => {
				imageView.innerHTML = anchorTags;
			}, 100);
	
			// Update iframe content with the img tags
			//webFrame.contentDocument.body.innerHTML = imgTags;
			//webFrame.contentDocument.body.textContent = commaSeparatedList;
			//webFrame.contentDocument.body.innerHTML = data;
	   })
	   .catch(error => {
		   console.error('Error fetching image URLs:', error);
	   });
	
}



// Function to calculate how many boxes fit in the gallery-middle section
function calculateBoxes() {
  const galleryMiddle = document.getElementById('galleryMiddle');
  const box = galleryMiddle.querySelector('.box');
  
  const galleryWidth = galleryMiddle.clientWidth;
  const galleryHeight = galleryMiddle.clientHeight; // Get the height of the gallery-middle
  
  const numBoxesHorizontal = Math.floor(galleryWidth / boxSizeWidth);
  const numBoxesVertical = Math.floor(galleryHeight / boxSizeHeight); // Calculate vertical count
  
  // update global
  currentNumBoxes = numBoxesHorizontal * numBoxesVertical;
  
  return { numBoxesHorizontal, numBoxesVertical }; // Return an object with both counts
}


// Auxiliary functions

function integerToAlphanumeric(integer) {
	const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
	const base = characters.length;
	let result = '';

	while (integer > 0) {
		const remainder = integer % base;
		result = characters[remainder] + result;
		integer = Math.floor(integer / base);
	}

	while (result.length < 4) {
		result = '0' + result;
	}

	return result;
}

function alphanumericToInteger(alphanumericValue) {
	const base = 36; // 26 letters + 10 digits
	let integerValue = 0;

	for (let i = 0; i < alphanumericValue.length; i++) {
		const char = alphanumericValue[i];
		const digitValue = parseInt(char, base);
		if (!isNaN(digitValue)) {
			integerValue = integerValue * base + digitValue;
		} else {
			const letterValue = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
			integerValue = integerValue * base + letterValue;
		}
	}

	return integerValue;
}

