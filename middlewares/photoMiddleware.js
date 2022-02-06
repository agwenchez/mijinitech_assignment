const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const destination = 'public/assets'

module.exports = async (req, res, next) => {
    // console.log("Request data", req)
    try {
        await sharp(req.file.path)
            // .resize(cover)
            .jpeg({ quality: 100 })
            .toFile(path.resolve(destination, req.file.filename))

        fs.unlinkSync(req.file.path)
        req.image = req.file.filename

    } catch (error) {
        fs.unlinkSync(req.file.path)
        console.log("Error", error)
    }

    next()
}