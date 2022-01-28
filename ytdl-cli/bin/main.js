#!/usr/bin/env node

var prompt = require('prompt')
const fs = require('fs')
const ytdl = require('ytdl-core')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const moment = require('moment')
const { arch } = require('os')
ffmpeg.setFfmpegPath(ffmpegPath)
const Args = process.argv.splice(2);
let data = {}

function msToHMS( ms ) {
    // 1- Convert to seconds:
    let seconds = ms / 1000;
    // 2- Extract hours:
    const hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return `${hours}:${minutes}:${seconds}`
}

const main = async (data) => {
    const regex = /[^A-Za-z0-9]/g;
    let info = await ytdl.getInfo(data.link).catch((error) => console.log("can't find video!"));
    if(info){
        data.songName ? data.songName = data.songName.replace(regex, "") : data.songName = info.videoDetails.title.replace(regex, "")
        console.log(`Downloading:${data.songName}`);
        ytdl(data.link, { filter: 'audioonly' })
            .pipe(fs.createWriteStream(`${process.cwd()}/${data.songName}.mp4`))
            .on("finish", () => {
                data.startTime && data.endTime ? trim(data) : console.log("done")
            })
    }
}
const trim = (data) => {
    console.log("Trimming")
    let t1 = data.startTime.split(":");
    let t2 = data.endTime.split(":");
    var duration = moment().hour(t2[0]).minute(t2[1]).second(t2[2]).subtract(t1[0],'hours').subtract(t1[1], 'minutes').subtract(t1[2], 'seconds').format("HH:mm:ss");
    ffmpeg(`${process.cwd()}/${data.songName}.mp4`)
        .setStartTime(data.startTime)
        .setDuration(duration)
        .output(`${process.cwd()}/ytdl${data.songName}.mp4`)
        .on('end', function (err) {
            if (!err) { console.log('conversion Done') }
        })
        .on('error', function (err) {
            console.log('error: ', err)
        }).run()
}

const pleb = () =>{
    prompt.get([{
        name: 'link',
        required: true,
        description: "youtube link:"
    }, {
        name: 'startTime'
    },{
        name: 'endTime'
    },{
        name: 'songName'
    }], (err, data) => {
        main(data);
    });
}

switch(Number(Args.length)){
    case 0:
        pleb();
        break
    case 1:
        data.link = Args[0]
        main(data)
        break
    case 2:
        data.link = Args[0]
        data.songName = Args[1]
        main(data)
        break
    case 4:
        data.link = Args[0]
        data.songName = Args[1]
        data.startTime = Args[2]
        data.endTime = Args[3]
        main(data)
        break
    default:
        console.log("please give either 0,1, 2, 4 arguments.");
}