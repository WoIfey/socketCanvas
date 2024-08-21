const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const port = 3010

const io = require('socket.io')(server, {
    cors: {
        origin: '*'
    },
})

type Point = { x: number, y: number }

type DrawLine = {
    prevPoint: Point | null
    currentPoint: Point
    color: string
}

io.on('connection', (socket: any) => {
    socket.on('client-ready', () => {
        socket.broadcast.emit('get-canvas-state')
    })

    socket.on('canvas-state', (state: string) => {
        socket.broadcast.emit('canvas-state-from-server', state)
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLine) => {
        socket.broadcast.emit('draw-line', { prevPoint, currentPoint, color })
    })

    socket.on('chat', (msg: any) => {
        io.emit('chat', msg, socket.id)
    })

    socket.on('clear', () => io.emit('clear'))
})

server.listen(port, () => {
    console.log(`Server on port ${port}`)
})