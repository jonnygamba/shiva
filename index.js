const chokidar = require('chokidar')
const applescript = require('applescript')
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const sharp = require('sharp')

require('dotenv').config()

const sounds = require('./constants/sounds')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

const script =
  'tell application "Google Chrome" to get URL of active tab of front window as string'

// cloudinary.search
//   .expression("resource_type:image AND tags=new")
//   .with_field("metadata")
//   .with_field("tags")
//   .sort_by("public_id", "desc")
//   .max_results(30)
//   .execute()
//   .then((result) => console.log(result));

chokidar
  .watch('**/*.png', { ignoreInitial: true })
  .on('add', (fileName) => {
    applescript.execString(script, (err, rtn) => {
      if (err) console.log(err)
      const now = Date.now()
      const fileNameWebp = `${now}.webp`

      sharp(fileName)
        .resize({
          width: 500,
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .toFile(fileNameWebp, function (error) {
          if (error) console.log(error)
          setTimeout(() => {
            let ocr = ''
            try {
              ocr = fs.readFileSync('screenshot.txt')
            } catch (err) {
              console.log(err)
            }

            cloudinary.uploader.upload(
              fileNameWebp,
              {
                metadata: `metadata_user_id=1|metadata_url=${rtn}|metadata_ocr=${ocr
                  .toString()
                  .replace('|', '')}`,
                overwrite: true,
                notification_url:
                  'https://gilgamesh.jonnygamba.workers.dev/cards/new'
              },
              function (error, result) {
                if (error) {
                  console.log(error)
                  return
                }

                try {
                  fs.unlinkSync(fileName)
                  fs.unlinkSync(fileNameWebp)
                  displayNotification('file uploaded', {
                    sound: sounds[1]
                  })
                  fs.unlinkSync('screenshot.txt')
                } catch (err) {
                  console.error(err)
                }
                console.log(error, result)
              }
            )
          }, 1000)
        })
    })
  })
  .on('ready', () => {
    displayNotification('ready to process', { sound: sounds[0] })
  })

function displayNotification (message) {
  applescript.execString(
    `display notification "${message}" sound name "Frog"`,
    (err, results) => {
      if (err) {
        console.log(err)
      }
      console.log(results)
    }
  )
}

chokidar
  .watch('/Users/jonnygamba/nodejs/quezacotl/**/*.js', {
    gnored: ['**/node_modules/**/*', '**/.git/**/*'],
    ignoreInitial: true
  })
  .on('change', () => {
    applescript.execString(
      `tell application "Google Chrome" to set active tab index of first window to 1
    `,
      (err, rtn) => {
        if (err) console.log(err)
        return rtn
      }
    )
  })
