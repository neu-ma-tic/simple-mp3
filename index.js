const fastify = require('fastify')()
const fs = require('fs')
const { spawn, exec } = require('child_process')

// downloading queue
let queue = []
let working = false
setInterval(() => {
    if (queue.length > 0 && !working) {
        let asda = queue.shift()
        asda[0](asda[1])
    }
}, 1000)

// http
fastify.get('/', async (request, reply) => {
    if (request.query.p) return reply.type("text/html").send(fs.readFileSync('./paste.html'))
    reply.type("text/html").send(fs.readFileSync('./index.html'))
})


fastify.post("/start", async (request, reply) => {
    let links = request.body?.links
    let isPlaylist = request.body?.isPlaylist
    // link validation?

    links.forEach((link, idx) => {
        let out = []
        queue.push([
            async (l) => {
                console.log(`Downloading ${l}`)
                working = true
                if (!fs.existsSync("./out")) fs.mkdirSync("./out")
                let s = spawn(`yt-dlp`, [`--extract-audio`, `-o`, `${process.cwd()}/out/%(title)s.%(ext)s`, `--audio-format`, `mp3`, `${l}`, `${isPlaylist ? '--yes-playlist' : ''}`])
    
                s.stdout.on('data', (data) => {
                    out.push(data.toString().trim())
                    console.log(`[YT-DLP] ${data}`)
                })
                s.stderr.on('data', (data) => {
                    out.push(data.toString().trim())
                    console.log(`[YT-DLP] ${data}`)
                })
                s.on('close', (code) => {
                    out.push(`Process exited with code ${code}`)
                    working = false

                    if (idx === links.length - 1) {
                        console.log(out)
                        reply.send({
                            message: "success",
                            links,
                            out
                        })
                    }
                })
    
                
            },
            link
        ])
    })
})

// listen
fastify.listen(3000)