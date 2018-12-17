const config = require('./config');

const axios = require('axios');
const Twit = require('twit');
const Jimp = require('jimp'); 
const download = require('image-downloader');
const fs = require('fs');

const T = new Twit(config.cred);

const onAuthenticated = (err, res) => {
	if (err) throw err;

	console.log('Authentication successful. Running...\r\n');
};

T.get('account/verify_credentials', {
	include_entities: false,
	skip_status: true,
	include_email: false
}, onAuthenticated);

const getData = async (id) => {
	const res = await axios(`${config.url.textAPI}/${id}`);
	console.log('\r\ngot data from the API');
	return res.data;
};

const getAyat = (data) => {
	const ayat =`${data.terjemahan_idn} (${data.surat.nama_surat}:${data.nomor_ayat})`;
	console.log('data was edited as ayat');
	return ayat;
};

const downloadImage = async() => {
	options = {
		url: config.url.imageAPI,
		dest: 'raw/photo.jpg' 
	};

	try {
		const { filename, image } = await download.image(options);
		console.log(`image downloaded, file saved to ${ filename }`);
	} catch (error) {
		console.log(error);
	};   
};

const editImage = async (text) => {
	try {
		const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
		console.log(`font loaded`);

		const image = await Jimp.read('raw/photo.jpg');
		console.log(`image ready to edit`);

		image.brightness(-0.6).print(
			font,
			200,
			200,
			{
				text: text,
				alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
				alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
			},
			800,
			800
		)
		.write('export/photo.jpg');
		console.log(`Image edited`);
	} catch (error) {
		console.log(error);
	}
};

const tweetIt = async() => {

	var b64content = fs.readFileSync('export/photo.jpg', { encoding: 'base64' });

	console.log('Uploading an image...');

	T.post('media/upload', { media_data: b64content }, function (err, data, response) {
		if (err) throw err;

		console.log('Image uploaded!');
		console.log('Now tweeting it...');

		var mediaIdStr = data.media_id_string;
		var params = {
			media_ids: [mediaIdStr]
		}

		T.post('statuses/update', params, function(err, data, response) {
			if (err) throw err;
			else console.log('Posted an image!');
		});

	});
};

const controlTweetImage = async () => {
	// create a rundom number in range 1 - 6223, 
	const ran = Math.floor(Math.random() * (6223 - 1 + 1)) + 1;

	// get data from the api call
	const data = await getData(ran);

	// get ayat processed from the API given data
	const ayat = getAyat(data);

	// checking if the ayat not more than 240 char
	// for prevent  the text out of the image size
	if (ayat.length < 240 ) {
	
		// get the image from the web image public API
		await downloadImage();
	
		// adding text (in this case is an ayat) to the image
		editImage(ayat);
		
		// Tweet and publish the image who has edited to Twitter
		tweetIt();
	}

	else console.log(`text lebih dari 240 karakter`);
};

setInterval(controlTweetImage, 30000);