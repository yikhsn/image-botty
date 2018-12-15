const config = require('./config');

const axios = require('axios');
const Twit = require('twit');
const Jimp = require('jimp'); 
const download = require('image-downloader');
const fs = require('fs');
const file = require('file-system');

const T = new Twit(config);

const onAuthenticated = (err, res) => {
  if (err) throw err;
  console.log('Authentication successful. Running bot...\r\n');
};

T.get('account/verify_credentials', {
  include_entities: false,
  skip_status: true,
  include_email: false
}, onAuthenticated);

const getData = async (id) => {
  const res = await axios(`https://www.bacaquran.online/api/ayat/${id}`);    

  return res.data;
};

const getAyat = (data) => {
  const ayat =`${data.terjemahan_idn} (${data.surat.nama_surat}:${data.nomor_ayat})`;
  return ayat;
};

const downloadImage = async() => {
  options = {
    url: 'https://source.unsplash.com/600x600/?islam,mosque,quran',
    dest: 'raw/photo.jpg' 
  };

  try {
    const { filename, image } = await download.image(options);
    console.log(`File saved tp ${ filename }`)
    
  } catch (error) {
    console.log(error);
  };   
};

const editImage = async (text) => {
  try {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    console.log(`Font loaded`);

    const image = await Jimp.read('raw/photo.jpg');
    console.log(`image loaded`);

    image.brightness( -0.6 )
    .print(
      font,
      100,
      100,
      {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      400,
      400
    )
    .write('export/photo.jpg');
    console.log(`image printed`);
  } catch (error) {
    console.log(error);
  }
};

const tweetIt = async() => {

  var b64content = fs.readFileSync('export/photo.jpg', { encoding: 'base64' });

  console.log('Uploading an image...');

  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    if (!err){
      console.log('Image uploaded!');
      console.log('Now tweeting it...');

      var mediaIdStr = data.media_id_string;
      var params = {
        status: '#quran',
        media_ids: [mediaIdStr]
      }

      T.post('statuses/update', params, function(err, data, response) {
        if (err){
          console.log('ERROR:');
          console.log(err);
        }
        else{
          console.log('Posted an image!');
        }
      });
    }
    else{
      console.log('ERROR:');
      console.log(err);
    }
  });
};

const controlTweetImage = async () => {
  const ran = Math.floor(Math.random() * (6223 - 1 + 1)) + 1;

  const data = await getData(ran);

  const ayat = getAyat(data);

  if (ayat.length < 240 ) {
 
    await downloadImage();
  
    editImage(ayat);

    tweetIt();
  }

  else console.log(`text lebih dari 240 karakter`);
};

setInterval(controlTweetImage, 7000);